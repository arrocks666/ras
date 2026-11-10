"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, OrderPayment, OrderCharges, STATUS_ORDER, STATUS_LABELS } from "@/lib/OrderContext";
import { formatBDT, formatDateTime } from "@/lib/adminOrders";
import { generateInvoice } from "@/lib/generateInvoice";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import { sendStatusUpdateEmail, sendPaymentEmail } from "@/lib/sendEmail";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState<OrderStatus>("placed");
  const [chinaOrderIds, setChinaOrderIds] = useState<string[]>([""]);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusNotes, setStatusNotes] = useState<{ [k: string]: string }>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [shippingOverride, setShippingOverride] = useState<string>("");
  const [savingShipping, setSavingShipping] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);

  const [chinaLocalCourier, setChinaLocalCourier] = useState<string>("");
  const [bdCourier, setBdCourier] = useState<string>("");
  const [shippingWeightKg, setShippingWeightKg] = useState<string>("");
  const [shippingRatePerKg, setShippingRatePerKg] = useState<string>("");
  const [showChinaLocalCourier, setShowChinaLocalCourier] = useState(false);
  const [showBdCourier, setShowBdCourier] = useState(false);
  const [showShippingCharge, setShowShippingCharge] = useState(false);
  const [savingCharges, setSavingCharges] = useState(false);

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingChina, setSavingChina] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDoc(doc(db, "orders", id))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) { setNotFound(true); return; }
        const data = { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
        setOrder(data);
        setStatus(data.status);
        setStatusNotes(data.statusNotes ?? {});
        const loadedIds: string[] = Array.isArray(data.chinaOrderIds) ? data.chinaOrderIds.filter((x) => typeof x === "string") : data.chinaOrderId ? [data.chinaOrderId] : [];
        setChinaOrderIds(loadedIds.length > 0 ? loadedIds : [""]);
        setAdminNotes(data.adminNotes ?? "");
        setShippingOverride(String(data.shipping ?? 0));
        const c = data.charges ?? {};
        setChinaLocalCourier(c.chinaLocalCourier != null ? String(c.chinaLocalCourier) : "");
        setBdCourier(c.bdCourier != null ? String(c.bdCourier) : "");
        setShippingWeightKg(c.shippingWeightKg != null ? String(c.shippingWeightKg) : "");
        setShippingRatePerKg(c.shippingRatePerKg != null ? String(c.shippingRatePerKg) : "");
        setShowChinaLocalCourier(!!c.showChinaLocalCourier);
        setShowBdCourier(!!c.showBdCourier);
        setShowShippingCharge(!!c.showShippingCharge);
      })
      .catch((err) => { console.error("Error loading order:", err); if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      await updateDoc(doc(db, "orders", id), { status, statusUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      if (order) { const updatedOrder = { ...order, status }; setOrder(updatedOrder); sendStatusUpdateEmail(updatedOrder, status).catch(console.error); }
      showToast("Status updated & Email sent");
    } catch (err) { showToast("Failed to update status"); }
    finally { setSavingStatus(false); }
  };

  const handleSaveStatusNote = async (s: string) => {
    setSavingNote(s);
    try {
      const note = (statusNotes[s] ?? "").trim();
      const nextNotes = { ...statusNotes };
      if (note) nextNotes[s] = note; else delete nextNotes[s];
      await updateDoc(doc(db, "orders", id), { statusNotes: nextNotes, updatedAt: serverTimestamp() });
      setStatusNotes(nextNotes);
      if (order) setOrder({ ...order, statusNotes: nextNotes });
      showToast(`Note saved for ${STATUS_LABELS[s as OrderStatus]}`);
    } catch (err) { showToast("Failed to save note"); }
    finally { setSavingNote(null); }
  };

  const addChinaId = () => setChinaOrderIds((prev) => [...prev, ""]);
  const removeChinaId = (idx: number) => setChinaOrderIds((prev) => { const next = prev.filter((_, i) => i !== idx); return next.length > 0 ? next : [""]; });
  const updateChinaId = (idx: number, value: string) => setChinaOrderIds((prev) => prev.map((x, i) => (i === idx ? value : x)));

  const handleSaveChina = async () => {
    setSavingChina(true);
    try {
      const cleaned = chinaOrderIds.map((x) => x.trim()).filter(Boolean);
      await updateDoc(doc(db, "orders", id), { chinaOrderIds: cleaned, chinaOrderId: cleaned[0] ?? "", updatedAt: serverTimestamp() });
      if (order) setOrder({ ...order, chinaOrderIds: cleaned, chinaOrderId: cleaned[0] ?? "" });
      setChinaOrderIds(cleaned.length > 0 ? cleaned : [""]);
      showToast("China Order IDs saved");
    } catch (err) { showToast("Failed to save"); }
    finally { setSavingChina(false); }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, "orders", id), { adminNotes: adminNotes.trim(), updatedAt: serverTimestamp() });
      if (order) setOrder({ ...order, adminNotes: adminNotes.trim() });
      showToast("Notes saved");
    } catch (err) { showToast("Failed to save notes"); }
    finally { setSavingNotes(false); }
  };

  const handleSaveShipping = async () => {
    if (!order) return;
    const newShipping = Number(shippingOverride) || 0;
    const newTotal = order.subtotal + newShipping;
    const paidAmount = order.paidAmount ?? 0;
    const newDueAmount = Math.max(0, newTotal - paidAmount);
    setSavingShipping(true);
    try {
      await updateDoc(doc(db, "orders", id), { shipping: newShipping, total: newTotal, paidAmount, dueAmount: newDueAmount, updatedAt: serverTimestamp() });
      setOrder({ ...order, shipping: newShipping, total: newTotal, paidAmount, dueAmount: newDueAmount });
      showToast("Shipping updated");
    } catch (err) { showToast("Failed to update shipping"); }
    finally { setSavingShipping(false); }
  };

  const handleAddPayment = async () => {
    if (!order) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) { showToast("Enter a valid amount"); return; }
    setAddingPayment(true);
    try {
      const noteTrimmed = paymentNote.trim();
      const newPayment: OrderPayment = { id: `p_${Date.now()}`, amount, date: Date.now(), addedBy: "admin", ...(noteTrimmed ? { note: noteTrimmed } : {}) };
      const existing = order.payments ?? [];
      const payments = [...existing, newPayment];
      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = Math.max(0, order.total - paidAmount);
      await updateDoc(doc(db, "orders", id), { payments, paidAmount, dueAmount, updatedAt: serverTimestamp() });
      const updatedOrder = { ...order, payments, paidAmount, dueAmount };
      setOrder(updatedOrder); setPaymentAmount(""); setPaymentNote("");
      sendPaymentEmail(updatedOrder, amount).catch(console.error);
      showToast("Payment added & Email sent");
    } catch (err) { showToast("Failed to add payment"); }
    finally { setAddingPayment(false); }
  };

  const handleMarkPaid = async () => {
    if (!order) return;
    const remainingDue = Math.max(0, order.total - (order.paidAmount ?? 0));
    if (remainingDue <= 0) return;
    try {
      const newPayment: OrderPayment = { id: `p_${Date.now()}_fully`, amount: remainingDue, date: Date.now(), note: "Marked fully paid", addedBy: "admin" };
      const existing = order.payments ?? [];
      const payments = [...existing, newPayment];
      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = Math.max(0, order.total - paidAmount);
      await updateDoc(doc(db, "orders", id), { payments, paidAmount, dueAmount, updatedAt: serverTimestamp() });
      const updatedOrder = { ...order, payments, paidAmount, dueAmount };
      setOrder(updatedOrder);
      sendPaymentEmail(updatedOrder, remainingDue).catch(console.error);
      showToast("Marked as fully paid & Email sent");
    } catch (err) { showToast("Failed to update"); }
  };

  const computedShippingCharge = (Number(shippingWeightKg) || 0) * (Number(shippingRatePerKg) || 0);

  const handleSaveCharges = async () => {
    if (!order) return;
    setSavingCharges(true);
    try {
      const clc = Number(chinaLocalCourier); const bd = Number(bdCourier); const wkg = Number(shippingWeightKg); const rkg = Number(shippingRatePerKg);
      const newCharges: OrderCharges = {
        showChinaLocalCourier, showBdCourier, showShippingCharge,
        ...(clc > 0 ? { chinaLocalCourier: clc } : {}),
        ...(bd > 0 ? { bdCourier: bd } : {}),
        ...(wkg > 0 ? { shippingWeightKg: wkg } : {}),
        ...(rkg > 0 ? { shippingRatePerKg: rkg } : {}),
        ...(computedShippingCharge > 0 ? { shippingCharge: computedShippingCharge } : {}),
      };
      await updateDoc(doc(db, "orders", id), { charges: newCharges, updatedAt: serverTimestamp() });
      setOrder({ ...order, charges: newCharges });
      showToast("Charges saved");
    } catch (err) { showToast("Failed to save charges"); }
    finally { setSavingCharges(false); }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await generateInvoice(order, "Ratry's Artistry Shop", "ratrysartistry.com", settings.logoUrl || undefined);
      showToast("Invoice downloaded");
    } catch (err) { showToast("Failed to generate invoice"); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF6F6] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /></div>;
  if (notFound || !order) return <div className="min-h-screen bg-[#FFF6F6] flex flex-col items-center justify-center"><h3 className="text-lg font-bold text-[#2B1A24]">Order not found</h3><Link href="/admin-panel/orders" className="mt-4 rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white">Back to Orders</Link></div>;

  const isManual = order.userId === "admin-manual";
  const orderPaid = order.paidAmount ?? 0;
  const orderDue = Math.max(0, order.total - orderPaid);
  const isFullyPaid = orderDue === 0;
  const payments = order.payments ?? [];

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#2B1A24] px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>}

        <div className="mb-6">
          <button onClick={() => router.push("/admin-panel/orders")} className="mb-4 flex items-center gap-1 text-xs font-semibold text-[#6B5558] transition hover:text-[#E8546B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Orders
          </button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" /> Order Detail
              </div>
              {isManual && <span className="rounded-full bg-[#FFF6F6] px-2 py-1 text-[10px] font-bold uppercase text-[#6B5558]">Manual</span>}
              {isFullyPaid ? <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold uppercase text-green-700">✅ Paid</span> : <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold uppercase text-red-600">⏳ Due {formatBDT(orderDue)}</span>}
            </div>
            <button onClick={handleDownloadInvoice} disabled={downloading} className="flex items-center gap-2 rounded-lg border-2 border-[#E8546B] bg-white px-4 py-2 text-sm font-semibold text-[#E8546B] transition hover:bg-[#FFF6F6] disabled:opacity-40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {downloading ? "Generating..." : "Invoice"}
            </button>
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-[#6B5558]">Placed {formatDateTime(order.createdAt)}</p>
        </div>

        {/* Order IDs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">Site Order ID</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#E8546B]">#{order.id}</p>
          </div>
          <div className="rounded-2xl border border-[#FAD4DD] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A88F92]">China Order IDs</p>
            <div className="mt-2 space-y-2">
              {chinaOrderIds.map((id, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={id} onChange={(e) => updateChinaId(idx, e.target.value)} placeholder="China order ID" className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm font-mono focus:border-[#E8546B] focus:outline-none" />
                  <button onClick={() => removeChinaId(idx)} className="flex h-9 w-9 items-center justify-center rounded border border-red-200 text-red-500 hover:bg-red-50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={addChinaId} className="text-xs font-semibold text-[#E8546B]">+ Add another</button>
                <button onClick={handleSaveChina} disabled={savingChina} className="ml-auto rounded-lg bg-[#E8546B] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{savingChina ? "Saving..." : "Save IDs"}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Update Status</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm font-medium focus:border-[#E8546B] focus:outline-none">
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={handleSaveStatus} disabled={savingStatus} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white shadow-orange-glow disabled:opacity-40">{savingStatus ? "Saving..." : "Save Status"}</button>
          </div>
        </section>

        {/* Status Notes */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Tracking Notes</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((s) => (
              <div key={s}>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">{STATUS_LABELS[s]}</label>
                <div className="flex gap-2">
                  <input type="text" value={statusNotes[s] ?? ""} onChange={(e) => setStatusNotes({ ...statusNotes, [s]: e.target.value })} placeholder="Note for customer..." className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
                  <button onClick={() => handleSaveStatusNote(s)} disabled={savingNote === s} className="rounded-lg bg-[#E8546B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{savingNote === s ? "..." : "Save"}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment History & Summary */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-lg text-[#2B1A24]">Payment</h2>
            {!isFullyPaid && <button onClick={handleMarkPaid} className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white">Mark as Paid</button>}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div><p className="text-[10px] font-bold uppercase text-[#A88F92]">Total</p><p className="mt-1 text-lg font-bold text-[#2B1A24]">{formatBDT(order.total)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-[#A88F92]">Paid</p><p className="mt-1 text-lg font-bold text-green-600">{formatBDT(orderPaid)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-[#A88F92]">Due</p><p className={`mt-1 text-lg font-bold ${isFullyPaid ? "text-green-600" : "text-[#E8546B]"}`}>{formatBDT(orderDue)}</p></div>
          </div>

          {payments.length > 0 && (
            <div className="mb-5 space-y-2">
              {payments.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">{idx + 1}</span>
                    <div><p className="text-sm font-semibold text-[#2B1A24]">{formatBDT(p.amount)}</p><p className="text-[11px] text-[#6B5558]">{new Date(p.date).toLocaleDateString()}{p.note ? ` · ${p.note}` : ""}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[#FAD4DD] pt-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6B5558]">Add Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount (৳)" className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
              <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Note (optional)" className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
              <button onClick={handleAddPayment} disabled={addingPayment || !paymentAmount} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{addingPayment ? "Adding..." : "+ Add Payment"}</button>
            </div>
          </div>
        </section>

        {/* Shipping Charge */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Shipping Charge</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min={0} value={shippingOverride} onChange={(e) => setShippingOverride(e.target.value)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            <button onClick={handleSaveShipping} disabled={savingShipping || Number(shippingOverride) === order.shipping} className="rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{savingShipping ? "Saving..." : "Save"}</button>
          </div>
        </section>

        {/* Additional Charges */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Additional Charges</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showChinaLocalCourier} onChange={(e) => setShowChinaLocalCourier(e.target.checked)} className="accent-[#E8546B] h-4 w-4" />
              <input type="number" placeholder="China Local Courier" value={chinaLocalCourier} onChange={(e) => setChinaLocalCourier(e.target.value)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showBdCourier} onChange={(e) => setShowBdCourier(e.target.checked)} className="accent-[#E8546B] h-4 w-4" />
              <input type="number" placeholder="BD Courier" value={bdCourier} onChange={(e) => setBdCourier(e.target.value)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={showShippingCharge} onChange={(e) => setShowShippingCharge(e.target.checked)} className="accent-[#E8546B] h-4 w-4" />
              <input type="number" placeholder="Shipping Weight (kg)" value={shippingWeightKg} onChange={(e) => setShippingWeightKg(e.target.value)} className="flex-1 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
              <input type="number" placeholder="Rate/kg" value={shippingRatePerKg} onChange={(e) => setShippingRatePerKg(e.target.value)} className="w-24 rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
              <span className="text-xs font-semibold text-[#E8546B]">= {formatBDT(computedShippingCharge)}</span>
            </div>
          </div>
          <button onClick={handleSaveCharges} disabled={savingCharges} className="mt-4 rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{savingCharges ? "Saving..." : "Save Charges"}</button>
        </section>

        {/* Admin Notes */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Admin Notes (Private)</h2>
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Notes visible only to admin..." className="w-full resize-none rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
          <button onClick={handleSaveNotes} disabled={savingNotes} className="mt-4 rounded-lg bg-[#E8546B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{savingNotes ? "Saving..." : "Save Notes"}</button>
        </section>

        {/* Order Items */}
        <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm mb-5">
          <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[#FAD4DD] pb-3 last:border-b-0 last:pb-0">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] p-1">
                  {item.image ? <button onClick={() => setFullscreenImage(item.image!)} className="flex h-full w-full items-center justify-center"><img src={item.image} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" /></button> : <span className="text-xl">🎁</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#2B1A24]">{item.title ?? "Product"}</p>
                  <p className="mt-0.5 text-[11px] text-[#6B5558]">Qty {item.quantity}{item.variant ? ` · ${item.variant}` : ""}</p>
                </div>
                <span className="text-sm font-bold text-[#E8546B]">{formatBDT(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setFullscreenImage(null)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          <img src={fullscreenImage} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}