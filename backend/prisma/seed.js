const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function splitCsvRow(s) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (q && s[i + 1] === '"') { cur += '"'; i++; }
      else { q = !q; }
    } else if (c === ',' && !q) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = splitCsvRow(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvRow(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
    rows.push(obj);
  }
  return rows;
}

function autoDiscount(oldPrice, newPrice) {
  if (oldPrice === undefined || newPrice === undefined || oldPrice === null || newPrice === null) return null;
  const oldP = Number(oldPrice);
  const newP = Number(newPrice);
  if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP > 0 && newP >= 0 && newP <= oldP) {
    return Math.round(((oldP - newP) / oldP) * 100);
  }
  return null;
}

async function main() {
  const prisma = new PrismaClient();
  const fileArg = process.argv[2] || process.env.DEALS_CSV || "";
  if (!fileArg) {
    console.error("Provide CSV path: node prisma/seed.js <path-to-csv>");
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), fileArg);
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text);
  const toCreate = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx] || {};
    const merchantName = String(r.merchantName || "").trim();
    const city = String(r.city || "").trim();
    const imageUrl = String(r.imageUrl || "").trim();
    const titleCandidate = String((r.title ?? r.description ?? merchantName) || "").trim();
    if (!merchantName || !city || !imageUrl || !titleCandidate) continue;

    const oldPrice = r.oldPrice !== undefined && r.oldPrice !== "" ? Number(r.oldPrice) : null;
    const newPrice = r.newPrice !== undefined && r.newPrice !== "" ? Number(r.newPrice) : null;
    const discountPct = r.discountPct !== undefined && r.discountPct !== ""
      ? Number(r.discountPct)
      : autoDiscount(oldPrice, newPrice);
    const expiresAt = r.expiresAt ? new Date(r.expiresAt) : null;
    const tagsRaw = r.tags ?? [];
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw
      : typeof tagsRaw === "string" && tagsRaw.length
        ? tagsRaw.split("|").map((t) => t.trim()).filter(Boolean)
        : [];

    toCreate.push({
      title: titleCandidate,
      description: r.description || null,
      merchantName,
      city,
      category: r.category || null,
      tags,
      imageUrl,
      oldPrice,
      newPrice,
      discountPct,
      expiresAt,
      deepLink: r.deepLink || null,
      isActive: r.isActive !== undefined ? (String(r.isActive).toLowerCase() !== "false") : true,
    });
  }

  if (!toCreate.length) {
    console.log("No valid rows in CSV");
    process.exit(0);
  }

  await prisma.deal.createMany({ data: toCreate });
  console.log(`Created ${toCreate.length} deals`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { const prisma = new PrismaClient(); await prisma.$disconnect(); } catch {}
  process.exit(1);
});