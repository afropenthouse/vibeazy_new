// Lightweight product extraction from a URL.
// Strategy:
// 1) Fetch HTML
// 2) Try JSON-LD Product schema
// 3) Fallback to OpenGraph/meta tags
// Returns: { title, description, imageUrl, price }

const cheerio = require("cheerio");

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VibeazyBot/1.0)" } });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  return await res.text();
}

function tryJsonLd($) {
  const scripts = $('script[type="application/ld+json"]');
  let product = null;
  scripts.each((_, el) => {
    try {
      const txt = $(el).text();
      if (!txt) return;
      const parsed = JSON.parse(txt);
      const pickProduct = (obj) => {
        if (!obj) return null;
        const type = Array.isArray(obj["@type"]) ? obj["@type"][0] : obj["@type"]; 
        if (type && String(type).toLowerCase() === "product") return obj;
        return null;
      };
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const p = pickProduct(item);
          if (p) { product = p; break; }
        }
      } else {
        product = pickProduct(parsed);
      }
    } catch {}
  });
  if (!product) return null;

  const title = product.name || product.title || null;
  const description = product.description || null;
  let imageUrl = null;
  if (Array.isArray(product.image)) imageUrl = product.image[0];
  else if (typeof product.image === "string") imageUrl = product.image;

  let price = null;
  try {
    const offers = product.offers;
    if (offers) {
      if (Array.isArray(offers)) {
        const first = offers[0] || {};
        price = Number(first.price || first["priceAmount"] || first["price"] || null);
      } else if (typeof offers === "object") {
        price = Number(offers.price || offers["priceAmount"] || null);
      }
    }
  } catch {}

  return { title, description, imageUrl, price };
}

function tryMeta($) {
  const getMeta = (sel) => $(sel).attr("content") || null;
  const title = getMeta('meta[property="og:title"]') || getMeta('meta[name="title"]') || $("title").text() || null;
  const description = getMeta('meta[property="og:description"]') || getMeta('meta[name="description"]') || null;
  const imageUrl = getMeta('meta[property="og:image"]') || getMeta('meta[name="twitter:image"]') || null;
  const priceStr = getMeta('meta[property="product:price:amount"]') || getMeta('meta[property="og:price:amount"]') || getMeta('meta[name="price"]') || null;
  const price = priceStr ? Number(String(priceStr).replace(/[^0-9.]/g, "")) : null;
  return { title, description, imageUrl, price };
}

async function extractProductFromUrl(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  let data = tryJsonLd($);
  if (!data || (!data.title && !data.imageUrl && !data.price)) {
    data = tryMeta($);
  }
  // Normalize strings
  if (data.title) data.title = String(data.title).trim();
  if (data.description) data.description = String(data.description).trim();
  if (data.imageUrl) data.imageUrl = String(data.imageUrl).trim();
  return data;
}

module.exports = { extractProductFromUrl };