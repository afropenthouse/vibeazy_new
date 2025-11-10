const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Support a comma-separated list of allowed frontend origins via FRONTEND_URLS
// Fallback to FRONTEND_URL or http://localhost:3000 for local dev
// Always explicitly include the production origin used by the site so deployed
// requests from https://www.vibeazy.com are accepted.
const frontendUrlsRaw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000";
const ALLOWED_ORIGINS = Array.from(new Set(
  frontendUrlsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .concat(["https://www.vibeazy.com"])
));
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

// Seed default categories on startup if none exist
(async function seedDefaultCategories() {
  try {
    const count = await prisma.category.count();
    if (count === 0) {
      const DEFAULT_CATEGORIES = [
        "Restaurants",
        "Fashion",
        "Electronics",
        "Furniture",
        "Beauty",
        "Travel",
        "Entertainment",
      ];
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((name) => ({ name })),
        skipDuplicates: true,
      });
      console.log("Seeded default categories:", DEFAULT_CATEGORIES);
    }
  } catch (e) {
    console.warn("Category seed failed:", e?.message || e);
  }
})();

app.use("/auth", require("./routes/auth"));
app.use("/password", require("./routes/password"));
app.use("/deals", require("./routes/deals"));
app.use("/admin", require("./routes/admin"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});