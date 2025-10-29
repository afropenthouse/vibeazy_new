const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { sendPasswordResetEmail } = require("../utils/mailer");

const router = express.Router();

router.post("/request-reset", async (req, res) => {
  const prisma = req.prisma;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not reveal if email exists
    return res.json({ ok: true });
  }
  const tokenStr = uuidv4();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({
    data: { token: tokenStr, userId: user.id, expiresAt: expires },
  });
  try {
    await sendPasswordResetEmail(user.email, tokenStr);
  } catch (e) {
    console.error("Failed to send reset email:", e.message);
  }
  res.json({ ok: true });
});

router.post("/reset", async (req, res) => {
  const prisma = req.prisma;
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: "Missing fields" });
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used) return res.status(400).json({ error: "Invalid token" });
  if (record.expiresAt < new Date()) return res.status(400).json({ error: "Token expired" });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
  res.json({ ok: true });
});

module.exports = router;