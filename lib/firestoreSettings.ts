// lib/firestoreSettings.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type MarkupTier = { id: string; min: number; max: number; multiplier: number; };
export type FaqItem = { id: string; q: string; a: string; };
export type FooterLink = { id: string; label: string; href: string; };
export type ShippingRate = { id: string; category: string; examples: string; rate: string; notes: string; };

export type StoreSettings = {
  storeName: string;
  logoUrl: string;
  ownerName: string;
  footerDescription: string;
  
  // Contact Info
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;

  // Social Links
  facebookUrl: string;
  instagramUrl: string;
  whatsappNumber: string;
  whatsappChatNumber: string;

  // Store Policies
  shippingCharge: number;
  estimatedDeliveryDays: string;
  shippingRates: ShippingRate[];
  
  // Payment Info
  bkashNumber: string;
  nagadNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;

  // Marketing
  newsletterTitle: string;
  newsletterSubtitle: string;

  // Pricing
  cnyToUsd: number;
  usdToBdt: number;
  markupTiers: MarkupTier[];
  
  // Inspection Prices
  videoInspectionPrice: number;
  basicInspectionPrice: number;

  // Content
  faqItems: FaqItem[];
  footerInfoLinks: FooterLink[];
  footerHelpLinks: FooterLink[];
  
  updatedAt?: unknown;
};

export const DEFAULT_FOOTER_INFO_LINKS: FooterLink[] = [
  { id: "info-1", label: "About Us", href: "/about" },
  { id: "info-2", label: "Privacy Policy", href: "/privacy" },
  { id: "info-3", label: "Terms & Conditions", href: "/terms" },
  { id: "info-4", label: "Sitemap", href: "/sitemap" },
];

export const DEFAULT_FOOTER_HELP_LINKS: FooterLink[] = [
  { id: "help-1", label: "Contact Us", href: "/contact" },
  { id: "help-2", label: "Track Order", href: "/tracking" },
  { id: "help-3", label: "FAQ", href: "/faq" },
  { id: "help-4", label: "Shipping Policy", href: "/shipping" },
  { id: "help-5", label: "Returns & Refunds", href: "/returns" },
];

export const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
  { id: "bags", category: "Bags & Wallets", examples: "Backpack, Handbag", rate: "৳730", notes: "Standard Rate" },
  { id: "shoes", category: "Shoes & Footwear", examples: "Sneakers, Sandals", rate: "৳740 – ৳770", notes: "Standard Rate" },
  { id: "clothing", category: "Clothing", examples: "T-Shirt, Jacket", rate: "৳760 – ৳800", notes: "Standard Rate" },
  { id: "electronics", category: "Electronics", examples: "Gadget, Tools", rate: "৳1,250", notes: "Standard Rate" },
  { id: "laptop", category: "Laptop", examples: "Laptop", rate: "৳2,200", notes: "High Value Item" },
  { id: "cosmetics", category: "Cosmetics", examples: "Makeup, Skincare", rate: "৳1,450", notes: "Handle with Care" },
  { id: "watches", category: "Watches", examples: "Smartwatch, Watch", rate: "৳1,100 – ৳1,250", notes: "Standard Rate" },
  { id: "mobile", category: "Mobile Accessories", examples: "Cover, Charger", rate: "৳780 – ৳1,050", notes: "Standard Rate" },
  { id: "home", category: "Home & Kitchen", examples: "Kitchen Item", rate: "৳730 – ৳1,100", notes: "Standard Rate" },
  { id: "toys", category: "Toys & Gifts", examples: "Toy, Doll", rate: "৳730 – ৳1,100", notes: "Standard Rate" },
];

export const DEFAULT_MARKUP_TIERS: MarkupTier[] = [
  { id: "tier-1", min: 0, max: 500, multiplier: 1.5 },
  { id: "tier-2", min: 500, max: 2000, multiplier: 1.35 },
  { id: "tier-3", min: 2000, max: 5000, multiplier: 1.25 },
  { id: "tier-4", min: 5000, max: 10000, multiplier: 1.18 },
  { id: "tier-5", min: 10000, max: 99999999, multiplier: 1.12 },
];

export const DEFAULT_FAQS: FaqItem[] = [
  { id: "faq-1", q: "How do I place an order?", a: "Browse products, add to cart, and checkout." },
  { id: "faq-2", q: "How long does shipping take?", a: "7-15 business days." },
  { id: "faq-3", q: "How can I track my order?", a: "Go to My Orders and tap an order." },
  { id: "faq-4", q: "What payment methods do you accept?", a: "bKash, Nagad, Bank Transfer, COD." },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Ratry's Artistry Shop",
  logoUrl: "",
  ownerName: "Ratry's Artistry Shop",
  footerDescription: "Your trusted gift shop bringing quality products from China directly to Bangladesh. Trendy collections, best quality, delivered to your doorstep.",
  contactPhone: "+880 1689-768307",
  contactEmail: "support@ratrysartistry.com",
  contactAddress: "Dhaka, Bangladesh",
  contactHours: "Sat – Thu, 10AM – 8PM",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  whatsappNumber: "8801689768307",
  whatsappChatNumber: "8801689768307",
  shippingCharge: 0,
  estimatedDeliveryDays: "15–25 Days",
  shippingRates: DEFAULT_SHIPPING_RATES,
  bkashNumber: "01711-111111",
  nagadNumber: "01811-111111",
  bankName: "Dutch Bangla Bank",
  bankAccountNumber: "1234567890123",
  bankAccountHolder: "Ratry's Artistry Shop",
  newsletterTitle: "Get 10% Off Your First Order",
  newsletterSubtitle: "Subscribe to our newsletter for exclusive deals & new arrivals",
  cnyToUsd: 0.14,
  usdToBdt: 121,
  markupTiers: DEFAULT_MARKUP_TIERS,
  faqItems: DEFAULT_FAQS,
  footerInfoLinks: DEFAULT_FOOTER_INFO_LINKS,
  footerHelpLinks: DEFAULT_FOOTER_HELP_LINKS,
  videoInspectionPrice: 180,
  basicInspectionPrice: 50,
};

const SETTINGS_DOC = ["settings", "general"] as const;
const CACHE_KEY = "ras_settings_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

let memoryCache: StoreSettings | null = null;

export async function loadSettings(): Promise<StoreSettings> {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { data: StoreSettings; cachedAt: number };
      if (parsed.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
        memoryCache = parsed.data;
        return parsed.data;
      }
    }
  } catch {}

  try {
    const ref = doc(db, SETTINGS_DOC[0], SETTINGS_DOC[1]);
    const snap = await getDoc(ref);

    let result: StoreSettings;
    if (!snap.exists()) {
      result = DEFAULT_SETTINGS;
    } else {
      const data = snap.data() as Partial<StoreSettings>;
      result = {
        ...DEFAULT_SETTINGS,
        ...data,
        markupTiers: Array.isArray(data.markupTiers) && data.markupTiers.length > 0 ? data.markupTiers : DEFAULT_MARKUP_TIERS,
        faqItems: Array.isArray(data.faqItems) && data.faqItems.length > 0 ? data.faqItems : DEFAULT_FAQS,
        shippingRates: Array.isArray(data.shippingRates) && data.shippingRates.length > 0 ? data.shippingRates : DEFAULT_SHIPPING_RATES,
        footerInfoLinks: Array.isArray(data.footerInfoLinks) && data.footerInfoLinks.length > 0 ? data.footerInfoLinks : DEFAULT_FOOTER_INFO_LINKS,
        footerHelpLinks: Array.isArray(data.footerHelpLinks) && data.footerHelpLinks.length > 0 ? data.footerHelpLinks : DEFAULT_FOOTER_HELP_LINKS,
      };
    }

    memoryCache = result;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, cachedAt: Date.now() })); } catch {}
    return result;
  } catch (err) {
    console.error("Error loading settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export function invalidateSettingsCache() {
  memoryCache = null;
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export async function saveSettings(partial: Partial<StoreSettings>): Promise<void> {
  const ref = doc(db, SETTINGS_DOC[0], SETTINGS_DOC[1]);
  await setDoc(ref, { ...partial, updatedAt: serverTimestamp() }, { merge: true });
  invalidateSettingsCache();
}