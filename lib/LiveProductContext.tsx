// lib/LiveProductContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { LiveProduct } from "./liveProduct";

type LiveProductContextType = {
  products: LiveProduct[];
  addProduct: (product: LiveProduct) => void;
};

const LiveProductContext = createContext<LiveProductContextType | undefined>(undefined);

export function LiveProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<LiveProduct[]>([]);

  const addProduct = (product: LiveProduct) => {
    setProducts((prev) => [...prev, product]);
  };

  return (
    <LiveProductContext.Provider value={{ products, addProduct }}>
      {children}
    </LiveProductContext.Provider>
  );
}

export function useLiveProducts() {
  const ctx = useContext(LiveProductContext);
  if (!ctx) throw new Error("useLiveProducts must be used within LiveProductProvider");
  return ctx;
}