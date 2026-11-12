// lib/coupons.ts
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

export type Coupon = {
  code: string;
  type: "percentage" | "fixed"; // ✅ NEW: Type of coupon
  amount: number;               // ✅ 10 for 10%, or 50 for ৳50
  createdAt: number;
  expiresAt: number;
  used: boolean;
  usedAt?: number;
  orderId?: string;
};

type RawCoupon = {
  code?: string;
  type?: "percentage" | "fixed";
  amount?: number;
  percent?: number;
  createdAt?: number;
  expiresAt?: number;
  used?: boolean;
  usedAt?: number;
  orderId?: string;
};

function normalizeCoupon(raw: RawCoupon): Coupon | null {
  if (!raw || !raw.code) return null;
  
  // Handle old coupons that used 'percent' instead of 'type'
  let type = raw.type || "fixed";
  let amount = typeof raw.amount === "number" ? raw.amount : 0;
  if (raw.percent) {
    type = "percentage";
    amount = raw.percent;
  }

  return {
    code: raw.code,
    type: type as "percentage" | "fixed",
    amount,
    createdAt: raw.createdAt ?? 0,
    expiresAt: raw.expiresAt ?? 0,
    used: !!raw.used,
    usedAt: raw.usedAt,
    orderId: raw.orderId,
  };
}

export function generateCouponCode(): string {
  const chars = "ABCDEF0123456789";
  let code = "RAS-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ✅ Give a coupon (Supports both % and ৳)
export async function giveCoupon(
  uid: string,
  type: "percentage" | "fixed",
  amount: number,
  expiresInDays: number = 30
): Promise<Coupon> {
  const now = Date.now();
  const coupon: Coupon = {
    code: generateCouponCode(),
    type,
    amount,
    createdAt: now,
    expiresAt: now + expiresInDays * 24 * 60 * 60 * 1000,
    used: false,
  };

  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    coupons: arrayUnion(coupon),
  });

  return coupon;
}

export async function getUserCoupons(uid: string): Promise<Coupon[]> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data() as { coupons?: RawCoupon[] };
    const raw = data.coupons ?? [];
    return raw.map(normalizeCoupon).filter((c): c is Coupon => c !== null && c.amount > 0);
  } catch (err) {
    console.error("Error reading coupons:", err);
    return [];
  }
}

export function filterValidCoupons(coupons: Coupon[]): Coupon[] {
  const now = Date.now();
  return coupons.filter((c) => !c.used && c.expiresAt > now);
}

// ✅ Calculate discount based on type
export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "percentage") {
    return Math.round((subtotal * coupon.amount) / 100);
  }
  return Math.min(coupon.amount, subtotal); // Fixed amount (max = subtotal)
}

export async function markCouponUsed(uid: string, coupon: Coupon, orderId: string): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");

  const data = snap.data() as { coupons?: RawCoupon[] };
  const coupons = data.coupons ?? [];

  const updated = coupons.map((c) => {
    if (c.code !== coupon.code) return c;
    return { ...c, used: true, usedAt: Date.now(), orderId };
  });

  await updateDoc(ref, { coupons: updated });
}

// Admin user directory
export type AdminUser = {
  uid: string;
  phone?: string;
  name?: string;
  email?: string;
  coupons?: Coupon[];
  savedAddress?: any;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => {
      const data = d.data() as {
        coupons?: RawCoupon[];
        name?: string;
        phone?: string;
        email?: string;
        savedAddress?: any;
      };

      const rawCoupons = data.coupons ?? [];
      const normalized = rawCoupons.map(normalizeCoupon).filter((c): c is Coupon => c !== null);
      const savedAddress = data.savedAddress ?? {};
      const resolvedName = data.name || savedAddress.name || undefined;
      const realEmail = data.email && !data.email.endsWith("@ratrysartistry.app") ? data.email : undefined;
      const resolvedEmail = savedAddress.email ?? realEmail ?? undefined;

      return {
        uid: d.id,
        phone: data.phone ?? savedAddress.phone ?? undefined,
        name: resolvedName,
        email: resolvedEmail,
        coupons: normalized,
        savedAddress,
      };
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}