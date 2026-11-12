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
  calculateCouponDiscount,
  type Coupon,
} from "@/lib/coupons";
import {
  loadSettings,
  DEFAULT_SETTINGS,
  type StoreSettings,
} from "@/lib/firestoreSettings";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: "💵", note: "Pay when you receive" },
  { id: "bkash", label: "bKash", icon: "📱", note: "Send money to our number" },
  { id: "nagad", label: "Nagad", icon: "💳", note: "Send money to our number" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", note: "Transfer to our bank account" },
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
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [senderAccount, setSenderAccount] = useState("");

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
  const discountAmount = appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotal) : 0;
  const total = subtotal - discountAmount + servicesTotal;

  // ✅ USE DYNAMIC PRICES FROM SETTINGS
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

  const validateStep2 = () => {
    if (payment === "bkash" || payment === "nagad") {
      if (!senderNumber.trim() || !transactionId.trim()) {
        setError(`Please enter your ${payment === "bkash" ? "bKash" : "Nagad"} number and Transaction ID.`);
        return false;
      }
    } else if (payment === "bank") {
      if (!senderAccount.trim() || !transactionId.trim()) {
        setError("Please enter your Bank Account number and Transaction ID.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep > 1 && !validateStep1()) return;
    if (targetStep > 2 && !validateStep2()) return;
    setStep(targetStep);
  };

  const toggleService = (service: OrderService) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      return exists ? prev.filter((s) => s.id !== service.id) : [...prev, service];
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) { setLoginPromptOpen(true); return; }
    if (!validateStep1() || !validateStep2() || rows.length === 0) return;
    setPlacing(true); setError(null);
    try {
      const newOrder = await orders.addOrder({
        items: rows.map((r) => ({ productId: r.productId, colorId: r.colorId, size: r.size, quantity: r.quantity, price: r.price, title: r.title, image: r.image, isLive: r.isLive })),
        subtotal, shipping: 0, total,
        paymentMethod: PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? "COD",
        address: { ...address, email: email.trim() },
        transactionId: transactionId.trim() || undefined,
        senderNumber: senderNumber.trim() || undefined,
        senderAccount: senderAccount.trim() || undefined,
        paidAmount: 0, dueAmount: total, paymentScreenshots: [], selectedServices,
      } as any);
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
      <div className="min-h-screen bg-[#FFF6F6] pb-28 md:pb-8">
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
            <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft animate-fade-in">
              <h2 className="mb-5 text-lg font-bold text-[#2B1A24]">Delivery Address</h2>
              <div className="space-y-4">
                <Field label="Full Name *" value={address.name} onChange={(v) => setAddress({ ...address, name: v })} placeholder="Enter your full name" />
                <Field label="Phone Number *" value={address.phone} onChange={(v) => setAddress({ ...address, phone: v })} placeholder="+880 1XXX XXXXXX" />
                <Field label="Full Address *" value={address.address} onChange={(v) => setAddress({ ...address, address: v })} placeholder="House, Road, Area" />
                <Field label="District *" value={address.district} onChange={(v) => setAddress({ ...address, district: v })} placeholder="e.g., Dhaka" />
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Email Address *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all" />
                </div>
              </div>
              {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft">
                <h2 className="mb-5 text-lg font-bold text-[#2B1A24]">Select Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button key={method.id} onClick={() => { setPayment(method.id); setError(null); }} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 ${payment === method.id ? "border-[#E8546B] bg-[#FFF6F6] shadow-[0_4px_20px_-4px_rgba(232,84,107,0.2)] scale-[1.02]" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]/50"}`}>
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${payment === method.id ? "border-[#E8546B] bg-white" : "border-[#FAD4DD] bg-white"}`}>
                        {payment === method.id && <span className="h-3 w-3 rounded-full bg-[#E8546B] animate-pop" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#2B1A24]"><span className="text-xl">{method.icon}</span> {method.label}</div>
                        <p className="mt-0.5 text-[11px] text-[#6B5558]">{method.note}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {(payment === "bkash" || payment === "nagad") && (
                  <div className="mt-5 rounded-2xl border border-[#E8546B]/30 bg-[#FFF6F6] p-4 space-y-4 animate-fade-down">
                    <div className="text-center">
                      <p className="text-xs text-[#6B5558] mb-1">Send Money to this {payment === "bkash" ? "bKash" : "Nagad"} Number:</p>
                      <p className="text-2xl font-bold text-[#E8546B] tracking-wider">{payment === "bkash" ? settings.bkashNumber : settings.nagadNumber}</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1">⚠️ Please send the money first, then fill the form below.</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Your {payment === "bkash" ? "bKash" : "Nagad"} Number</label>
                      <input type="text" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Transaction ID (TrxID)</label>
                      <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 9F7H8J2K" className="w-full rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                    </div>
                  </div>
                )}

                {payment === "bank" && (
                  <div className="mt-5 rounded-2xl border border-[#E8546B]/30 bg-[#FFF6F6] p-4 space-y-4 animate-fade-down">
                    <div className="text-center">
                      <p className="text-xs text-[#6B5558] mb-1">Transfer to this Bank Account:</p>
                      <div className="space-y-1 text-sm font-bold text-[#2B1A24]">
                        <p>{settings.bankName}</p>
                        <p className="text-lg text-[#E8546B] font-mono">{settings.bankAccountNumber}</p>
                        <p className="text-xs text-[#6B5558]">{settings.bankAccountHolder}</p>
                      </div>
                      <p className="text-[10px] text-green-600 font-bold mt-2">⚠️ Please transfer the money first, then fill the form below.</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Your Bank Account Number</label>
                      <input type="text" value={senderAccount} onChange={(e) => setSenderAccount(e.target.value)} placeholder="Your account number" className="w-full rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">Transaction ID (TrxID)</label>
                      <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. BANK123456" className="w-full rounded-xl border border-[#FAD4DD] bg-white px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#6B5558]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                100% Secure & Encrypted Payment
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              
              <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E8546B]" />
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#E8546B]">Shipping To</h2>
                <p className="text-sm font-bold text-[#2B1A24]">{address.name || "—"}</p>
                <p className="text-xs text-[#6B5558] mt-1">{address.phone || "—"}</p>
                <p className="text-xs text-[#6B5558]">{address.address || "—"}, {address.district || "—"}</p>
                {email && <p className="mt-2 inline-block rounded bg-[#E8546B]/10 px-2 py-1 text-[11px] font-medium text-[#E8546B]">{email}</p>}
              </div>

              <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft">
                <h2 className="mb-4 text-sm font-bold text-[#2B1A24]">Value Added Services</h2>
                <div className="space-y-2">
                  {AVAILABLE_SERVICES.map((service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id);
                    return (
                      <button key={service.id} onClick={() => toggleService(service)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${isSelected ? "border-[#E8546B] bg-[#FFF6F6]" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`}>
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
                <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft">
                  <h2 className="mb-3 text-sm font-bold text-[#2B1A24]">Select a Coupon</h2>
                  <div className="space-y-2">
                    {availableCoupons.map((c) => {
                      const isSelected = appliedCoupon?.code === c.code;
                      return (
                        <button 
                          key={c.code} 
                          onClick={() => setAppliedCoupon(isSelected ? null : c)}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 transition ${isSelected ? "border-[#E8546B] bg-[#FFF6F6] ring-1 ring-[#E8546B]" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-[#E8546B] bg-[#E8546B] text-white" : "border-[#FAD4DD] bg-white"}`}>
                              {isSelected && <span className="text-[10px]">✓</span>}
                            </div>
                            <div className="text-left">
                              <p className="font-mono text-xs font-bold text-[#E8546B]">{c.code}</p>
                              <p className="text-sm font-bold text-[#2B1A24]">
                                {c.type === "percentage" ? `${c.amount}% OFF` : `${formatBDT(c.amount)} OFF`}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#A88F92]">Exp {new Date(c.expiresAt).toLocaleDateString("en-GB")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft">
                <h2 className="mb-3 text-sm font-bold text-[#2B1A24]">Order Summary</h2>
                <div className="space-y-3">
                  {rows.map((r) => (
                    <div key={`${r.productId}-${r.colorId}`} className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#FAD4DD] bg-white p-1">
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

              <div className="rounded-3xl border border-[#FAD4DD] bg-white p-5 shadow-soft">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B5558]"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div>
                  {servicesTotal > 0 && <div className="flex justify-between text-[#6B5558]"><span>Services</span><span>{formatBDT(servicesTotal)}</span></div>}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>-{formatBDT(discountAmount)}</span>
                    </div>
                  )}
                  <div className="mt-3 flex justify-between border-t-2 border-dashed border-[#FAD4DD] pt-3">
                    <span className="font-bold text-[#2B1A24]">Total Payable</span>
                    <span className="text-xl font-bold text-[#E8546B]">{formatBDT(total)}</span>
                  </div>
                </div>
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{error}</div>}
            </div>
          )}
        </div>

        <div className="hidden md:flex mx-auto max-w-3xl px-4 pb-10 gap-3">
          {step > 1 && <button onClick={() => handleStepClick(step - 1)} disabled={placing} className="flex-1 rounded-xl border-2 border-[#FAD4DD] bg-white py-3.5 text-sm font-bold text-[#6B5558] hover:bg-gray-50">Back</button>}
          {step < 3 ? (
            <button onClick={() => handleStepClick(step + 1)} className="flex-[2] rounded-xl bg-[#E8546B] py-3.5 text-sm font-bold text-white shadow-glow hover:bg-[#b02a58]">Continue</button>
          ) : (
            <button onClick={handlePlaceOrder} disabled={placing} className="flex-[2] rounded-xl bg-[#E8546B] py-3.5 text-sm font-bold text-white shadow-glow hover:bg-[#b02a58]">{placing ? "Placing Order..." : "Place Order"}</button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#FAD4DD] bg-white p-3 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => handleStepClick(step - 1)} disabled={placing} className="flex h-12 w-[30%] items-center justify-center rounded-xl border-2 border-[#FAD4DD] bg-white text-sm font-bold text-[#6B5558]">
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button onClick={() => handleStepClick(step + 1)} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] text-sm font-bold text-white shadow-md active:scale-[0.98]">
              Continue to {step === 1 ? "Payment" : "Review"}
            </button>
          ) : (
            <button onClick={handlePlaceOrder} disabled={placing} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] text-sm font-bold text-white shadow-md active:scale-[0.98]">
              {placing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                `Place Order · ${formatBDT(total)}`
              )}
            </button>
          )}
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} title="Login to place order" message="Please login or create an account to place your order. Your cart will be saved." />
    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B5558]">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-3 text-sm font-medium focus:border-[#E8546B] focus:outline-none focus:ring-2 focus:ring-[#E8546B]/20 transition-all" />
    </div>
  );
}

function StepDot({ num, label, active, done, onClick }: { num: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${done ? "bg-green-500 text-white shadow-sm" : active ? "bg-[#E8546B] text-white shadow-orange-glow scale-110" : "bg-[#FAD4DD] text-[#6B5558]"}`}>{done ? "✓" : num}</div>
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${active ? "text-[#E8546B]" : done ? "text-green-500" : "text-[#6B5558]"}`}>{label}</span>
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