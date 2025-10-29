const express = require("express");
const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/jwt");
const { v4: uuidv4 } = require("uuid");
const { sendVerificationEmail } = require("../utils/mailer");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const prisma = req.prisma;
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, emailVerified: false } });
  // Create verification token
  const tokenStr = uuidv4();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await prisma.emailVerificationToken.create({
    data: { token: tokenStr, userId: user.id, expiresAt: expires },
  });
  // Send verification email
  try {
    await sendVerificationEmail(user.email, tokenStr);
  } catch (e) {
    console.error("Failed to send verification email:", e.message);
  }
  res.status(201).json({ ok: true, message: "Signup successful. Please verify your email to sign in." });
});

router.post("/login", async (req, res) => {
  const prisma = req.prisma;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.emailVerified) return res.status(403).json({ error: "Email not verified" });
  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get("/me", authMiddleware, async (req, res) => {
  const prisma = req.prisma;
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true } });
  res.json({ user });
});

// Verify email token
router.get("/verify-email/:token", async (req, res) => {
  const prisma = req.prisma;
  const tokenStr = req.params.token;
  const record = await prisma.emailVerificationToken.findUnique({ where: { token: tokenStr } });
  if (!record || record.used) return res.status(400).json({ error: "Invalid token" });
  if (record.expiresAt < new Date()) return res.status(400).json({ error: "Token expired" });
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
  await prisma.emailVerificationToken.update({ where: { token: tokenStr }, data: { used: true } });
  // Redirect to login page with a flag
  const appBase = process.env.APP_BASE_URL || "http://localhost:3000";
  res.redirect(`${appBase}/login?verified=1`);
});

module.exports = router;