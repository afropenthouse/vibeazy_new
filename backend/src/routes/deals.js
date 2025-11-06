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
  if (!data.title || !data.merchantName || !data.city || !data.imageUrl) {
    return res.status(400).json({ error: "title, merchantName, city, imageUrl are required" });
  }
  try {
    const sub = await prisma.userDealSubmission.create({
      data: {
        userId: req.user.id,
        title: data.title,
        description: data.description || null,
        merchantName: data.merchantName,
        city: data.city,
        category: data.category || null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        imageUrl: data.imageUrl,
        oldPrice: data.oldPrice ?? null,
        newPrice: data.newPrice ?? null,
        discountPct: data.discountPct ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        deepLink: data.deepLink || null,
        status: "pending",
      },
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

module.exports = router;