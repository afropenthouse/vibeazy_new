const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const adminAuth = require("../middleware/admin");
const { signToken } = require("../utils/jwt");
const { configureCloudinary } = require("../utils/cloudinary");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
  const deals = await prisma.deal.findMany({ where, orderBy: [{ discountPct: "desc" }, { createdAt: "desc" }] });
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
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
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
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
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