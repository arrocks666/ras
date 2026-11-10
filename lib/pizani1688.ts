// lib/pizani1688.ts
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

import { translateToEnglish, hasChinese } from "./translation";
import { translateColorName } from "./colorTranslations";
import { computePrice, DEFAULT_PRICING } from "./pricing";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const PIZANI_ACTOR_ID = process.env.APIFY_PIZANI_ACTOR_ID || "pizani~1688-product-scraper";
if (!APIFY_TOKEN) throw new Error("Missing APIFY_TOKEN");
if (!PIZANI_ACTOR_ID) throw new Error("Missing APIFY_PIZANI_ACTOR_ID");

type RawOption = { name: string; imgUrl: string | null; price: number | null; priceCNY: number | null; stock: number; skuNo: string; };
type RawProductInfo = { urlproduct: string; title: string; titleCN: string; price: string; priceCNY: string; minOrderQuantity: number; totalStock: number; imgList: string[]; atributtes: Record<string, string>; options: RawOption[]; };
type RawResponse = { sellerInfo?: { shopTitle?: string | null; }; productInfo?: RawProductInfo; };

export type PizaniProduct = {
  id: string; title: string; subtitle?: string; price: number; priceMax?: number;
  priceCnyMin: number; priceCnyMax?: number; oldPrice: number; discount: number;
  rating: number; reviews: number; image: string; gallery: string[];
  colors: { id: string; label: string; hex: string; image?: string }[];
  sizes: string[];
  variants?: { colorId?: string; size?: string; priceCny?: number; price?: number; stock?: number; image?: string; skuId?: string; specId?: string }[];
  specs?: { name: string; value: string }[];
  inStock: boolean; stockCount: number; features: { icon: string; label: string }[];
  description: string; sourceUrl: string; moq: number; supplierName: string;
  priceOriginalCny: number; weightKg?: number; isLive: true;
};

function hexFromName(name: string, fallback?: string): string {
  if (fallback && fallback.startsWith("#")) return fallback;
  const l = name.toLowerCase();
  if (l.includes("black")) return "#000000";
  if (l.includes("white")) return "#FFFFFF";
  if (l.includes("red")) return "#DC2626";
  if (l.includes("blue")) return "#2563EB";
  if (l.includes("green")) return "#16A34A";
  if (l.includes("yellow")) return "#EAB308";
  if (l.includes("purple")) return "#7C3AED";
  if (l.includes("pink")) return "#EC4899";
  if (l.includes("orange")) return "#EA580C";
  if (l.includes("gray") || l.includes("grey")) return "#6B7280";
  if (l.includes("brown")) return "#78350F";
  return "#9CA3AF";
}

function colorIdFromLabel(label: string, idx: number): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return slug ? `${slug}-${idx}` : `color-${idx}`;
}

async function translateSafe(text: string): Promise<string> {
  if (!text) return "";
  if (!hasChinese(text)) return text.trim();
  const t = await translateToEnglish(text);
  return t && !hasChinese(t) ? t.trim() : "";
}

async function translateAll(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((t) => translateSafe(t)));
}

function cnyToBdt(cny: number): number | undefined {
  if (cny <= 0) return undefined;
  return computePrice(cny, DEFAULT_PRICING).sellingBdt;
}

function parseOptions(options: RawOption[]): {
  colors: { id: string; label: string; hex: string; image?: string }[];
  sizes: string[];
  variants: PizaniProduct["variants"];
} {
  const colorMap = new Map<string, { id: string; label: string; hex: string; image?: string }>();
  const sizesSet = new Set<string>();
  const variants: NonNullable<PizaniProduct["variants"]> = [];

  for (const opt of options) {
    const parts = opt.name.split("/").map((p) => p.trim());
    const colorLabel = parts[0] ?? "";
    const sizeLabel = parts[1] ?? "";

    if (colorLabel && !colorMap.has(colorLabel)) {
      colorMap.set(colorLabel, { id: colorIdFromLabel(colorLabel, colorMap.size), label: colorLabel, hex: hexFromName(colorLabel), image: opt.imgUrl ?? undefined });
    }
    if (sizeLabel) sizesSet.add(sizeLabel);

    const colorObj = colorMap.get(colorLabel);
    const cnyValue = Number(opt.priceCNY) || 0;
    const bdtValue = cnyToBdt(cnyValue);

    variants.push({
      colorId: colorObj?.id,
      size: sizeLabel || undefined,
      priceCny: cnyValue > 0 ? cnyValue : undefined,
      price: bdtValue,
      stock: opt.stock,
      image: opt.imgUrl ?? undefined,
      skuId: opt.skuNo,
      specId: opt.skuNo,
    });
  }

  return { colors: Array.from(colorMap.values()), sizes: Array.from(sizesSet), variants: variants.length > 0 ? variants : undefined };
}

async function callPizani(productUrl: string, timeoutSec: number = 180): Promise<RawResponse[]> {
  const url = `https://api.apify.com/v2/acts/${PIZANI_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSec}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_url: productUrl, productUrl: productUrl, resolve_shop_name: false, resolveShopName: false }),
  });
  if (!res.ok) throw new Error(`Pizani actor failed (${res.status})`);
  return (await res.json()) as RawResponse[];
}

function resolvePriceCny(p: RawProductInfo, offerId: string): number {
  const moq = p.minOrderQuantity || 1;
  let minCny = Number(p.priceCNY) || 0;
  if (minCny > 0 && minCny < 15 && moq === 1) minCny = minCny / DEFAULT_PRICING.cnyToUsd;
  if (minCny > 0 && moq > 1) minCny = minCny * moq;
  if (minCny > 0) return minCny;
  if (p.price) {
    const usd = Number(String(p.price).replace(/[^\d.]/g, ""));
    if (usd > 0) return (usd / DEFAULT_PRICING.cnyToUsd) * moq;
  }
  const optionPrices = (p.options ?? []).map((o) => Number(o.priceCNY) || 0).filter((n) => n > 0);
  if (optionPrices.length > 0) return Math.min(...optionPrices) * moq;
  return 0;
}

export async function fetchPizani1688(offerId: string): Promise<PizaniProduct | null> {
  const productUrl = `https://detail.1688.com/offer/${offerId}.html`;
  let items: RawResponse[];
  try { items = await callPizani(productUrl); }
  catch (err: any) { return null; }

  const first = items[0];
  if (!first || !first.productInfo) return null;

  const p = first.productInfo;
  const minCny = resolvePriceCny(p, offerId);
  if (minCny <= 0) return null;

  const priceMin = computePrice(minCny, DEFAULT_PRICING).sellingBdt;
  const oldPrice = Math.round(priceMin * 1.3);

  const gallery = (p.imgList ?? []).filter((u) => typeof u === "string" && u.startsWith("http"));
  if (gallery.length === 0) return null;

  const parsed = parseOptions(p.options ?? []);

  const translatedColors = await Promise.all(parsed.colors.map(async (c) => {
    const direct = translateColorName(c.label);
    const label = direct ?? (await translateSafe(c.label));
    return { ...c, label: label || c.label };
  }));

  const rawSpecs = p.atributtes ?? {};
  const specEntries = Object.entries(rawSpecs).filter(([, v]) => v && v !== "/" && v !== "-");
  const [specNames, specValues] = await Promise.all([
    translateAll(specEntries.map(([k]) => k)),
    translateAll(specEntries.map(([, v]) => v)),
  ]);

  const specs: { name: string; value: string }[] = [];
  for (let i = 0; i < specEntries.length; i++) {
    if (specNames[i] && specValues[i]) specs.push({ name: specNames[i], value: specValues[i] });
  }

  let title = p.title?.trim() ?? "";
  if (!title || hasChinese(title)) {
    const t = await translateSafe(p.titleCN ?? "");
    title = t || p.titleCN || "Product";
  }

  const supplierName = first.sellerInfo?.shopTitle ?? "1688 Supplier";
  const stockCount = (p.options ?? []).reduce((sum, o) => sum + (o.stock || 0), 0);
  const features: { icon: string; label: string }[] = [{ icon: "📦", label: `MOQ ${p.minOrderQuantity || 1}` }];

  const cleanTitle = title.slice(0, 120);
  const finalDescription = `${cleanTitle}. High quality product imported directly from verified 1688 suppliers. Fast delivery to Bangladesh. Contact our support team for any questions.`;

  return {
    id: offerId,
    title: cleanTitle,
    subtitle: supplierName || "China",
    price: priceMin,
    priceMax: undefined,
    priceCnyMin: minCny,
    priceCnyMax: undefined,
    oldPrice,
    discount: 20,
    rating: 4.5,
    reviews: 0,
    image: gallery[0],
    gallery,
    colors: translatedColors,
    sizes: parsed.sizes,
    variants: parsed.variants,
    specs: specs.length > 0 ? specs : undefined,
    inStock: true,
    stockCount: stockCount || 9999,
    features,
    description: finalDescription,
    sourceUrl: productUrl,
    moq: p.minOrderQuantity || 1,
    supplierName,
    priceOriginalCny: minCny,
    isLive: true,
  };
}