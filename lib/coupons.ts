// lib/coupons.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Coupon = {
  code: string;
  amount: number;
  expiresAt: number;
  minSpend?: number;
  isUsed?: boolean;
};

export async function getUserCoupons(userId: string): Promise<Coupon[]> {
  try {
    // In a real scenario, this would fetch from a 'user_coupons' collection.
    // For now, we return an empty array so the checkout works without errors.
    return [];
  } catch (err) {
    console.error("Error fetching coupons:", err);
    return [];
  }
}

export function filterValidCoupons(coupons: Coupon[]): Coupon[] {
  const now = Date.now();
  return coupons.filter(c => 
    c.expiresAt > now && 
    !c.isUsed && 
    c.amount > 0
  );
}

export async function markCouponUsed(userId: string, coupon: Coupon, orderId: string): Promise<void> {
  try {
    // In a real scenario, this would update the coupon status in Firestore.
    console.log(`Coupon ${coupon.code} marked as used for order ${orderId}`);
  } catch (err) {
    console.error("Error marking coupon used:", err);
  }
}