"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Product = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  priceMax?: number;
  priceCnyMin?: number;
  priceCnyMax?: number;
  priceOriginalCny?: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  colors: { id: string; label: string; hex: string; image?: string }[];
  sizes: string[];
  variants?: any[];
  specs?: { name: string; value: string }[];
  videoUrl?: string;
  inStock: boolean;
  stockCount: number;
  features: { icon: string; label: string }[];
  description: string;
  sourceUrl?: string;
  moq?: number;
  supplierName?: string;
  isLive?: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
  categoryId?: string;
  subcategory?: string;
  weightKg?: number;
  views?: number;
};

type ProductsContextType = {
  products: Product[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list: Product[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Product, "id">;
        return {
          ...data,
          id: d.id,
          colors: Array.isArray(data.colors) ? data.colors : [],
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
        };
      });
      list.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
      setProducts(list);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ProductsContext.Provider value={{ products, loading, refresh }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
}