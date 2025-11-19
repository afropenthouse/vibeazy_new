const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const adminAuth = require("../middleware/admin");
const { signToken } = require("../utils/jwt");
const { configureCloudinary } = require("../utils/cloudinary");
const { extractProductFromUrl } = require("../utils/extractProduct");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: ensure descriptions are a single sentence for card UI
function oneSentence(desc, maxChars = 180) {
  if (!desc) return null;
  const txt = String(desc).replace(/\s+/g, " ").trim();
  const m = txt.match(/[.!?]/);
  if (m) {
    const end = txt.indexOf(m[0]);
    return txt.slice(0, end + 1);
  }
  const slice = txt.slice(0, maxChars).replace(/\s+\S*$/, "");
  return slice.length ? `${slice}.` : txt;
}

function splitCsvRow(s) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (q && s[i + 1] === '"') { cur += '"'; i++; }
      else { q = !q; }
    } else if (c === ',' && !q) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = splitCsvRow(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvRow(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
    rows.push(obj);
  }
  return rows;
}

function limitWords(s, n = 4) {
  if (!s) return null;
  const words = String(s).trim().split(/\s+/).filter(Boolean);
  const take = words.slice(0, n).join(" ");
  return take || null;
}

// Admin login using single env credentials
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const prisma = req.prisma;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    // Prefer DB-backed admin if present
    if (prisma && prisma.admin) {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (admin) {
        const passOk = await bcrypt.compare(password, admin.passwordHash);
        if (!passOk) return res.status(401).json({ error: "Invalid credentials" });
        const token = signToken({ role: admin.role || "ADMIN", email: admin.email });
        return res.json({ token });
      }
    }

    // Fallback to env-based admin (legacy behavior)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }
    const emailOk = email === ADMIN_EMAIL;
    const passOk = ADMIN_PASSWORD.startsWith("$2a$")
      ? await bcrypt.compare(password, ADMIN_PASSWORD) // support hashed env password
      : password === ADMIN_PASSWORD;
    if (!emailOk || !passOk) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken({ role: "ADMIN", email: ADMIN_EMAIL });
    res.json({ token });
  } catch (e) {
    console.error('Admin login error', e);
    res.status(500).json({ error: 'Login error' });
  }
});

// Upload image to Cloudinary, returns URL
router.post("/upload", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const cloudinary = configureCloudinary();
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No image uploaded" });
    const result = await cloudinary.uploader.upload_stream({ folder: "vibeazy/deals" }, (error, data) => {
      if (error) {
        return res.status(500).json({ error: "Cloudinary upload failed" });
      }
      res.json({ url: data.secure_url });
    });
    // Pipe buffer into upload_stream
    const stream = result; // returned writable stream
    stream.end(file.buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload error" });
  }
});

// Create a deal
router.post("/deals", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const data = req.body || {};
  if (!data.merchantName || !data.city || !data.imageUrl) {
    return res.status(400).json({ error: "merchantName, city, imageUrl are required" });
  }
  try {
    // Ensure non-empty title for Deal model (required by schema)
    const titleCandidate = String((data.title ?? data.description ?? data.merchantName) || "").trim();
    if (!titleCandidate) {
      return res.status(400).json({ error: "title or description required" });
    }
    // Auto-calculate discountPct server-side if not provided
    let discountPct = data.discountPct ?? null;
    if ((data.oldPrice ?? null) !== null && (data.newPrice ?? null) !== null) {
      const oldP = Number(data.oldPrice);
      const newP = Number(data.newPrice);
      if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
        discountPct = Math.round(((oldP - newP) / oldP) * 100);
      }
    }
    const deal = await prisma.deal.create({ data: {
      title: titleCandidate,
      description: data.description || null,
      merchantName: data.merchantName,
      city: data.city,
      category: data.category || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      imageUrl: data.imageUrl,
      oldPrice: data.oldPrice ?? null,
      newPrice: data.newPrice ?? null,
      discountPct,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      deepLink: data.deepLink || null,
    } });
    res.status(201).json({ deal });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// Bulk create deals (temporary helper for admin)
router.post("/deals/bulk", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const body = req.body || {};
  const items = Array.isArray(body.deals)
    ? body.deals
    : Array.isArray(body.items)
      ? body.items
      : [];
  if (!items.length) {
    return res.status(400).json({ error: "Provide an array of deals in 'deals' or 'items'" });
  }
  if (items.length > 500) {
    return res.status(400).json({ error: "Too many items. Max 500 per request." });
  }

  // Normalize and validate each item
  const toCreate = [];
  const errors = [];

  const autoDiscount = (oldPrice, newPrice) => {
    if (oldPrice === undefined || newPrice === undefined || oldPrice === null || newPrice === null) return null;
    const oldP = Number(oldPrice);
    const newP = Number(newPrice);
    if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
      return Math.round(((oldP - newP) / oldP) * 100);
    }
    return null;
  };

  items.forEach((raw, idx) => {
    const data = raw || {};
    const merchantName = String(data.merchantName || "").trim();
    const city = String(data.city || "").trim();
    const imageUrl = String(data.imageUrl || "").trim();
    const titleCandidate = String((data.title ?? data.description ?? merchantName) || "").trim();
    if (!merchantName || !city || !imageUrl || !titleCandidate) {
      errors.push({ index: idx, error: "Missing required fields (merchantName, city, imageUrl, title/description)" });
      return;
    }
    const oldPrice = data.oldPrice ?? null;
    const newPrice = data.newPrice ?? null;
    const discountPct = data.discountPct ?? autoDiscount(oldPrice, newPrice);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    const tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string" && data.tags.length
        ? data.tags.split("|").map((t) => t.trim()).filter(Boolean)
        : [];

    toCreate.push({
      title: titleCandidate,
      description: data.description || null,
      merchantName,
      city,
      category: data.category || null,
      tags,
      imageUrl,
      oldPrice,
      newPrice,
      discountPct,
      expiresAt,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      deepLink: data.deepLink || null,
    });
  });

  if (!toCreate.length) {
    return res.status(400).json({ error: "No valid items to create", errors });
  }

  try {
    // Use transaction of individual creates so we can return created records
    const created = await prisma.$transaction(
      toCreate.map((data) => prisma.deal.create({ data }))
    );
    res.status(201).json({ createdCount: created.length, errors, created });
  } catch (e) {
    console.error("Bulk create error", e);
    res.status(500).json({ error: "Failed to bulk create deals" });
  }
});

router.post("/deals/bulk-csv", adminAuth, upload.single("file"), async (req, res) => {
  const prisma = req.prisma;
  const file = req.file;
  const defaults = req.body && typeof req.body.defaults === "string"
    ? JSON.parse(req.body.defaults)
    : (req.body?.defaults || {});
  if (!file || !file.buffer) return res.status(400).json({ error: "Upload a CSV file as 'file'" });

  const autoDiscount = (oldPrice, newPrice) => {
    if (oldPrice === undefined || newPrice === undefined || oldPrice === null || newPrice === null) return null;
    const oldP = Number(oldPrice);
    const newP = Number(newPrice);
    if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
      return Math.round(((oldP - newP) / oldP) * 100);
    }
    return null;
  };

  try {
    const rows = parseCsv(file.buffer.toString("utf8"));
    const toCreate = [];
    const errors = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx] || {};
      const merchantName = String(r.merchantName || defaults.merchantName || "").trim();
      const city = String(r.city || defaults.city || "").trim();
      const imageUrl = String(r.imageUrl || defaults.imageUrl || "").trim();
      const titleCandidate = String((r.title ?? r.description ?? merchantName) || "").trim();
      if (!merchantName || !city || !imageUrl || !titleCandidate) {
        errors.push({ index: idx, error: "Missing required fields (merchantName, city, imageUrl, title/description)" });
        continue;
      }

      const oldPrice = r.oldPrice !== undefined && r.oldPrice !== "" ? Number(r.oldPrice) : (defaults.oldPrice ?? null);
      const newPrice = r.newPrice !== undefined && r.newPrice !== "" ? Number(r.newPrice) : (defaults.newPrice ?? null);
      const discountPct = r.discountPct !== undefined && r.discountPct !== ""
        ? Number(r.discountPct)
        : autoDiscount(oldPrice, newPrice);
      const expiresAt = r.expiresAt ? new Date(r.expiresAt) : (defaults.expiresAt ? new Date(defaults.expiresAt) : null);
      const tagsRaw = r.tags ?? defaults.tags ?? [];
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw
        : typeof tagsRaw === "string" && tagsRaw.length
          ? tagsRaw.split("|").map((t) => t.trim()).filter(Boolean)
          : [];

      toCreate.push({
        title: titleCandidate,
        description: r.description || defaults.description || null,
        merchantName,
        city,
        category: r.category || defaults.category || null,
        tags,
        imageUrl,
        oldPrice: oldPrice ?? null,
        newPrice: newPrice ?? null,
        discountPct,
        expiresAt,
        deepLink: r.deepLink || defaults.deepLink || null,
        isActive: r.isActive !== undefined ? (String(r.isActive).toLowerCase() !== "false") : true,
      });
    }

    if (!toCreate.length) return res.status(400).json({ error: "No valid rows", errors });
    const created = await prisma.$transaction(toCreate.map((data) => prisma.deal.create({ data })));
    res.status(201).json({ createdCount: created.length, errors, created });
  } catch (e) {
    res.status(400).json({ error: "Invalid CSV" });
  }
});

// Bulk create deals and upload each image to Cloudinary
// Body: { items: DealInput[], options?: { uploadToCloudinary?: boolean } }
// DealInput: { title?, description?, merchantName, city, category?, tags?, imageUrl, oldPrice?, newPrice?, discountPct?, expiresAt?, deepLink?, isActive? }
router.post("/deals/bulk-upload", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const uploadToCloudinary = body.options?.uploadToCloudinary !== false; // default true
  if (!items.length) return res.status(400).json({ error: "Provide an array of items in 'items'" });

  const cloudinary = configureCloudinary();
  const created = [];
  const errors = [];

  const autoDiscount = (oldPrice, newPrice) => {
    if (oldPrice === undefined || newPrice === undefined || oldPrice === null || newPrice === null) return null;
    const oldP = Number(oldPrice);
    const newP = Number(newPrice);
    if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
      return Math.round(((oldP - newP) / oldP) * 100);
    }
    return null;
  };

  for (let idx = 0; idx < items.length; idx++) {
    const raw = items[idx] || {};
    try {
      const merchantName = String(raw.merchantName || "").trim();
      const city = String(raw.city || "").trim();
      let imageUrl = String(raw.imageUrl || "").trim();
      const titleCandidate = String((raw.title ?? raw.description ?? merchantName) || "").trim();
      if (!merchantName || !city || !imageUrl || !titleCandidate) {
        throw new Error("Missing fields (merchantName, city, imageUrl, title/description)");
      }

      // Upload to Cloudinary if requested
      if (uploadToCloudinary) {
        const uploadRes = await cloudinary.uploader.upload(imageUrl, { folder: "vibeazy/deals" });
        imageUrl = uploadRes.secure_url;
      }

      const oldPrice = raw.oldPrice ?? null;
      const newPrice = raw.newPrice ?? null;
      const discountPct = raw.discountPct ?? autoDiscount(oldPrice, newPrice);
      const expiresAt = raw.expiresAt ? new Date(raw.expiresAt) : null;
      const tags = Array.isArray(raw.tags)
        ? raw.tags
        : typeof raw.tags === "string" && raw.tags.length
          ? raw.tags.split("|").map((t) => t.trim()).filter(Boolean)
          : [];

      const deal = await prisma.deal.create({ data: {
        title: titleCandidate,
        description: oneSentence(raw.description || null),
        merchantName,
        city,
        category: raw.category || null,
        tags,
        imageUrl,
        oldPrice,
        newPrice,
        discountPct,
        expiresAt,
        deepLink: raw.deepLink || null,
        isActive: raw.isActive !== undefined ? !!raw.isActive : true,
      } });
      created.push(deal);
    } catch (e) {
      errors.push({ index: idx, error: String(e?.message || e) });
    }
  }

  res.status(201).json({ createdCount: created.length, created, errors });
});

// Create deals by pasting product URLs. Uploads image to Cloudinary.
// Body: { urls: string[], defaults?: { merchantName, city, category, expiresAt, deepLink } }
router.post("/deals/extract", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const body = req.body || {};
  const urls = Array.isArray(body.urls) ? body.urls.filter(Boolean) : [];
  const defaults = body.defaults || {};
  if (!urls.length) return res.status(400).json({ error: "Provide 'urls' as an array" });
  if (!defaults.city || !String(defaults.city).trim()) {
    return res.status(400).json({ error: "defaults.city is required" });
  }
  const cloudinary = configureCloudinary();

  const created = [];
  const errors = [];
  for (const url of urls) {
    try {
      const data = await extractProductFromUrl(url);
      const titleCandidate = String(data.title || defaults.title || url).trim();
      if (!titleCandidate) throw new Error("Could not extract title");
      // Determine merchant from defaults or hostname
      const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; } })();
      const merchantName = (defaults.merchantName || host || "").trim();
      if (!merchantName) throw new Error("Provide defaults.merchantName or use a valid URL");

      // Upload image to Cloudinary if we got one
      let imageUrl = data.imageUrl || defaults.imageUrl || null;
      if (!imageUrl) throw new Error("No imageUrl found in page");
      const uploadRes = await cloudinary.uploader.upload(imageUrl, { folder: "vibeazy/deals" });
      const cloudUrl = uploadRes.secure_url;

      // Price mapping: extract both old and new when available
      let newPrice = data.newPrice ?? null;
      let oldPrice = data.oldPrice ?? defaults.oldPrice ?? null;
      let discountPct = defaults.discountPct !== undefined ? Number(defaults.discountPct) : null;
      if (discountPct === null && oldPrice !== null && newPrice !== null && Number(oldPrice) > 0 && Number(newPrice) >= 0 && Number(newPrice) <= Number(oldPrice)) {
        discountPct = Math.round(((Number(oldPrice) - Number(newPrice)) / Number(oldPrice)) * 100);
      }
      if (discountPct !== null) {
        if (newPrice !== null && oldPrice === null) {
          oldPrice = Math.round(Number(newPrice) / (1 - discountPct / 100));
        } else if (oldPrice !== null && newPrice === null) {
          newPrice = Math.round(Number(oldPrice) * (1 - discountPct / 100));
        }
      }

      const deal = await prisma.deal.create({ data: {
        title: titleCandidate,
        description: limitWords(data.description || defaults.description || null, defaults.maxDescriptionWords || 4),
        merchantName,
        city: String(defaults.city).trim(),
        category: defaults.category || null,
        tags: Array.isArray(defaults.tags) ? defaults.tags : [],
        imageUrl: cloudUrl,
        oldPrice: oldPrice ?? null,
        newPrice: newPrice ?? null,
        discountPct,
        expiresAt: defaults.expiresAt ? new Date(defaults.expiresAt) : null,
        deepLink: url,
        isActive: true,
      } });
      created.push(deal);
    } catch (e) {
      errors.push({ url, error: String(e?.message || e) });
    }
  }

  res.status(201).json({ createdCount: created.length, created, errors });
});

router.post("/deals/crawl", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const body = req.body || {};
  const startUrl = String(body.startUrl || "").trim();
  const defaults = body.defaults || {};
  const limit = Number(body.limit || 50);
  if (!startUrl) return res.status(400).json({ error: "startUrl required" });
  if (!defaults.city) return res.status(400).json({ error: "defaults.city required" });

  const { extractProductFromUrl } = require("../utils/extractProduct");
  const { configureCloudinary } = require("../utils/cloudinary");
  const cheerio = require("cheerio");

  try {
    const cloudinary = configureCloudinary();
    const resp = await fetch(startUrl);
    if (!resp.ok) return res.status(400).json({ error: `Failed to fetch ${startUrl}` });
    const html = await resp.text();
    const $ = cheerio.load(html);
    const host = new URL(startUrl).origin;
    const hrefs = new Set();
    $('a[href]').each((_, el) => {
      let href = $(el).attr('href') || '';
      href = href.trim();
      if (!href) return;
      if (href.startsWith('/')) href = host + href;
      if (!/^https?:/i.test(href)) return;
      try {
        const u = new URL(href);
        if (u.origin !== host) return;
        if (u.pathname.length < 2) return;
        if (/\.(jpg|jpeg|png|webp|gif)$/i.test(u.pathname)) return;
        if (/contact|about|login|signup|cart|terms|privacy/i.test(u.pathname)) return;
        const pathPref = String(defaults.pathIncludes || '').trim();
        if (pathPref) {
          if (!u.pathname.toLowerCase().includes(pathPref.toLowerCase())) return;
        } else {
          if (/carkobo\.com/i.test(host)) {
            if (!/\/listings\//i.test(u.pathname)) return;
          }
        }
        hrefs.add(u.toString());
      } catch {}
    });

    const candidates = Array.from(hrefs).slice(0, Math.max(1, limit * 3));
    const created = [];
    const errors = [];
    for (const url of candidates) {
      if (created.length >= limit) break;
      try {
        const data = await extractProductFromUrl(url);
        const titleCandidate = String(data.title || defaults.title || url).trim();
        if (!titleCandidate || !data.imageUrl) { errors.push({ url, error: "No product data" }); continue; }
        const uploadRes = await cloudinary.uploader.upload(data.imageUrl, { folder: "vibeazy/deals" });
        const cloudUrl = uploadRes.secure_url;
        let newPrice = data.newPrice ?? null;
        let oldPrice = data.oldPrice ?? defaults.oldPrice ?? null;
        let discountPct = defaults.discountPct !== undefined ? Number(defaults.discountPct) : null;
        if (discountPct === null && oldPrice !== null && newPrice !== null && Number(oldPrice) > 0 && Number(newPrice) >= 0 && Number(newPrice) <= Number(oldPrice)) {
          discountPct = Math.round(((Number(oldPrice) - Number(newPrice)) / Number(oldPrice)) * 100);
        }
        if (discountPct !== null) {
          if (newPrice !== null && oldPrice === null) {
            oldPrice = Math.round(Number(newPrice) / (1 - discountPct / 100));
          } else if (oldPrice !== null && newPrice === null) {
            newPrice = Math.round(Number(oldPrice) * (1 - discountPct / 100));
          }
        }
        const deal = await prisma.deal.create({ data: {
          title: titleCandidate,
          description: limitWords(data.description || defaults.description || null, defaults.maxDescriptionWords || 4),
          merchantName: String(defaults.merchantName || new URL(startUrl).hostname.replace(/^www\./, "")).trim(),
          city: String(defaults.city).trim(),
          category: defaults.category || null,
          tags: Array.isArray(defaults.tags) ? defaults.tags : [],
          imageUrl: cloudUrl,
          oldPrice: oldPrice ?? null,
          newPrice: newPrice ?? null,
          discountPct,
          expiresAt: defaults.expiresAt ? new Date(defaults.expiresAt) : null,
          deepLink: url,
          isActive: true,
        } });
        created.push(deal);
      } catch (e) {
        errors.push({ url, error: String(e?.message || e) });
      }
    }

    res.status(201).json({ createdCount: created.length, created, errors });
  } catch (e) {
    res.status(500).json({ error: "Crawl failed" });
  }
});

// List all deals (admin)
router.get("/deals", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const deals = await prisma.deal.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ deals });
});

// Update deal
router.patch("/deals/:id", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const body = req.body || {};

    // Build a safe update payload with proper type coercion
    const has = (v) => v !== undefined;
    const toNum = (v) => {
      if (v === null) return null;
      if (v === undefined || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const data = {};
    if (has(body.description)) data.description = body.description || null;
    if (has(body.merchantName)) data.merchantName = body.merchantName;
    if (has(body.city)) data.city = body.city;
    if (has(body.category)) data.category = body.category || null;
    if (has(body.tags)) data.tags = Array.isArray(body.tags) ? body.tags : [];
    if (has(body.imageUrl)) data.imageUrl = body.imageUrl;
    const oldPrice = toNum(body.oldPrice);
    const newPrice = toNum(body.newPrice);
    if (oldPrice !== undefined) data.oldPrice = oldPrice === null ? null : oldPrice;
    if (newPrice !== undefined) data.newPrice = newPrice === null ? null : newPrice;
    // Recalculate discountPct if prices provided, otherwise use supplied value
    let discountPct = body.discountPct !== undefined ? toNum(body.discountPct) : undefined;
    if (oldPrice !== undefined && newPrice !== undefined && oldPrice !== null && newPrice !== null && oldPrice > 0 && newPrice >= 0 && newPrice <= oldPrice) {
      discountPct = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    }
    if (discountPct !== undefined) data.discountPct = discountPct === null ? null : discountPct;

    if (has(body.expiresAt)) {
      if (!body.expiresAt) {
        data.expiresAt = null;
      } else {
        // Accept either Date, ISO string, or yyyy-mm-dd string
        const dt = new Date(body.expiresAt);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({ error: "Invalid expiresAt" });
        }
        data.expiresAt = dt;
      }
    }
    if (has(body.deepLink)) data.deepLink = body.deepLink || null;
    if (has(body.isActive)) data.isActive = !!body.isActive;

    const deal = await prisma.deal.update({ where: { id }, data });
    res.json({ deal });
  } catch (e) {
    // Prisma not found error
    if (e && (e.code === "P2025" || /not found/i.test(String(e?.message)))) {
      return res.status(404).json({ error: "Deal not found" });
    }
    console.error("Update deal error", e);
    res.status(400).json({ error: "Invalid update payload" });
  }
});

// Delete deal
router.delete("/deals/:id", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  await prisma.deal.delete({ where: { id } });
  res.json({ ok: true });
});

// Public deals feed for webapp
router.get("/public/deals", async (req, res) => {
  const prisma = req.prisma;
  const { city, category } = req.query;
  const where = { isActive: true };
  if (city) where.city = city;
  if (category) where.category = category;
  let deals = await prisma.deal.findMany({ where, orderBy: [{ discountPct: "desc" }, { createdAt: "desc" }] });
  const group = new Map();
  for (const d of deals) {
    const key = d.category || "";
    const arr = group.get(key) || [];
    arr.push(d);
    group.set(key, arr);
  }
  const keys = Array.from(group.keys());
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;
  }
  for (const k of keys) {
    const arr = group.get(k);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
  const mixed = [];
  let remaining = deals.length;
  while (remaining > 0) {
    for (const k of keys) {
      const arr = group.get(k);
      if (arr && arr.length) {
        mixed.push(arr.shift());
        remaining--;
      }
    }
  }
  deals = mixed;
  res.json({ deals });
});

// Public single deal by id
router.get("/public/deals/:id", async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const deal = await prisma.deal.findFirst({ where: { id, isActive: true } });
  if (!deal) return res.status(404).json({ error: "Deal not found" });
  res.json({ deal });
});

// Admin: list users
router.get("/users", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, emailVerified: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const counts = {
    users: await prisma.user.count(),
    deals: await prisma.deal.count(),
    savedDeals: await prisma.savedDeal.count(),
  };
  res.json({ users, counts });
});

// Categories management
router.get("/categories", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  res.json({ categories });
});

router.post("/categories", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: "name required" });
  try {
    const cat = await prisma.category.create({ data: { name: String(name).trim() } });
    res.status(201).json({ category: cat });
  } catch (e) {
    if (e && e.code === "P2002") return res.status(409).json({ error: "Category exists" });
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.delete("/categories/:id", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  try {
    await prisma.category.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: "Category not found" });
  }
});

// Update category name
router.patch("/categories/:id", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  const { name } = req.body || {};
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  if (!name || !String(name).trim()) return res.status(400).json({ error: "name required" });
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name: String(name).trim() },
    });
    res.json({ category });
  } catch (e) {
    if (e && e.code === "P2002") return res.status(409).json({ error: "Category exists" });
    res.status(404).json({ error: "Category not found" });
  }
});

// Public categories
router.get("/public/categories", async (req, res) => {
  const prisma = req.prisma;
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  res.json({ categories });
});

// User submissions management (admin)
router.get("/submissions", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const { status } = req.query;
  const where = status ? { status } : {};
  const subs = await prisma.userDealSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json({ submissions: subs });
});

router.patch("/submissions/:id", adminAuth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  const { action } = req.body || {};
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  if (!action || !["approve", "reject"].includes(action)) return res.status(400).json({ error: "action must be approve or reject" });
  const sub = await prisma.userDealSubmission.findUnique({ where: { id } });
  if (!sub) return res.status(404).json({ error: "Submission not found" });
  if (action === "reject") {
    const updated = await prisma.userDealSubmission.update({ where: { id }, data: { status: "rejected" } });
    return res.json({ submission: updated });
  }
  // approve: create Deal and mark approved
  const deal = await prisma.deal.create({ data: {
    title: sub.title,
    description: sub.description,
    merchantName: sub.merchantName,
    city: sub.city,
    category: sub.category,
    tags: sub.tags,
    imageUrl: sub.imageUrl,
    oldPrice: sub.oldPrice,
    newPrice: sub.newPrice,
    discountPct: sub.discountPct,
    expiresAt: sub.expiresAt,
    deepLink: sub.deepLink,
    isActive: true,
  } });
  const updated = await prisma.userDealSubmission.update({ where: { id }, data: { status: "approved", dealId: deal.id } });
  res.json({ submission: updated, deal });
});

module.exports = router;