const express = require("express");
const auth = require("../middleware/auth");
const { randomUUID } = require("crypto");
const fetch = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

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
  const purpose = metadata?.purpose || null;
  let amountKobo = 0;
  if (purpose === "deal_leads") {
    const priceNaira = Number(process.env.LEAD_PRICE_NAIRA || 200);
    const minLeads = Number(process.env.LEAD_MIN_COUNT || 25);
    const leadsRaw = Number(metadata?.potentialCustomers || 0);
    const leads = Math.max(minLeads, Number.isFinite(leadsRaw) ? leadsRaw : 0);
    amountKobo = Math.round(leads * priceNaira * 100);
    // augment metadata for record-keeping
    metadata.leads = leads;
    metadata.priceNaira = priceNaira;
    metadata.expectedAmountKobo = amountKobo;
  } else {
    amountKobo = toKobo(amount);
  }
  if (!amountKobo) return res.status(400).json({ error: "Invalid amount" });

  const reference = randomUUID();
  try {
    const webBase = (process.env.WEB_URL || process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/+$/, "");
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
        callback_url: `${webBase}/payment/callback`,
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

    if (updated.status === "success" && !updated.used) {
      const meta = updated.metadata || {};
      const isWalletTopup = !!(meta.walletTopup || meta.purpose === "wallet_topup");
      if (isWalletTopup) {
        await prisma.$transaction([
          prisma.wallet.upsert({
            where: { userId: req.user.id },
            update: { balanceKobo: { increment: updated.amountKobo } },
            create: { userId: req.user.id, balanceKobo: updated.amountKobo },
          }),
          prisma.payment.update({ where: { reference }, data: { used: true, usedAt: new Date() } }),
        ]);
      }
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } }).catch(() => null);
    res.json({ payment: updated, walletBalanceKobo: wallet?.balanceKobo ?? null });
  } catch (e) {
    console.error("Paystack verify error", e);
    res.status(500).json({ error: "Verification error" });
  }
});

module.exports = router;
