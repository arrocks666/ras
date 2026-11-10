// lib/liveProduct.ts
export type LiveProductVariant = {
  colorId: string;
  size: string;
  priceCny?: number;
  price?: number;
  stock?: number;
  image?: string;
  skuId?: string;
  specId?: string;
};

export type LiveProduct = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  priceMax?: number;
  priceCnyMin?: number;
  priceCnyMax?: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  colors: string[];
  sizes: string[];
  variants?: LiveProductVariant[];
  specs?: { name: string; value: string }[];
  videoUrl?: string;
  inStock: boolean;
  stockCount: number;
  features: { icon: string; label: string }[];
  description: string;
  sourceUrl: string;
  moq: number;
  supplierName: string;
  priceOriginalCny: number;
  isLive: boolean;
  weightKg?: number;
  skuPrices?: Record<string, { priceCny: number; discountPriceCny: number; stock?: number }>;
  lastRefreshedAt: number;
};