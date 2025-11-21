const express = require("express");

const router = express.Router();

router.post("/subscribe", async (req, res) => {
  const prisma = req.prisma;
  const { email } = req.body || {};
  const val = String(email || "").trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  if (!ok) return res.status(400).json({ error: "Invalid email" });
  try {
    const rec = await prisma.newsletterSubscription.upsert({ where: { email: val }, update: {}, create: { email: val } });
    return res.status(201).json({ ok: true, id: rec.id });
  } catch (e) {
    return res.status(500).json({ error: "Subscription failed" });
  }
});

module.exports = router;