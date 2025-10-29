const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Attach prisma to request for route handlers
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