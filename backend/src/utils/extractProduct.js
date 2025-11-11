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

// Heuristic price extractor:
// - Reads typical price elements
// - Detects "save" amounts and "% off" to infer oldPrice when missing
function extractPricesHeuristic($) {
  const priceCandidates = [];
  const oldCandidates = [];
  const saveCandidates = [];
  const pctCandidates = [];

  const pushCurrencyNums = (text, bucket) => {
    const str = String(text || "");
    const rx = /(?:₦|NGN|N\$|\$|£)?\s*([0-9]{3,}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g;
    let m;
    while ((m = rx.exec(str))) {
      const raw = m[1];
      const n = Number(raw.replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 100 && n <= 100000000) bucket.push(n);
    }
  };

  const pushPercentNums = (text) => {
    const str = String(text || "");
    const rx = /([0-9]{1,3})\s*%/g;
    let m;
    while ((m = rx.exec(str))) {
      const p = Number(m[1]);
      if (Number.isFinite(p) && p > 0 && p < 100) pctCandidates.push(p);
    }
  };

  // Meta price amount hints (typically current/new price)
  $('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]').each((_, el) => {
    pushCurrencyNums($(el).attr('content'), priceCandidates);
  });

  // Old price patterns
  $('del, s, strike, .old, .price-old, [class*="old"], [class*="strike"], [class*="was-price"], [class*="list-price"]').each((_, el) => {
    const text = $(el).text();
    pushCurrencyNums(text, oldCandidates);
  });

  // Generic price containers
  $('[class*="price"], .price').each((_, el) => {
    const text = $(el).text();
    pushCurrencyNums(text, priceCandidates);
  });

  // Save amount and percent-off hints
  $('*[class*="save"], .save, [data-save], *:contains("Save")').each((_, el) => {
    const text = $(el).text();
    pushCurrencyNums(text, saveCandidates);
    pushPercentNums(text);
  });
  $('*[class*="off"], .discount, [class*="percent"], *:contains("% OFF"), *:contains("off")').each((_, el) => {
    const text = $(el).text();
    pushPercentNums(text);
  });

  // Attribute-based hints commonly used by storefronts
  $('*').each((_, el) => {
    const attr = el.attribs || {};
    const maybePush = (key, bucket) => {
      if (attr[key]) pushCurrencyNums(attr[key], bucket);
    };
    maybePush('data-price', priceCandidates);
    maybePush('data-amount', priceCandidates);
    maybePush('data-value', priceCandidates);
    maybePush('data-old-price', oldCandidates);
    maybePush('data-original-price', oldCandidates);
    maybePush('data-was', oldCandidates);
  });

  // Body text scan with simple contextual filtering to avoid shipping/ratings
  const bodyText = $('body').text() || '';
  const segments = bodyText.split(/[\n\.]+/);
  const ignore = /(ship|shipping|delivery|fee|rating|review|verified|stars|tax|vat)/i;
  segments.forEach((seg) => {
    const s = seg.trim();
    if (!s) return;
    // skip known non-price contexts
    if (ignore.test(s)) return;
    // hint: old/list/was
    if (/old|was|list|original/i.test(s)) {
      pushCurrencyNums(s, oldCandidates);
    }
    // hint: save/discount
    if (/save|discount/i.test(s)) {
      pushCurrencyNums(s, saveCandidates);
    }
    pushCurrencyNums(s, priceCandidates);
    pushPercentNums(s);
  });

  // Decide newPrice
  let newPrice = null;
  if (priceCandidates.length) {
    newPrice = Math.min(...priceCandidates);
  }

  // Decide oldPrice priority: explicit old candidates > save + new > pct + new > max of all
  let oldPrice = null;
  if (oldCandidates.length) {
    oldPrice = Math.max(...oldCandidates);
  } else if (newPrice !== null && saveCandidates.length) {
    oldPrice = newPrice + Math.max(...saveCandidates);
  } else if (newPrice !== null && pctCandidates.length) {
    const pct = Math.max(...pctCandidates);
    oldPrice = Math.round(newPrice / (1 - pct / 100));
  } else {
    const all = [...priceCandidates];
    if (all.length >= 2) oldPrice = Math.max(...all);
  }

  // Guard: ensure oldPrice >= newPrice
  if (oldPrice !== null && newPrice !== null && oldPrice < newPrice) {
    oldPrice = null;
  }

  return { newPrice: newPrice ?? null, oldPrice: oldPrice ?? null };
}

// Always return a single sentence, trimmed to nearest punctuation or safe word boundary
function oneSentence(desc, maxChars = 180) {
  if (!desc) return null;
  const txt = String(desc).replace(/\s+/g, " ").trim();
  // Find first sentence terminator
  const m = txt.match(/[.!?]/);
  if (m) {
    const end = txt.indexOf(m[0]);
    return txt.slice(0, end + 1);
  }
  // No punctuation: cut to maxChars at word boundary and add period
  const slice = txt.slice(0, maxChars).replace(/\s+\S*$/, "");
  return slice.length ? `${slice}.` : txt;
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
  if (data.description) data.description = oneSentence(data.description);
  if (data.imageUrl) data.imageUrl = String(data.imageUrl).trim();
  return data;
}

module.exports = { extractProductFromUrl };