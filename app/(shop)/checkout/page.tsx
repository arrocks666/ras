"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatBDT } from "@/lib/data";
import { useProducts } from "@/lib/ProductsContext";
import { useCart } from "@/lib/CartContext";
import { useOrders, OrderService } from "@/lib/OrderContext";
import { useAuth } from "@/lib/AuthContext";
import LoginPromptModal from "@/components/LoginPromptModal";
import {
  getUserCoupons,
  filterValidCoupons,
  markCouponUsed,
  type Coupon,
} from "@/lib/coupons";
import {
  loadSettings,
  DEFAULT_SETTINGS,
  type StoreSettings,
} from "@/lib/firestoreSettings";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: "💵", note: "Pay when you receive" },
  { id: "bkash", label: "bKash", icon: "📱", note: "Mobile banking" },
  { id: "nagad", label: "Nagad", icon: "💳", note: "Mobile banking" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", note: "Bank account transfer" },
];

function CheckoutImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="text-xl">🎁</span>;
  return <img src={src} alt="" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />;
}

type CheckoutRow = {
  productId: string; colorId: string; size?: string; quantity: number;
  price: number; title: string; image: string; isLive: boolean;
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cart = useCart();
  const orders = useOrders();
  const { user } = useAuth();
  const { products } = useProducts();

  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({ name: "", phone: "", address: "", district: "" });
  const [email, setEmail] = useState("");
  const [selectedServices, setSelectedServices] = useState<OrderService[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [transactionId, setTransactionId] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) { setAvailableCoupons([]); return; }
    (async () => {
      const all = await getUserCoupons(user.uid);
      setAvailableCoupons(filterValidCoupons(all).filter((c) => c.amount > 0));
    })();
  }, [user]);

  const itemsParam = searchParams.get("items") ?? "";
  const selectedKeys = itemsParam ? itemsParam.split(",").filter(Boolean) : cart.items.map((i) => `${i.productId}-${i.colorId}`);

  const rows = useMemo<CheckoutRow[]>(() => {
    const result: CheckoutRow[] = [];
    for (const item of cart.items) {
      const key = `${item.productId}-${item.colorId}`;
      if (!selectedKeys.includes(key)) continue;
      if (item.isLive && item.liveSnapshot) {
        result.push({ productId: item.productId, colorId: item.colorId, size: item.size, quantity: item.quantity, price: item.liveSnapshot.price, title: item.liveSnapshot.title, image: item.liveSnapshot.image, isLive: true });
        continue;
      }
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      result.push({ productId: product.id, colorId: item.colorId, size: item.size, quantity: item.quantity, price: product.price, title: product.title, image: product.image, isLive: false });
    }
    return result;
  }, [cart.items, selectedKeys.join(","), products]);

  const subtotal = rows.reduce((sum, r) => sum + r.price * r.quantity, 0);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.amount, subtotal) : 0;
  const total = subtotal - discountAmount + servicesTotal;
  const paidAmount = paidAmountInput === "" ? 0 : Number(paidAmountInput) || 0;
  const dueAmount = Math.max(0, total - paidAmount);

  const AVAILABLE_SERVICES: OrderService[] = [
    { id: "video_inspection", name: "Video Inspection", price: settings.videoInspectionPrice ?? 180 },
    { id: "basic_inspection", name: "General Inspection", price: settings.basicInspectionPrice ?? 50 },
  ];

  const validateStep1 = () => {
    if (!address.name.trim() || !address.phone.trim() || !address.address.trim() || !address.district.trim() || !email.trim()) {
      setError("Please fill all the information before proceeding."); return false;
    }
    setError(null); return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep > 1 && !validateStep1()) return;
    setStep(targetStep);
  };

  const handleApplyCoupon = (code: string) => {
    setCouponError(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const found = availableCoupons.find((c) => c.code === trimmed);
    if (!found || found.amount <= 0) { setCouponError("Invalid or expired coupon"); return; }
    setAppliedCoupon(found); setCouponInput("");
  };

  const toggleService = (service: OrderService) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      return exists ? prev.filter((s) => s.id !== service.id) : [...prev, service];
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) { setLoginPromptOpen(true); return; }
    if (!validateStep1() || rows.length === 0) return;
    setPlacing(true); setError(null);
    try {
      const newOrder = await orders.addOrder({
        items: rows.map((r) => ({ productId: r.productId, colorId: r.colorId, size: r.size, quantity: r.quantity, price: r.price, title: r.title, image: r.image, isLive: r.isLive })),
        subtotal, shipping: 0, total,
        paymentMethod: PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? "COD",
        address: { ...address, email: email.trim() },
        transactionId: transactionId.trim() || undefined,
        paidAmount, dueAmount, paymentScreenshots: [], selectedServices,
      });
      if (appliedCoupon && user) await markCouponUsed(user.uid, appliedCoupon, newOrder.id);
      rows.forEach((r) => cart.remove(r.productId, r.colorId, r.size));
      router.push(`/orders/${newOrder.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to place order."); setPlacing(false);
    }
  };

  if (rows.length === 0 && !placing) {
    return (
      <div className="min-h-screen bg-[#FFF6F6] flex flex-col items-center justify-center px-4">
        <div className="text-6xl opacity-40 mb-4">🛒</div>
        <h1 className="text-xl font-bold text-[#2B1A24]">Nothing to checkout</h1>
        <Link href="/" className="mt-5 rounded-full bg-[#E8546B] px-6 py-2.5 text-xs font-semibold text-white shadow-orange-glow">Go Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#FFF6F6] pb-8">
        <div className="sticky top-[56px] z-40 border-b border-[#FAD4DD] bg-white shadow-sm md:top-[60px]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
            <Link href="/cart" className="flex h-8 w-8 items-center justify-center text-[#2B1A24] hover:text-[#E8546B]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <h1 className="flex-1 text-lg font-bold text-[#2B1A24] md:text-xl">Checkout</h1>
          </div>
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-3">
            <StepDot num={1} label="Address" active={step === 1} done={step > 1} onClick={() => handleStepClick(1)} />
            <div className={`mx-2 h-0.5 flex-1 ${step > 1 ? "bg-[#E8546B]" : "bg-[#FAD4DD]"}`} />
            <StepDot num={2} label="Payment" active={step === 2} done={step > 2} onClick={() => handleStepClick(2)} />
            <div className={`mx-2 h-0.5 flex-1 ${step > 2 ? "bg-[#E8546B]" : "bg-[#FAD4DD]"}`} />
            <StepDot num={3} label="Confirm" active={step === 3} done={false} onClick={() => handleStepClick(3)} />
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-6">
          {step === 1 && (
            <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#2B1A24]">Delivery Address</h2>
              <div className="space-y-3">
                <Field label="Full Name *" value={address.name} onChange={(v) => setAddress({ ...address, name: v })} placeholder="Enter your full name" />
                <Field label="Phone Number *" value={address.phone} onChange={(v) => setAddress({ ...address, phone: v })} placeholder="+880 1XXX XXXXXX" />
                <Field label="Full Address *" value={address.address} onChange={(v) => setAddress({ ...address, address: v })} placeholder="House, Road, Area" />
                <Field label="District *" value={address.district} onChange={(v) => setAddress({ ...address, district: v })} placeholder="e.g., Dhaka" />
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B5558]">Email Address (For Order Updates) *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
                </div>
              </div>
              {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
              <button onClick={() => handleStepClick(2)} className="mt-5 w-full rounded-lg bg-[#E8546B] py-3 text-sm font-semibold text-white shadow-orange-glow">Continue to Payment</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-[#2B1A24]">Payment Method</h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button key={method.id} onClick={() => setPayment(method.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${payment === method.id ? "border-[#E8546B] bg-[#FFF6F6]" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`}>
                      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${payment === method.id ? "border-[#E8546B]" : "border-[#FAD4DD]"}`}>
                        {payment === method.id && <span className="h-2.5 w-2.5 rounded-full bg-[#E8546B]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#2B1A24]"><span>{method.icon}</span> {method.label}</div>
                        <p className="mt-0.5 text-[11px] text-[#6B5558]">{method.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {payment === "bank" && settings.bankAccountNumber && (
                  <div className="mt-4 rounded-xl border border-[#E8546B]/40 bg-[#FFF6F6] p-4">
                    <p className="text-xs font-bold text-[#2B1A24]">Bank Transfer Details</p>
                    <div className="mt-3 space-y-2 text-xs">
                      <CopyRow label="Bank" value={settings.bankName} onCopy={() => {}} />
                      <CopyRow label="Account Number" value={settings.bankAccountNumber} onCopy={() => {}} />
                      <CopyRow label="Account Holder" value={settings.bankAccountHolder} onCopy={() => {}} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleStepClick(1)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-white py-3 text-sm font-semibold text-[#6B5558]">Back</button>
                <button onClick={() => handleStepClick(3)} className="flex-1 rounded-lg bg-[#E8546B] py-3 text-sm font-semibold text-white shadow-orange-glow">Review Order</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#2B1A24]">Shipping To</h2>
                <p className="text-sm font-semibold text-[#2B1A24]">{address.name || "—"}</p>
                <p className="text-xs text-[#6B5558]">{address.phone || "—"}</p>
                <p className="text-xs text-[#6B5558]">{address.address || "—"}, {address.district || "—"}</p>
                {email && <p className="mt-2 inline-block rounded bg-[#E8546B]/10 px-2 py-1 text-xs text-[#E8546B]">Email: {email}</p>}
              </div>

              <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#2B1A24]">Order Summary</h2>
                <div className="space-y-3">
                  {rows.map((r) => (
                    <div key={`${r.productId}-${r.colorId}`} className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-white p-1">
                        <CheckoutImage src={r.image} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2B1A24]">{r.title}</p>
                        <p className="text-[11px] text-[#6B5558]">Qty {r.quantity} {r.size ? `· ${r.size}` : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-[#E8546B]">{formatBDT(r.price * r.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#2B1A24]">Value Added Services</h2>
                <div className="space-y-2">
                  {AVAILABLE_SERVICES.map((service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id);
                    return (
                      <button key={service.id} onClick={() => toggleService(service)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${isSelected ? "border-[#E8546B] bg-[#FFF6F6]" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white"}`}>{isSelected && <span className="text-[10px]">✓</span>}</div>
                          <div>
                            <p className="text-sm font-semibold text-[#2B1A24]">{service.name}</p>
                            <p className="text-[11px] text-[#6B5558]">Reduce risk before shipping</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#E8546B]">{formatBDT(service.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {user && availableCoupons.length > 0 && (
                <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-lg font-bold text-[#2B1A24]">Have a Coupon?</h2>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                      <div><p className="text-xs font-bold text-green-600">✓ {appliedCoupon.code} applied</p><p className="text-[11px] text-[#6B5558]">{formatBDT(appliedCoupon.amount)} off</p></div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[11px] font-semibold text-red-500 underline">Remove</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
                        <button onClick={() => handleApplyCoupon(couponInput)} disabled={!couponInput.trim()} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Apply</button>
                      </div>
                      {couponError && <p className="mt-2 text-[11px] text-red-500">{couponError}</p>}
                    </>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B5558]"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div>
                  {servicesTotal > 0 && <div className="flex justify-between text-[#6B5558]"><span>Services</span><span>{formatBDT(servicesTotal)}</span></div>}
                  {appliedCoupon && <div className="flex justify-between text-green-600"><span>Coupon ({appliedCoupon.code})</span><span>-{formatBDT(discountAmount)}</span></div>}
                  <div className="mt-2 flex justify-between border-t border-[#FAD4DD] pt-2">
                    <span className="font-bold text-[#2B1A24]">Total</span>
                    <span className="text-lg font-bold text-[#E8546B]">{formatBDT(total)}</span>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => handleStepClick(2)} disabled={placing} className="flex-1 rounded-lg border border-[#FAD4DD] bg-white py-3 text-sm font-semibold text-[#6B5558]">Back</button>
                <button onClick={handlePlaceOrder} disabled={placing} className="flex-1 rounded-lg bg-[#E8546B] py-3 text-sm font-semibold text-white shadow-orange-glow">{placing ? "Placing..." : "Place Order"}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} title="Login to place order" message="Please login or create an account to place your order. Your cart will be saved." />
    </>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return <div className="flex justify-between"><span className="text-[#6B5558]">{label}:</span><span className="font-mono font-medium text-[#2B1A24]">{value}</span></div>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#6B5558]">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
    </div>
  );
}

function StepDot({ num, label, active, done, onClick }: { num: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${done ? "bg-green-500 text-white" : active ? "bg-[#E8546B] text-white shadow-orange-glow" : "bg-[#FAD4DD] text-[#6B5558]"}`}>{done ? "✓" : num}</div>
      <span className={`text-[10px] font-medium ${active ? "text-[#E8546B]" : done ? "text-green-500" : "text-[#6B5558]"}`}>{label}</span>
    </button>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}