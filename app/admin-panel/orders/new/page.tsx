"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatBDT } from "@/lib/adminOrders";
import ImageSearchModal from "@/components/ImageSearchModal";
import { LiveProduct } from "@/lib/liveProduct";
import { OrderService, Order } from "@/lib/OrderContext";
import { loadSettings, DEFAULT_SETTINGS, type StoreSettings } from "@/lib/firestoreSettings";
import { sendOrderEmail } from "@/lib/sendEmail";

type ManualItem = {
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant: string;
};

type SavedAddress = {
  name?: string;
  phone?: string;
  address?: string;
  district?: string;
  email?: string;
};

type FoundUser = {
  uid: string;
  name?: string;
  phone?: string;
  email?: string;
  savedAddress?: SavedAddress;
};

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
  { id: "bank", label: "Bank Transfer" },
];

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) return "0" + digits.slice(3);
  if (digits.startsWith("88") && digits.length === 13) return "0" + digits.slice(3);
  return digits;
}

async function generateUniqueOrderId(): Promise<string> {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function NewAdminOrderPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [payment, setPayment] = useState("cod");
  const [notes, setNotes] = useState("");
  const [shipping, setShipping] = useState(0);
  const [items, setItems] = useState<ManualItem[]>([{ title: "", price: 0, quantity: 1, image: "", variant: "" }]);
  const [selectedServices, setSelectedServices] = useState<OrderService[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchJobId, setImageSearchJobId] = useState<string | null>(null);
  const [imageSearchResults, setImageSearchResults] = useState<LiveProduct[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);
  const imageSearchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const AVAILABLE_SERVICES: OrderService[] = [
    { id: "video_inspection", name: "Video Inspection", price: settings.videoInspectionPrice ?? 180 },
    { id: "basic_inspection", name: "General Inspection", price: settings.basicInspectionPrice ?? 50 },
  ];

  useEffect(() => { loadSettings().then(setSettings).catch(() => {}); }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const total = subtotal + (shipping || 0) + servicesTotal;

  const updateItem = (idx: number, patch: Partial<ManualItem>) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { title: "", price: 0, quantity: 1, image: "", variant: "" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const toggleService = (service: OrderService) => setSelectedServices((prev) => prev.find((s) => s.id === service.id) ? prev.filter((s) => s.id !== service.id) : [...prev, service]);

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    setLookingUp(true); setShowDropdown(true);
    const results: FoundUser[] = [];
    try {
      const normalized = normalizePhone(queryText);
      if (normalized.length >= 3) {
        const qPhone = query(collection(db, "users"), where("phone", ">=", normalized), where("phone", "<=", normalized + "\uf8ff"), limit(5));
        const snapPhone = await getDocs(qPhone);
        snapPhone.forEach((doc) => {
          const data = doc.data();
          results.push({ uid: doc.id, name: data.name || data.savedAddress?.name || "", phone: data.phone || data.savedAddress?.phone || "", email: data.email || "", savedAddress: data.savedAddress || {} });
        });
      }
      if (queryText.length >= 2) {
        const qName = query(collection(db, "users"), where("name", ">=", queryText), where("name", "<=", queryText + "\uf8ff"), limit(5));
        const snapName = await getDocs(qName);
        snapName.forEach((doc) => {
           const data = doc.data();
           if (!results.find(u => u.uid === doc.id)) results.push({ uid: doc.id, name: data.name || data.savedAddress?.name || "", phone: data.phone || data.savedAddress?.phone || "", email: data.email || "", savedAddress: data.savedAddress || {} });
        });
      }
      setSearchResults(results.slice(0, 5));
      if (results.length === 0) setShowDropdown(false);
    } catch (err) { console.error("Search failed:", err); }
    finally { setLookingUp(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { const searchTerm = phone.trim() || name.trim(); if (searchTerm.length >= 2) handleSearch(searchTerm); }, 400);
    return () => clearTimeout(timer);
  }, [phone, name]);

  const selectUser = (user: FoundUser) => {
    setFoundUser(user); setShowDropdown(false);
    setName(user.name || ""); setPhone(user.phone || user.savedAddress?.phone || ""); setEmail(user.email || "");
    setAddress(user.savedAddress?.address || ""); setDistrict(user.savedAddress?.district || "");
  };

  const clearUser = () => { setFoundUser(null); setSearchResults([]); setShowDropdown(false); setPhone(""); setName(""); setEmail(""); setAddress(""); setDistrict(""); };

  const handleUploadPhoto = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file");
    if (file.size > 8 * 1024 * 1024) return alert("Image must be under 8MB.");
    setUploadingIndex(idx);
    try {
      let finalFile = file;
      const isJpeg = file.type === "image/jpeg" || file.type === "image/jpg";
      const isSmall = file.size < 500 * 1024;
      if (!isJpeg || !isSmall) { const { resizeImage } = await import("@/lib/resizeImage"); finalFile = await resizeImage(file, 1600, 0.85); }
      const fd = new FormData(); fd.append("image", finalFile);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      updateItem(idx, { image: data.url });
    } catch (err: any) { alert("Upload failed.\n\n" + (err?.message || "Unknown error")); }
    finally { setUploadingIndex(null); e.target.value = ""; }
  };

  const handleJobStarted = (jobId: string) => {
    setImageSearchJobId(jobId); setImageSearchResults([]); setImageSearchError(null); setImageSearchLoading(true);
    if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
    imageSearchPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/image-search/status?jobId=${jobId}`); if (!res.ok) return;
        const data = await res.json();
        const incoming: LiveProduct[] = data.products ?? []; if (incoming.length > 0) setImageSearchResults(incoming);
        if (data.status === "done") { if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current); setImageSearchLoading(false); if (incoming.length === 0) setImageSearchError("No matches found."); }
        else if (data.status === "error") { if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current); setImageSearchLoading(false); setImageSearchError(data.error || "Search failed."); }
      } catch (err) { console.warn("Poll error:", err); }
    }, 2000);
  };

  const clearImageSearch = () => {
    if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current);
    setImageSearchJobId(null); setImageSearchResults([]); setImageSearchError(null); setImageSearchLoading(false);
  };

  const addProductFromImageSearch = (p: LiveProduct) => {
    setItems((prev) => [...prev, { title: p.title, price: p.price, quantity: 1, image: p.image, variant: "" }]);
  };

  useEffect(() => { return () => { if (imageSearchPollRef.current) clearInterval(imageSearchPollRef.current); }; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name.trim()) return setError("Customer name is required");
    if (!phone.trim()) return setError("Customer phone is required");
    if (!address.trim()) return setError("Address is required");
    if (!email.trim()) return setError("Email is required for order tracking");
    if (items.length === 0) return setError("Add at least one item");
    if (items.some((it) => !it.title.trim())) return setError("All items must have a name");
    setSaving(true);
    try {
      const orderId = await generateUniqueOrderId();
      const paymentLabel = PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? "COD";
      const mappedItems = items.map((it) => {
        const base: Record<string, unknown> = { productId: `manual-${it.title.slice(0, 20)}`, colorId: "default", quantity: it.quantity, price: it.price, title: it.title, isLive: false };
        const img = (it.image ?? "").trim(); const vr = (it.variant ?? "").trim();
        if (img) base.image = img; if (vr) base.variant = vr; return base;
      });
      const orderDoc: Record<string, unknown> = {
        id: orderId, userId: foundUser?.uid ?? "admin-manual", userPhone: phone.trim(),
        createdAt: Date.now(), createdAtServer: serverTimestamp(), status: "placed", statusUpdatedAt: serverTimestamp(),
        items: mappedItems, subtotal, shipping: shipping || 0, total, paidAmount: 0, dueAmount: total, payments: [],
        paymentMethod: paymentLabel, address: { name: name.trim(), phone: phone.trim(), address: address.trim(), district: district.trim(), email: email.trim() }, adminNotes: notes.trim(),
      };
      if (selectedServices.length > 0) orderDoc.selectedServices = selectedServices;
      await setDoc(doc(db, "orders", orderId), orderDoc);
      const orderForEmail: Order = {
        id: orderId, userId: foundUser?.uid ?? "admin-manual", userPhone: phone.trim(), createdAt: Date.now(),
        items: mappedItems as any, subtotal, shipping: shipping || 0, total, paymentMethod: paymentLabel, status: "placed",
        address: { name: name.trim(), phone: phone.trim(), address: address.trim(), district: district.trim(), email: email.trim() }, selectedServices: selectedServices,
      };
      sendOrderEmail(orderForEmail).catch(err => console.error("Email failed:", err));
      router.push(`/admin-panel/orders/${orderId}`);
    } catch (err: any) { setError(err?.message ?? "Failed to create order"); setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push("/admin-panel/orders")} className="mb-4 flex items-center gap-1 text-xs font-semibold text-[#6B5558] transition hover:text-[#E8546B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Orders
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" /> Manual Order
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Create Order</h1>
          <p className="mt-1 text-sm text-[#6B5558]">Add an order received by phone, WhatsApp, or in person.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Customer Info */}
          <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#2B1A24]">Customer Information</h2>
              {foundUser && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Existing Customer</span>}
            </div>

            <div className="space-y-4 relative" ref={dropdownRef}>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Search Customer (Name or Phone) *</label>
                <div className="relative">
                  <input type="text" value={phone} onChange={(e) => { setPhone(e.target.value); if (foundUser) clearUser(); }} placeholder="01XXXXXXXXX or John Doe..." className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
                  {lookingUp && <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />}
                  {showDropdown && searchResults.length > 0 && !foundUser && (
                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[#FAD4DD] bg-white shadow-lg">
                      {searchResults.map((u) => (
                        <button key={u.uid} type="button" onClick={() => selectUser(u)} className="flex w-full flex-col border-b border-[#FAD4DD] px-3 py-2 text-left transition hover:bg-[#FFF6F6] last:border-b-0">
                          <span className="text-sm font-semibold text-[#2B1A24]">{u.name || "Unknown Name"}</span>
                          <span className="text-xs text-[#6B5558]">{u.phone || "No phone"} • {u.email || "No email"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {foundUser && (
                <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2">
                  <div className="text-xs"><span className="font-semibold text-green-700">✓ Found: </span><span className="text-[#2B1A24]">{foundUser.name || "—"}</span></div>
                  <button type="button" onClick={clearUser} className="text-[11px] font-semibold text-red-500 underline">Clear</button>
                </div>
              )}

              <Field label="Full Name *" value={name} onChange={(v) => { setName(v); if (foundUser) clearUser(); }} placeholder="Customer's name" />
              
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Email Address (For Order Tracking) *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Full Address *</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area..." rows={3} className="w-full resize-none rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
              </div>

              <Field label="District" value={district} onChange={setDistrict} placeholder="e.g. Dhaka" />
            </div>
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-lg text-[#2B1A24]">Items</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setImageSearchOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-[#E8546B] bg-white px-3 py-1.5 text-xs font-semibold text-[#E8546B] transition hover:bg-[#FFF6F6]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  Search Image
                </button>
                <button type="button" onClick={addItem} className="rounded-lg border border-[#E8546B] bg-white px-3 py-1.5 text-xs font-semibold text-[#E8546B] transition hover:bg-[#FFF6F6]">+ Add Item</button>
              </div>
            </div>

            {/* Image Search Results Area */}
            {imageSearchJobId && (
              <div className="mb-4 rounded-xl border-2 border-[#E8546B]/40 bg-[#FFF6F6] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-[#E8546B]">{imageSearchLoading ? `Searching... ${imageSearchResults.length} found` : imageSearchResults.length > 0 ? `Found ${imageSearchResults.length} products` : "No matches found"}</p>
                  <button type="button" onClick={clearImageSearch} className="text-[11px] font-semibold text-red-500 underline">Clear</button>
                </div>
                {imageSearchLoading && imageSearchResults.length === 0 && <div className="flex items-center gap-2 py-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /><span className="text-xs text-[#6B5558]">Searching 1688...</span></div>}
                {imageSearchError && <p className="text-xs text-red-500">{imageSearchError}</p>}
                {imageSearchResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {imageSearchResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => { addProductFromImageSearch(p); clearImageSearch(); }} className="flex flex-col overflow-hidden rounded-lg border-2 border-[#FAD4DD] bg-white text-left transition hover:border-[#E8546B]">
                        <div className="aspect-square w-full overflow-hidden bg-[#FFF6F6]">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</div>
                        <div className="p-2"><p className="line-clamp-2 text-[10px] font-medium text-[#2B1A24]">{p.title}</p><p className="mt-1 text-xs font-bold text-[#E8546B]">{formatBDT(p.price)}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] p-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <input type="file" accept="image/*" id={`item-photo-${idx}`} className="sr-only" onChange={(e) => handleUploadPhoto(idx, e)} disabled={uploadingIndex === idx} />
                      <label htmlFor={`item-photo-${idx}`} className={`relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${item.image ? "border-green-400 bg-white" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`}>
                        {uploadingIndex === idx ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /> : item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A88F92]"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg><span className="mt-1 text-[9px] text-[#A88F92]">Photo</span></>}
                      </label>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Product Name *</label>
                      <input type="text" value={item.title} onChange={(e) => updateItem(idx, { title: e.target.value })} placeholder="e.g. Zircon Ring Set" className="w-full rounded border border-[#FAD4DD] bg-white px-2.5 py-2 text-sm focus:border-[#E8546B] focus:outline-none" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-12 gap-2">
                    <div className="col-span-3"><label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Price (৳)</label><input type="number" min={0} value={item.price || ""} onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })} placeholder="0" className="w-full rounded border border-[#FAD4DD] bg-white px-2.5 py-2 text-sm focus:border-[#E8546B] focus:outline-none" /></div>
                    <div className="col-span-2"><label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Qty</label><input type="number" min={1} value={item.quantity || 1} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })} className="w-full rounded border border-[#FAD4DD] bg-white px-2.5 py-2 text-sm focus:border-[#E8546B] focus:outline-none" /></div>
                    <div className="col-span-5"><label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B5558]">Variant</label><input type="text" value={item.variant} onChange={(e) => updateItem(idx, { variant: e.target.value })} placeholder="Red / XL" className="w-full rounded border border-[#FAD4DD] bg-white px-2.5 py-2 text-sm focus:border-[#E8546B] focus:outline-none" /></div>
                    <div className="col-span-2 flex items-end"><button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="flex h-9 w-full items-center justify-center rounded border border-red-200 text-red-500 transition hover:bg-red-50 disabled:opacity-30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment & Services */}
          <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Payment & Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Payment Method</label>
                <select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none">{PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">Shipping (৳)</label>
                <input type="number" min={0} value={shipping} onChange={(e) => setShipping(Number(e.target.value) || 0)} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
              </div>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[#FAD4DD] pt-4 text-sm">
              <div className="flex justify-between text-[#6B5558]"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div>
              {selectedServices.length > 0 && <div className="flex justify-between text-[#6B5558]"><span>Services</span><span>{formatBDT(servicesTotal)}</span></div>}
              <div className="flex justify-between text-[#6B5558]"><span>Shipping</span><span>{formatBDT(shipping || 0)}</span></div>
              <div className="flex justify-between border-t border-[#FAD4DD] pt-2"><span className="font-bold text-[#2B1A24]">Total</span><span className="text-lg font-bold text-[#E8546B]">{formatBDT(total)}</span></div>
            </div>
          </section>

          {/* Admin Notes */}
          <section className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-lg text-[#2B1A24]">Admin Notes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (customer will not see this)" rows={3} className="w-full resize-none rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
          </section>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          <div className="flex gap-3 pb-10">
            <button type="button" onClick={() => router.push("/admin-panel/orders")} className="flex-1 rounded-xl border border-[#FAD4DD] bg-white py-3 text-sm font-semibold text-[#6B5558] transition hover:border-[#E8546B] hover:text-[#E8546B]">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#E8546B] py-3 text-sm font-bold text-white shadow-orange-glow transition hover:bg-[#b02a58] disabled:opacity-50">{saving ? "Creating..." : "Create Order"}</button>
          </div>
        </form>
      </div>

      <ImageSearchModal open={imageSearchOpen} onClose={() => setImageSearchOpen(false)} onJobStarted={handleJobStarted} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5558]">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
    </div>
  );
}