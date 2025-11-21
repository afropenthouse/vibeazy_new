const express = require("express");
const auth = require("../middleware/auth");
const { randomUUID } = require("crypto");

const router = express.Router();

function toKobo(naira) {
  const n = Number(naira || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

// Initialize Paystack payment and store a Payment record
router.post("/init", auth, async (req, res) => {
  const prisma = req.prisma;
  const { amount, metadata } = req.body || {};
  const secret = process.env.PAYSTACK_SECRET;
  if (!secret) return res.status(500).json({ error: "Paystack not configured" });
  const email = req.user.email;
  const amountKobo = toKobo(amount);
  if (!amountKobo) return res.status(400).json({ error: "Invalid amount" });

  const reference = randomUUID();
  try {
    const callback = process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL}/payment/callback` : undefined;
    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        metadata: { ...(metadata || {}), userId: req.user.id },
        callback_url: callback,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || !data?.status) {
      const msg = data?.message || data?.error || "Paystack init failed";
      return res.status(400).json({ error: msg });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        reference,
        status: "initialized",
        amountKobo,
        currency: "NGN",
        metadata: metadata || {},
      },
    });

    res.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
      payment,
    });
  } catch (e) {
    console.error("Paystack init error", e);
    res.status(500).json({ error: "Payment init error" });
  }
});

// Verify Paystack payment by reference and mark Payment success
router.post("/verify", auth, async (req, res) => {
  const prisma = req.prisma;
  const { reference } = req.body || {};
  const secret = process.env.PAYSTACK_SECRET;
  if (!secret) return res.status(500).json({ error: "Paystack not configured" });
  if (!reference) return res.status(400).json({ error: "reference required" });

  try {
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await resp.json();
    if (!resp.ok || !data?.status) {
      const msg = data?.message || data?.error || "Verification failed";
      return res.status(400).json({ error: msg });
    }

    const status = data.data.status; // 'success' or others
    const amountKobo = Number(data.data.amount || 0);
    const email = data.data.customer?.email || null;

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment || payment.userId !== req.user.id) {
      return res.status(404).json({ error: "Payment not found" });
    }
    if (email && email !== req.user.email) {
      return res.status(400).json({ error: "Email mismatch" });
    }

    const updated = await prisma.payment.update({
      where: { reference },
      data: {
        status: status === "success" ? "success" : "failed",
        amountKobo: amountKobo || payment.amountKobo,
      },
    });

    res.json({ payment: updated });
  } catch (e) {
    console.error("Paystack verify error", e);
    res.status(500).json({ error: "Verification error" });
  }
});

module.exports = router;