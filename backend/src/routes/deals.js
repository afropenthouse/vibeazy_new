const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const { configureCloudinary } = require("../utils/cloudinary");
const { verifyToken } = require("../utils/jwt");

const router = express.Router();

// 5MB image upload for user submissions
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    const cloudinary = configureCloudinary();
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No image uploaded" });
    const result = await cloudinary.uploader.upload_stream({ folder: "vibeazy/user-submissions" }, (error, data) => {
      if (error) {
        return res.status(500).json({ error: "Cloudinary upload failed" });
      }
      res.json({ url: data.secure_url });
    });
    const stream = result;
    stream.end(file.buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload error" });
  }
});

router.post("/save", auth, async (req, res) => {
  const prisma = req.prisma;
  const { dealId, dealTitle, dealData } = req.body || {};
  if (!dealId) return res.status(400).json({ error: "dealId required" });
  try {
    const saved = await prisma.savedDeal.create({
      data: {
        userId: req.user.id,
        dealId: Number(dealId),
        dealTitle: dealTitle || null,
        dealData: dealData ? dealData : null,
      },
    });
    res.json({ saved });
  } catch (e) {
    if (e && e.code === "P2002") {
      return res.status(409).json({ error: "Already saved" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/saved", auth, async (req, res) => {
  const prisma = req.prisma;
  const items = await prisma.savedDeal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items });
});

router.delete("/unsave/:dealId", auth, async (req, res) => {
  const prisma = req.prisma;
  const dealId = Number(req.params.dealId);
  await prisma.savedDeal.deleteMany({ where: { userId: req.user.id, dealId } });
  res.json({ ok: true });
});

// Submit a deal for admin verification
router.post("/submit", auth, async (req, res) => {
  const prisma = req.prisma;
  const data = req.body || {};
  if (!data.merchantName || !data.city || !data.imageUrl) {
    return res.status(400).json({ error: "merchantName, city, imageUrl are required" });
  }
  const paymentRef = data.paymentRef || data.paymentReference || null;
  if (!paymentRef) {
    return res.status(402).json({ error: "Payment required" });
  }
  try {
    const payment = await prisma.payment.findUnique({ where: { reference: paymentRef } });
    if (!payment || payment.userId !== req.user.id) {
      return res.status(404).json({ error: "Payment not found" });
    }
    if (payment.status !== "success") {
      return res.status(402).json({ error: "Payment not completed" });
    }
    if (payment.used) {
      return res.status(400).json({ error: "Payment already used" });
    }

    // Ensure we always have a non-empty title (Prisma schema requires it)
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
    const sub = await prisma.userDealSubmission.create({
      data: {
        title: titleCandidate,
        userId: req.user.id,
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
        deepLink: data.deepLink || null,
        status: "pending",
      },
    });
    await prisma.payment.update({
      where: { reference: paymentRef },
      data: { used: true, usedAt: new Date(), submissionId: sub.id },
    });
    res.status(201).json({ submission: sub });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to submit deal" });
  }
});

// List my submissions
router.get("/my-submissions", auth, async (req, res) => {
  const prisma = req.prisma;
  const items = await prisma.userDealSubmission.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items });
});

// Update my submission (user-owned, only if not approved)
router.patch("/my-submissions/:id", auth, async (req, res) => {
  const prisma = req.prisma;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const existing = await prisma.userDealSubmission.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Submission not found" });
    }
    if (existing.status === "approved") {
      return res.status(400).json({ error: "Approved submissions cannot be edited" });
    }

    const data = req.body || {};
    // Recalculate discountPct if price fields provided
    let discountPct = data.discountPct ?? existing.discountPct ?? null;
    if ((data.oldPrice ?? null) !== null && (data.newPrice ?? null) !== null) {
      const oldP = Number(data.oldPrice);
      const newP = Number(data.newPrice);
      if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
        discountPct = Math.round(((oldP - newP) / oldP) * 100);
      }
    }

    const updated = await prisma.userDealSubmission.update({
      where: { id },
      data: {
        description: data.description ?? existing.description,
        merchantName: data.merchantName ?? existing.merchantName,
        city: data.city ?? existing.city,
        category: data.category ?? existing.category,
        tags: Array.isArray(data.tags) ? data.tags : existing.tags,
        imageUrl: data.imageUrl ?? existing.imageUrl,
        oldPrice: data.oldPrice ?? existing.oldPrice,
        newPrice: data.newPrice ?? existing.newPrice,
        discountPct,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt,
        deepLink: data.deepLink ?? existing.deepLink,
        // If previously rejected, editing moves it back to pending for re-review
        status: existing.status === "rejected" ? "pending" : existing.status,
      },
    });
    res.json({ submission: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

// Track interest (click) for a deal or submission
router.post("/interest", async (req, res) => {
  const prisma = req.prisma;
  const { dealId: rawDealId, submissionId: rawSubmissionId } = req.body || {};
  const dealId = rawDealId != null ? Number(rawDealId) : null;
  const submissionId = rawSubmissionId != null ? Number(rawSubmissionId) : null;
  if (!dealId && !submissionId) return res.status(400).json({ error: "dealId or submissionId required" });

  // Optional auth: associate interest to logged-in user if token exists
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const decoded = token ? verifyToken(token) : null;
  const userId = decoded?.id || null;

  try {
    if (userId && dealId) {
      const existing = await prisma.dealInterest.findFirst({ where: { userId, dealId } });
      if (existing) return res.json({ ok: true, existed: true });
      const created = await prisma.dealInterest.create({ data: { userId, dealId } });
      return res.json({ ok: true, interest: created });
    }
    if (userId && submissionId) {
      const existing = await prisma.dealInterest.findFirst({ where: { userId, submissionId } });
      if (existing) return res.json({ ok: true, existed: true });
      const created = await prisma.dealInterest.create({ data: { userId, submissionId } });
      return res.json({ ok: true, interest: created });
    }
    // Anonymous interest (no userId)
    const created = await prisma.dealInterest.create({ data: { dealId: dealId || null, submissionId: submissionId || null } });
    return res.json({ ok: true, interest: created });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to record interest" });
  }
});

// Get interest count for a deal or submission
router.get("/interest/count", async (req, res) => {
  const prisma = req.prisma;
  const dealId = req.query.dealId != null ? Number(req.query.dealId) : null;
  const submissionId = req.query.submissionId != null ? Number(req.query.submissionId) : null;
  if (!dealId && !submissionId) return res.status(400).json({ error: "dealId or submissionId required" });
  try {
    const where = dealId ? { dealId } : { submissionId };
    const total = await prisma.dealInterest.count({ where });
    const users = await prisma.dealInterest.count({ where: { ...where, userId: { not: null } } });
    res.json({ total, users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load interest count" });
  }
});

// Aggregated counts for my submissions (unique logged-in users only)
router.get("/interest/counts/my-submissions", auth, async (req, res) => {
  const prisma = req.prisma;
  try {
    const subs = await prisma.userDealSubmission.findMany({ where: { userId: req.user.id }, select: { id: true, dealId: true } });
    const counts = {};
    await Promise.all(
      subs.map(async (s) => {
        const submissionClicks = await prisma.dealInterest.count({ where: { submissionId: s.id } });
        const dealClicks = s.dealId ? await prisma.dealInterest.count({ where: { dealId: s.dealId } }) : 0;
        counts[s.id] = submissionClicks + dealClicks;
      })
    );
    res.json({ counts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load interest counts" });
  }
});

// List interested users (with phone numbers) for a submission owned by current user
router.get("/interest/users/:submissionId", auth, async (req, res) => {
  const prisma = req.prisma;
  const submissionId = Number(req.params.submissionId);
  if (!Number.isFinite(submissionId)) return res.status(400).json({ error: "Invalid submissionId" });
  try {
    const sub = await prisma.userDealSubmission.findUnique({ where: { id: submissionId } });
    if (!sub || sub.userId !== req.user.id) return res.status(404).json({ error: "Submission not found" });
    const interests = await prisma.dealInterest.findMany({
      where: { submissionId, userId: { not: null } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    const users = interests
      .map((i) => ({ id: i.user?.id, name: i.user?.name || "", email: i.user?.email || "", phone: i.user?.phone || null }))
      .filter((u) => u.id != null);
    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load interested users" });
  }
});

// List interested users for a Deal (approved submission mapped to a deal)
router.get("/interest/users/by-deal/:dealId", auth, async (req, res) => {
  const prisma = req.prisma;
  const dealId = Number(req.params.dealId);
  if (!Number.isFinite(dealId)) return res.status(400).json({ error: "Invalid dealId" });
  try {
    const interests = await prisma.dealInterest.findMany({
      where: { dealId, userId: { not: null } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    const users = interests
      .map((i) => ({ id: i.user?.id, name: i.user?.name || "", email: i.user?.email || "", phone: i.user?.phone || null }))
      .filter((u) => u.id != null);
    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load interested users" });
  }
});

// Redirect to merchant product link for sharing
router.get("/go/deal/:dealId", async (req, res) => {
  const prisma = req.prisma;
  const dealId = Number(req.params.dealId);
  if (!Number.isFinite(dealId)) return res.status(400).send("Invalid dealId");
  try {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    const fallbackBase = (process.env.WEB_URL || process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/+$/, "");
    const baseFallback = `${fallbackBase}/deal/${dealId}`;
    let target = deal?.deepLink || null;
    if (!target) return res.redirect(baseFallback);
    const url = new URL(target);
    const ref = req.query.ref ? String(req.query.ref) : null;
    if (ref) url.searchParams.set("ref", ref);
    url.searchParams.set("utm_source", "vibeazy");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "deal_referral");
    return res.redirect(url.toString());
  } catch (e) {
    return res.redirect((process.env.WEB_URL || process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000") + `/deal/${dealId}`);
  }
});

module.exports = router;
