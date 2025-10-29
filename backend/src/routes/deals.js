const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

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

module.exports = router;