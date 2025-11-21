const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const { configureCloudinary } = require("../utils/cloudinary");

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

module.exports = router;