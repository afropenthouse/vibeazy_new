const express = require("express");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

function sanitizeMsisdn(p) {
  const digits = String(p || "").replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  if (digits.length >= 10) return digits; // fallback
  return null;
}

async function getOrCreateWallet(prisma, userId) {
  let w = await prisma.wallet.findUnique({ where: { userId } });
  if (!w) w = await prisma.wallet.create({ data: { userId, balanceKobo: 0 } });
  return w;
}

router.get("/wallet/me", authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const w = await getOrCreateWallet(prisma, req.user.id);
  res.json({ balanceKobo: w.balanceKobo });
});

router.post("/wallet/topup", authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const amountNaira = Number(req.body?.amountNaira || 0);
  const amountKobo = Math.max(0, Math.round(amountNaira * 100));
  if (amountKobo <= 0) return res.status(400).json({ error: "Invalid amount" });
  const w = await getOrCreateWallet(prisma, req.user.id);
  const updated = await prisma.wallet.update({ where: { userId: req.user.id }, data: { balanceKobo: w.balanceKobo + amountKobo } });
  res.status(201).json({ balanceKobo: updated.balanceKobo });
});

router.post("/send", authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const submissionId = Number(req.body?.submissionId || 0);
  const message = String(req.body?.message || "").trim();
  if (!submissionId || !message) return res.status(400).json({ error: "Missing fields" });

  const submission = await prisma.userDealSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== req.user.id) {
    return res.status(404).json({ error: "Submission not found" });
  }

  const interestsBySubmission = await prisma.dealInterest.findMany({
    where: { submissionId },
    include: { user: true },
  });
  let interestsByDeal = [];
  if (submission.dealId) {
    interestsByDeal = await prisma.dealInterest.findMany({
      where: { dealId: submission.dealId },
      include: { user: true },
    });
  }
  const seen = new Set();
  const numbers = [...interestsBySubmission, ...interestsByDeal]
    .map((i) => sanitizeMsisdn(i.user?.phone))
    .filter((n) => {
      if (!n) return false;
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  const recipients = numbers.length;
  if (recipients === 0) return res.status(400).json({ error: "No recipients with phone numbers" });

  const COST_PER_SMS_KOBO = Number(process.env.SMS_COST_KOBO || 1000); // ₦10 default
  const totalCost = COST_PER_SMS_KOBO * recipients;

  const wallet = await getOrCreateWallet(prisma, req.user.id);
  if (wallet.balanceKobo < totalCost) {
    return res.status(402).json({ error: "Insufficient balance", balanceKobo: wallet.balanceKobo, requiredKobo: totalCost });
  }

  const baseUrl = process.env.TERMII_BASE_URL || "https://v3.api.termii.com";
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "Vibeazy";
  if (!apiKey) return res.status(500).json({ error: "TERMII_API_KEY not configured" });

  try {
    const resp = await fetch(`${baseUrl}/api/sms/send/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: numbers,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: apiKey,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ error: data?.message || "Termii send failed" });
    }

    await prisma.$transaction([
      prisma.wallet.update({ where: { userId: req.user.id }, data: { balanceKobo: wallet.balanceKobo - totalCost } }),
      prisma.smsLog.create({ data: {
        userId: req.user.id,
        submissionId,
        message,
        recipients,
        costKobo: totalCost,
        termiiMsgId: String(data?.message_id || data?.message_id_str || ""),
      } }),
    ]);

    const updated = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    res.status(201).json({ ok: true, sentTo: recipients, balanceKobo: updated.balanceKobo });
  } catch (e) {
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

module.exports = router;
