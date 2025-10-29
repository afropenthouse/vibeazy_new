const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Support a comma-separated list of allowed frontend origins via FRONTEND_URLS
// Fallback to FRONTEND_URL or http://localhost:3000 for local dev
const frontendUrlsRaw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000";
const ALLOWED_ORIGINS = frontendUrlsRaw.split(",").map((s) => s.trim()).filter(Boolean);
console.log("CORS allowed origins:", ALLOWED_ORIGINS);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, server-side requests)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Attach prisma to request for route handlers --
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", require("./routes/auth"));
app.use("/password", require("./routes/password"));
app.use("/deals", require("./routes/deals"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});