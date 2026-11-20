// lib/image-search.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchPizani1688 } from "./pizani1688";
import type { PizaniProduct } from "./pizani1688";
import { parsebirdByOfferId } from "./parsebird1688";
import type { ParsebirdListing } from "./parsebird1688";
import { createJob, updateJob, pushProduct, type ImageSearchJob } from "./imageSearchJobs";
import type { LiveProduct, LiveProductVariant } from "./liveProduct";
import { saveLiveProduct, saveSearchCache, getSearchCache, loadCachedProducts } from "./firestoreLiveProducts";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("🚨 [image-search] APIFY_TOKEN is missing from .env.local");
  throw new Error("Missing APIFY_TOKEN");
}

const PRODUCTS_WANTED = 3;
const ASK_FOR = 5;
const MIN_PRICE_BDT = 20;

type RawListing = {
  offerId?: string;
  productId?: string;
  title?: string;
  titleEn?: string;
  price?: number;
  priceUsd?: number;
  priceYuan?: number;
  image?: string;
  imageUrl?: string;
  detailUrl?: string;
  productUrl?: string;
  url?: string;
  supplierName?: string;
  supplier?: { name?: string };
  [key: string]: unknown;
};

function deepClean(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => deepClean(v)).filter((v) => v !== undefined);
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      const cleaned = deepClean(obj[key]);
      if (cleaned !== undefined) {
        newObj[key] = cleaned;
      }
    }
    return newObj;
  }
  return obj;
}

function toRawBase64(input: string): string {
  if (input.includes(",")) return input.slice(input.indexOf(",") + 1);
  return input;
}

function hashImageBase64(base64: string): string {
  let h = 5381;
  for (let i = 0; i < base64.length; i += 7) {
    h = ((h << 5) + h + base64.charCodeAt(i)) >>> 0;
  }
  return `img_${h.toString(36)}_${base64.length}`;
}

async function findListingsByBase64(dataUrlOrBase64: string): Promise<RawListing[]> {
  const rawBase64 = toRawBase64(dataUrlOrBase64);
  if (!rawBase64) throw new Error("Invalid image data");

  let imageUrl = "";
  try {
    const imgbbForm = new FormData();
    const buffer = Buffer.from(rawBase64, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    imgbbForm.append("image", blob, "search.jpg");
    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, { method: "POST", body: imgbbForm });
    const imgbbData = await imgbbRes.json();
    if (imgbbData.success) {
      imageUrl = imgbbData.data.url;
    } else {
      throw new Error("ImgBB upload failed");
    }
  } catch (err) {
    console.warn(`[image-search] ImgBB failed`, err);
  }

  if (!imageUrl) throw new Error("Image upload failed - cannot search");

  const input = {
    imageUrls: [imageUrl],
    maxResultsPerInput: ASK_FOR,
  };

  const ACTOR_ID = process.env.APIFY_IMAGE_SEARCH_ACTOR_ID || "blueskyscraper~1688-image-search-scraper";

  const url = `https://api.apify.com/v2/actors/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&waitForFinish=60`;

  console.log(`[image-search] POST sync actor=${ACTOR_ID}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[image-search] ❌ Apify error ${response.status}: ${text}`);
    throw new Error(`Image search actor failed (${response.status}): ${text}`);
  }

  const items = (await response.json()) as RawListing[];
  console.log(`[image-search] ${items.length} listings received`);

  return Array.isArray(items) ? items : [];
}

function fallbackToLive(raw: RawListing): LiveProduct | null {
  const idMatch = (raw.url || "").match(/offer\/(\d+)/);
  const id = idMatch ? idMatch[1] : String(raw.offerId ?? raw.productId ?? "");

  const title = raw.titleEn || raw.title;
  const image = raw.image || raw.imageUrl;

  if (!id || !title || !image) return null;

  const priceUsd = typeof raw.priceUsd === "number" ? raw.priceUsd : 0;
  const priceCny = typeof raw.price === "number" ? raw.price : 0;

  let priceBdt = 0;
  if (priceUsd > 0) priceBdt = Math.round(priceUsd * 120);
  else if (priceCny > 0) priceBdt = Math.round(priceCny * 18.5);

  if (priceBdt < MIN_PRICE_BDT) return null;

  return {
    id: `live-${id}`,
    title: String(title).slice(0, 120),
    subtitle: "China",
    price: priceBdt,
    priceMax: undefined,
    oldPrice: Math.round(priceBdt * 1.25),
    discount: 20,
    rating: 4.5,
    reviews: 0,
    image: String(image),
    gallery: [String(image)],
    colors: [],
    sizes: [],
    inStock: true,
    stockCount: 999,
    features: [{ icon: "📍", label: "China" }],
    description: String(title),
    sourceUrl: String(raw.url || raw.detailUrl || ""),
    moq: 1,
    supplierName: String(raw.supplierName ?? "1688 Supplier"),
    priceOriginalCny: priceCny,
    isLive: true,
    lastRefreshedAt: Date.now(),
  } as unknown as LiveProduct;
}

function cnyToSellingBdt(cny: number): number {
  if (cny <= 0) return 0;
  const priceUsd = cny * 0.14;
  const costBdt = priceUsd * 121;
  let multiplier = 1.5;
  if (costBdt >= 500 && costBdt < 2000) multiplier = 1.35;
  else if (costBdt >= 2000 && costBdt < 5000) multiplier = 1.25;
  else if (costBdt >= 5000 && costBdt < 10000) multiplier = 1.18;
  else if (costBdt >= 10000) multiplier = 1.12;
  return Math.max(MIN_PRICE_BDT, Math.round((costBdt * multiplier) / 10) * 10);
}

function parseWeightFromSpecs(specs: { name: string; value: string }[] | undefined): number | undefined {
  if (!specs) return undefined;
  const weightSpec = specs.find((s) => s.name.toLowerCase().includes("weight"));
  if (!weightSpec) return undefined;
  const gramMatch = weightSpec.value.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (gramMatch) { const grams = parseFloat(gramMatch[1]); if (grams > 0 && grams < 100000) return grams / 1000; }
  return undefined;
}

export function mergeToLive(pizani: PizaniProduct, parsebird: ParsebirdListing | null): LiveProduct {
    const variants: LiveProductVariant[] = (pizani.variants ?? []).map((v) => ({
    colorId: v.colorId ?? "",
    size: v.size ?? "",
    priceCny: Number(v.priceCny) || undefined,
    price: Number(v.price) || undefined,
    stock: v.stock,
    image: v.image,
    skuId: v.skuId,
    specId: v.specId,
  }));

  const skuPrices: LiveProduct["skuPrices"] = {};

  if (parsebird && parsebird.skuVariants.length > 0) {
    for (const pv of parsebird.skuVariants) {
      const priceNum = Number(pv.priceCny) || 0;
      const discountNum = Number(pv.discountPriceCny) || priceNum;
      skuPrices[pv.specId] = { priceCny: priceNum, discountPriceCny: discountNum, stock: pv.stock };
      const match = variants.find((v) => v.specId === pv.specId);
      if (match) {
        match.priceCny = discountNum;
        match.price = cnyToSellingBdt(discountNum);
        if (pv.stock != null) match.stock = pv.stock;
      }
    }
  }

  // Give every variant its own price from its own CNY value, so a product whose
  // SKUs cost different amounts does NOT collapse to one price after import.
  for (const v of variants) {
    const cny = Number(v.priceCny) || 0;
    if (cny > 0) {
      const own = cnyToSellingBdt(cny);
      if (own > 0) v.price = own;
    }
  }

  for (const v of variants) {
    if (!v.price || v.price <= 0) {
      v.price = pizani.price;
      v.priceCny = pizani.priceCnyMin;
    }
  }

  const weightKg = parsebird?.unitWeightKg && parsebird.unitWeightKg > 0 ? parsebird.unitWeightKg : parseWeightFromSpecs(pizani.specs);
  const variantPrices = variants.map(v => v.price || 0).filter(p => p > 0);
  const finalBasePrice = variantPrices.length > 0 ? Math.min(...variantPrices) : pizani.price;
  const finalOldPrice = Math.round(finalBasePrice * 1.3);
  const finalPriceCny = variants.length > 0 ? Math.min(...variants.map(v => v.priceCny || pizani.priceCnyMin)) : pizani.priceCnyMin;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : finalBasePrice;
  const finalPriceMax = maxPrice > finalBasePrice * 1.2 ? maxPrice : undefined;

  const colorMap = new Map<string, { id: string; label: string; hex: string; image?: string }>();
  if (parsebird?.skuColors) {
    for (let i = 0; i < parsebird.skuColors.length; i++) {
      const pc = parsebird.skuColors[i];
      if (!pc.name) continue;
      colorMap.set(pc.name, {
        id: `color-${i}-${pc.name.toLowerCase().replace(/\s+/g, "-")}`,
        label: pc.name,
        hex: "#9CA3AF",
        image: pc.imageUrl || undefined,
      });
    }
  }
  if (pizani.colors) {
    const existingImages = new Set(
      Array.from(colorMap.values())
        .map((c) => c.image)
        .filter((img): img is string => !!img)
    );

    for (const c of pizani.colors) {
      const existing = colorMap.get(c.label);
      if (existing) {
        if (!existing.image && c.image) existing.image = c.image;
        continue;
      }
      // Never add a second tile for a picture we already have — that was
      // creating a duplicated colour list on the product page.
      if (c.image && existingImages.has(c.image)) continue;

      colorMap.set(c.label, { id: c.id, label: c.label, hex: c.hex, image: c.image });
      if (c.image) existingImages.add(c.image);
    }
  }

  // If the listing gave us no colours but the SKUs have their own pictures,
  // build the colour tiles from the variants so the product is still selectable.
  if (colorMap.size === 0 && variants.length > 0) {
    const seenIdx = new Set<string>();
    variants.forEach((v, i) => {
      if (!v.image || seenIdx.has(v.image)) return;
      seenIdx.add(v.image);
      const label = v.colorId
        ? v.colorId.replace(/^color-\d+-/, "").replace(/-/g, " ")
        : `Option ${i + 1}`;
      colorMap.set(`option-${i}`, {
        id: v.colorId || `option-${i}`,
        label,
        hex: "#9CA3AF",
        image: v.image,
      });
    });
  }

  return {
    id: `live-${pizani.id}`,
    title: pizani.title,
    subtitle: pizani.subtitle,
    price: finalBasePrice,
    priceMax: finalPriceMax,
    priceCnyMin: finalPriceCny,
    priceCnyMax: pizani.priceCnyMax,
    oldPrice: finalOldPrice,
    discount: pizani.discount,
    rating: pizani.rating,
    reviews: pizani.reviews,
    image: pizani.image,
    gallery: pizani.gallery,
    colors: Array.from(colorMap.values()) as any,
    sizes: pizani.sizes,
    variants: (variants.length > 0 ? variants : undefined) as any,
    specs: pizani.specs,
    videoUrl: undefined,
    inStock: pizani.inStock,
    stockCount: pizani.stockCount,
    features: pizani.features,
    description: pizani.description,
    sourceUrl: pizani.sourceUrl,
    moq: pizani.moq,
    supplierName: pizani.supplierName,
    priceOriginalCny: finalPriceCny,
    isLive: true,
    weightKg,
    skuPrices: Object.keys(skuPrices).length > 0 ? skuPrices : undefined,
    lastRefreshedAt: Date.now(),
  };
}

export function mergeToLiveForRefresh(pizani: PizaniProduct, parsebird: ParsebirdListing | null): LiveProduct {
  return mergeToLive(pizani, parsebird);
}

export async function runImageSearchJob(jobId: string, imageBase64OrUrl: string): Promise<void> {
  try {
    updateJob(jobId, { status: "searching" });
    const rawBase64 = toRawBase64(imageBase64OrUrl);
    const imageHash = hashImageBase64(rawBase64);

    try {
      const cachedIds = await getSearchCache(imageHash);
      if (cachedIds.length > 0) {
        const cachedProducts = await loadCachedProducts(cachedIds);
        if (cachedProducts.length > 0) {
          for (const p of cachedProducts) pushProduct(jobId, p);
          updateJob(jobId, { status: "done", offerIds: cachedProducts.map((p) => p.id), totalExpected: cachedProducts.length });
          return;
        }
      }
    } catch (cacheErr) {}

    const listings = await findListingsByBase64(imageBase64OrUrl);
    if (listings.length === 0) {
      updateJob(jobId, { status: "done", error: "No matching products found." });
      return;
    }

    const offerIds: string[] = [];
    const seen = new Set<string>();
    for (const l of listings) {
      const idMatch = (l.url || "").match(/offer\/(\d+)/);
      const id = idMatch ? idMatch[1] : String(l.offerId ?? l.productId ?? "");

      if (!/^\d{8,15}$/.test(id) || seen.has(id)) continue;
      seen.add(id);
      offerIds.push(id);
      if (offerIds.length >= PRODUCTS_WANTED) break;
    }

    if (offerIds.length === 0) {
      updateJob(jobId, { status: "done", error: "No matching products found." });
      return;
    }

    updateJob(jobId, { status: "loading", offerIds, totalExpected: offerIds.length });
    const savedProducts: LiveProduct[] = [];

    const tasks = offerIds.map(async (offerId) => {
      try {
        const [detail, parsebirdData] = await Promise.all([
          fetchPizani1688(offerId),
          parsebirdByOfferId(offerId).catch(() => null),
        ]);
        if (detail) {
          const live = mergeToLive(detail, parsebirdData);
          pushProduct(jobId, live);
          savedProducts.push(live);
          await saveLiveProduct(live); // Keep cache save
          // ❌ REMOVED: await saveProductToStore(live);
          return;
        }
      } catch (err) { console.warn(`[job ${jobId}] ✗ ${offerId} failed:`, err); }

      const raw = listings.find((l) => {
        const idMatch = (l.url || "").match(/offer\/(\d+)/);
        const id = idMatch ? idMatch[1] : String(l.offerId ?? l.productId);
        return id === offerId;
      });

      if (raw) {
        const fallback = fallbackToLive(raw);
        if (fallback) {
          pushProduct(jobId, fallback);
          savedProducts.push(fallback);
          await saveLiveProduct(fallback); // Keep cache save
          // ❌ REMOVED: await saveProductToStore(fallback);
        }
      }
    });

    await Promise.all(tasks);
    if (savedProducts.length > 0) await saveSearchCache(imageHash, savedProducts.map((p) => p.id));
    updateJob(jobId, { status: "done" });
  } catch (err: any) {
    console.error(`[job ${jobId}] failed:`, err);
    updateJob(jobId, { status: "error", error: err?.message || "Search failed." });
  }
}

export async function imageSearch1688(imageUrl: string, _maxResults: number = PRODUCTS_WANTED): Promise<LiveProduct[]> {
  const job = createJob();
  await runImageSearchJob(job.id, imageUrl);
  const { getJob } = await import("./imageSearchJobs");
  const final = getJob(job.id);
  return (final?.products as LiveProduct[]) ?? [];
}

export { createJob };
export type { ImageSearchJob };
