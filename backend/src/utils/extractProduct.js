// Lightweight product extraction from a URL.
// Strategy:
// 1) Fetch HTML
// 2) Try JSON-LD Product schema
// 3) Fallback to OpenGraph/meta tags
// Returns: { title, description, imageUrl, newPrice, oldPrice }

const cheerio = require("cheerio");

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    }
  });
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

// Extract from embedded JSON (e.g., Next.js __NEXT_DATA__, Apollo state)
function tryEmbeddedJson($, html) {
  const scripts = $('script');
  const candidates = [];
  scripts.each((_, el) => {
    const id = $(el).attr('id') || '';
    const type = ($(el).attr('type') || '').toLowerCase();
    const txt = $(el).text();
    if (!txt || txt.length < 20) return;
    if (id === '__NEXT_DATA__' || type === 'application/json' || /apollo|state|data/i.test(id)) {
      candidates.push(txt);
    } else if (/"price"|selling_price|oldPrice|originalPrice|discount/i.test(txt)) {
      candidates.push(txt);
    }
  });

  const pickFromObj = (root) => {
    let title = null, description = null, imageUrl = null;
    let newPrice = null, oldPrice = null;

    const numFromStr = (s) => {
      const m = String(s || '').match(/([0-9]{2,}(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      if (!m) return null;
      const n = Number(m[1].replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };

    const walker = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (typeof v === 'string') {
          if (!title && /name|title/.test(key) && v.length > 2) title = v;
          if (!description && /description/.test(key) && v.length > 10) description = v;
          if (!imageUrl && /image|imageurl|image_url/.test(key) && /^https?:/.test(v)) imageUrl = v;
          // string price values
          if ((/old|original|list|was/.test(key) && /price/.test(key))) {
            const n = numFromStr(v);
            if (n) oldPrice = n;
          }
          if ((/current|new|selling|discount/.test(key) && /price/.test(key)) || key === 'price') {
            const n = numFromStr(v);
            if (n) newPrice = n;
          }
        }
        if (typeof v === 'number') {
          if (/old|original|list|was/.test(key) && /price/.test(key)) oldPrice = v;
          if ((/current|new|selling|discount/.test(key) && /price/.test(key)) || key === 'price') newPrice = v;
        }
        if (Array.isArray(v)) {
          v.forEach(walker);
        } else if (typeof v === 'object' && v) {
          walker(v);
        }
      }
    };
    walker(root);
    return { title, description, imageUrl, newPrice, oldPrice };
  };

  for (const txt of candidates) {
    try {
      const parsed = JSON.parse(txt);
      const got = pickFromObj(parsed);
      if (got.newPrice || got.oldPrice || got.title || got.imageUrl) {
        return {
          title: got.title || null,
          description: got.description || null,
          imageUrl: got.imageUrl || null,
          newPrice: got.newPrice ?? null,
          oldPrice: got.oldPrice ?? null,
        };
      }
    } catch { /* ignore */ }
  }
  return null;
}

function parseNumber(str) {
  const m = String(str || '').match(/([0-9]{3,}(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function findFirstJsonNumber(html, keys) {
  for (const key of keys) {
    const rx = new RegExp(`"${key}"\s*:\s*"?([0-9.,]+)"?`, 'i');
    const m = html.match(rx);
    if (m) {
      const n = parseNumber(m[1]);
      if (n !== null) return n;
    }
  }
  return null;
}

function extractJumia(html) {
  // Common keys seen on Jumia pages
  const newKeys = ['currentPrice', 'sellingPrice', 'discountedPrice', 'price'];
  const oldKeys = ['oldPrice', 'originalPrice', 'listPrice', 'wasPrice', 'previousPrice'];
  const newPrice = findFirstJsonNumber(html, newKeys);
  const oldPrice = findFirstJsonNumber(html, oldKeys);
  return { newPrice, oldPrice };
}

function extractKonga(html) {
  const newKeys = ['current_price', 'selling_price', 'discounted_price', 'price'];
  const oldKeys = ['old_price', 'original_price', 'list_price', 'was_price', 'previous_price'];
  const newPrice = findFirstJsonNumber(html, newKeys);
  const oldPrice = findFirstJsonNumber(html, oldKeys);
  return { newPrice, oldPrice };
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
  // Try embedded JSON like Next.js/Apollo if still missing
  if (!data || (!data.newPrice && !data.oldPrice)) {
    const ej = tryEmbeddedJson($, html);
    if (ej) {
      data.title = data.title || ej.title;
      data.description = data.description || ej.description;
      data.imageUrl = data.imageUrl || ej.imageUrl;
      data.newPrice = data.newPrice ?? ej.newPrice;
      data.oldPrice = data.oldPrice ?? ej.oldPrice;
    }
  }
  // Domain-specific extractors for Jumia/Konga
  try {
    const host = new URL(url).hostname;
    if ((!data.newPrice || !data.oldPrice) && /jumia/i.test(host)) {
      const d = extractJumia(html);
      if (!data.newPrice && d.newPrice !== null) data.newPrice = d.newPrice;
      if (!data.oldPrice && d.oldPrice !== null) data.oldPrice = d.oldPrice;
    }
    if ((!data.newPrice || !data.oldPrice) && /konga/i.test(host)) {
      const d = extractKonga(html);
      if (!data.newPrice && d.newPrice !== null) data.newPrice = d.newPrice;
      if (!data.oldPrice && d.oldPrice !== null) data.oldPrice = d.oldPrice;
    }
  } catch {}
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