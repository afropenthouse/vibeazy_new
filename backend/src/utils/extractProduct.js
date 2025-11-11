// Lightweight product extraction from a URL.
// Strategy:
// 1) Fetch HTML
// 2) Try JSON-LD Product schema
// 3) Fallback to OpenGraph/meta tags
// Returns: { title, description, imageUrl, newPrice, oldPrice }

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

  let newPrice = null;
  try {
    const offers = product.offers;
    if (offers) {
      if (Array.isArray(offers)) {
        const first = offers[0] || {};
        newPrice = Number(first.price || first["priceAmount"] || first["price"] || null);
      } else if (typeof offers === "object") {
        newPrice = Number(offers.price || offers["priceAmount"] || null);
      }
    }
  } catch {}

  return { title, description, imageUrl, newPrice, oldPrice: null };
}

function tryMeta($) {
  const getMeta = (sel) => $(sel).attr("content") || null;
  const title = getMeta('meta[property="og:title"]') || getMeta('meta[name="title"]') || $("title").text() || null;
  const description = getMeta('meta[property="og:description"]') || getMeta('meta[name="description"]') || null;
  const imageUrl = getMeta('meta[property="og:image"]') || getMeta('meta[name="twitter:image"]') || null;
  const priceStr = getMeta('meta[property="product:price:amount"]') || getMeta('meta[property="og:price:amount"]') || getMeta('meta[name="price"]') || null;
  const newPrice = priceStr ? Number(String(priceStr).replace(/[^0-9.]/g, "")) : null;
  return { title, description, imageUrl, newPrice, oldPrice: null };
}

// Heuristic price extractor: look at common elements and pick min as newPrice, max as oldPrice
function extractPricesHeuristic($) {
  const candidates = [];
  const pushNums = (text) => {
    const str = String(text || "");
    const rx = /(?:₦|NGN|N\$|\$|£)?\s*([0-9]{3,}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g;
    let m;
    while ((m = rx.exec(str))) {
      const raw = m[1];
      const n = Number(raw.replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 100 && n <= 100000000) candidates.push(n);
    }
  };
  // Typical elements containing prices
  $('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]').each((_, el) => pushNums($(el).attr('content')));
  $('del, s, strike, .old, .price-old, [class*="old"], [class*="strike"], [class*="was-price"], [class*="list-price"]').each((_, el) => pushNums($(el).text()));
  $('[class*="price"], .price').each((_, el) => pushNums($(el).text()));
  // If many numbers, pick sensible extremes
  const uniq = Array.from(new Set(candidates)).sort((a,b)=>a-b);
  if (uniq.length === 0) return { newPrice: null, oldPrice: null };
  if (uniq.length === 1) return { newPrice: uniq[0], oldPrice: null };
  const newPrice = uniq[0];
  const oldPrice = uniq[uniq.length - 1] !== newPrice ? uniq[uniq.length - 1] : null;
  // Guard: ensure oldPrice >= newPrice
  if (oldPrice !== null && oldPrice < newPrice) return { newPrice, oldPrice: null };
  return { newPrice, oldPrice };
}

function truncateDescription(desc, maxChars = 180) {
  if (!desc) return null;
  const txt = String(desc).replace(/\s+/g, " ").trim();
  if (txt.length <= maxChars) {
    const firstStop = txt.indexOf('. ');
    return firstStop !== -1 ? txt.slice(0, firstStop + 1) : txt;
  }
  const slice = txt.slice(0, maxChars);
  const lastDot = slice.lastIndexOf('.');
  if (lastDot > maxChars * 0.5) return slice.slice(0, lastDot + 1);
  // fallback to whole-word cut
  return slice.replace(/\s+\S*$/, '...');
}

async function extractProductFromUrl(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  let data = tryJsonLd($);
  if (!data || (!data.title && !data.imageUrl && !data.newPrice)) {
    data = tryMeta($);
  }
  // add heuristic prices if missing or only one present
  const ph = extractPricesHeuristic($);
  if (ph.newPrice && !data.newPrice) data.newPrice = ph.newPrice;
  if (ph.oldPrice) data.oldPrice = ph.oldPrice;
  // Normalize strings
  if (data.title) data.title = String(data.title).trim();
  if (data.description) data.description = truncateDescription(data.description);
  if (data.imageUrl) data.imageUrl = String(data.imageUrl).trim();
  return data;
}

module.exports = { extractProductFromUrl };