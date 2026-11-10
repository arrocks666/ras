// lib/firestoreLiveProducts.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { LiveProduct } from "./liveProduct";

export async function saveLiveProduct(product: LiveProduct): Promise<void> {
  try {
    // 🆕 Clean undefined fields before saving
    const cleanProduct = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, "live_products", product.id), cleanProduct);
  } catch (err) {
    console.error("Failed to save live product:", err);
  }
}

export async function getLiveProduct(id: string): Promise<LiveProduct | null> {
  try {
    const snap = await getDoc(doc(db, "live_products", id));
    if (snap.exists()) return snap.data() as LiveProduct;
    return null;
  } catch (err) {
    return null;
  }
}

export async function saveSearchCache(imageHash: string, productIds: string[]): Promise<void> {
  try {
    await setDoc(doc(db, "search_cache", imageHash), {
      imageHash,
      productIds,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("Failed to save search cache:", err);
  }
}

export async function getSearchCache(imageHash: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "search_cache", imageHash));
    if (snap.exists()) {
      const data = snap.data();
      if (Date.now() - data.createdAt < 7 * 24 * 60 * 60 * 1000) {
        return data.productIds || [];
      }
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function loadCachedProducts(ids: string[]): Promise<LiveProduct[]> {
  if (ids.length === 0) return [];
  try {
    const results = await Promise.all(ids.map(id => getLiveProduct(id)));
    return results.filter((p): p is LiveProduct => p !== null);
  } catch (err) {
    return [];
  }
}