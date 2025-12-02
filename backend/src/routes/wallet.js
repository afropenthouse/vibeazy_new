const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

async function getOrCreateWallet(prisma, userId) {
  let w = await prisma.wallet.findUnique({ where: { userId } });
  if (!w) w = await prisma.wallet.create({ data: { userId, balanceKobo: 0 } });
  return w;
}

router.get("/me", auth, async (req, res) => {
  const prisma = req.prisma;
  const w = await getOrCreateWallet(prisma, req.user.id);
  res.json({ wallet: w, balanceKobo: w.balanceKobo });
});

router.get("/transactions", auth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const logs = await prisma.smsLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  const payments = await prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  const items = [];
  for (const l of logs) {
    items.push({
      type: "debit",
      amountKobo: Number(l.costKobo || 0),
      note: `SMS to ${l.recipients} recipients`,
      createdAt: l.createdAt,
    });
  }
  for (const p of payments) {
    if (p.metadata && (p.metadata.walletTopup || p.metadata.topup)) {
      items.push({ type: "credit", amountKobo: Number(p.amountKobo || 0), note: "Wallet top-up", createdAt: p.createdAt });
    }
  }
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ transactions: items });
});

module.exports = router;

