"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatBDT } from "@/lib/data";
import { imgSrc } from "@/lib/img";
import { useCart } from "@/lib/CartContext";
import { 
  loadSettings, 
  DEFAULT_SETTINGS, 
  DEFAULT_SHIPPING_RATES, 
  type StoreSettings 
} from "@/lib/firestoreSettings";
import WhatsAppButton from "@/components/WhatsAppButton";
import Link from "next/link";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const cart = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const [btnState, setBtnState] = useState<"idle" | "loading" | "success">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          setSelectedImage(data.image || "");
          setCurrentPrice(data.price || 0);

          document.title = `${data.title || "Product"} - ৳${data.price} | Ratri's Artistry Shop`;
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute("name", "description");
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute("content", data.description?.slice(0, 160) || "Shop premium products from China to Bangladesh.");

          if (data.colors && data.colors.length > 0) {
            const first = data.colors[0] as any;
            const colorObj = typeof first === "string" ? { label: first, image: "" } : first;
            setSelectedColor(colorObj);
            if (colorObj.image) setSelectedImage(colorObj.image);
          }
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(typeof data.sizes[0] === "string" ? data.sizes[0] : (data.sizes[0] as any).label || "");
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  // PRICE RULE:
  // - if the product's SKUs really have different prices (like 1688), show the
  //   selected variant's own price
  // - if every variant was flattened to one price (or admin set one price),
  //   the admin price wins everywhere
  useEffect(() => {
    if (!product) return;
    const base = Number(product.price) || 0;
    const list = Array.isArray(product.variants) ? product.variants : [];
    const variant = list.length > 0
      ? list.find((v: any) => {
          const matchesColor =
            !selectedColor ||
            v.colorId === selectedColor.label ||
            v.colorId === selectedColor.id ||
            (!!selectedColor.image && !!v.image && v.image === selectedColor.image) ||
            selectedColor.label === "Default";
          const matchesSize = !selectedSize || v.size === selectedSize || selectedSize === "One Size";
          return matchesColor && matchesSize;
        })
      : undefined;

    const prices = list.map((v: any) => Number(v?.price) || 0).filter((p: number) => p > 0);
    const hasVariantPricing = prices.length > 0 && prices.some((p: number) => p !== prices[0]);
    const variantPrice = Number(variant?.price) || 0;

    setCurrentPrice(hasVariantPricing && variantPrice > 0 ? variantPrice : base);
  }, [selectedColor, selectedSize, product]);

  const handleSelectColor = (c: any) => {
    setSelectedColor(c);
    if (c.image) setSelectedImage(c.image);
    else setSelectedImage(product?.image || "");
  };

  const handleAddToCart = () => {
    if (!product || btnState !== "idle") return;
    setBtnState("loading");
    setTimeout(() => {
      const variantText = [selectedColor?.label, selectedSize]
        .filter((v) => v && v !== "One Size")
        .join(" / ");
      cart.add(
        product.id,
        selectedColor?.label || "Default",
        selectedSize || "One Size",
        Number(quantity) || 1,
        variantText || undefined,
        currentPrice,
        product.title,
        selectedImage || product.image
      );
      setBtnState("success");
      setTimeout(() => setBtnState("idle"), 2000);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const variantText = [selectedColor?.label, selectedSize]
      .filter((v) => v && v !== "One Size")
      .join(" / ");
    cart.add(
      product.id,
      selectedColor?.label || "Default",
      selectedSize || "One Size",
      Number(quantity) || 1,
      variantText || undefined,
      currentPrice,
      product.title,
      selectedImage || product.image
    );
    router.push("/checkout");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out this product: ${product?.title}`,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("Copy this link", url);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF6F6]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" /></div>;
  if (!product) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF6F6]"><h1 className="text-xl font-bold text-[#2B1A24]">Product not found</h1><Link href="/" className="mt-4 text-[#E8546B] underline">Go back home</Link></div>;

  // one tile per picture — old imports stored the same colour twice.
  // If a product has NO colours but its variants carry pictures, build the tiles
  // from the variants so it is still selectable.
  const variantsList: any[] = Array.isArray(product.variants) ? product.variants : [];
  const colorSource: any[] =
    product.colors && product.colors.length > 0
      ? product.colors
      : variantsList
          .filter((v) => v && v.image)
          .map((v, i) => ({
            id: v.colorId || `option-${i}`,
            label: v.colorId
              ? String(v.colorId).replace(/^color-\d+-/, "").replace(/-/g, " ")
              : `Option ${i + 1}`,
            hex: "#9CA3AF",
            image: v.image,
          }));

  const colorsArray = colorSource
    .map((c: any) => (typeof c === "string" ? { label: c, image: "" } : c))
    .filter((c: any, i: number, arr: any[]) => {
      if (!c?.image) return true;
      return arr.findIndex((x: any) => x?.image === c.image) === i;
    });
  const sizesArray = (product.sizes || []).map((s: any) => typeof s === "string" ? s : (s.label || s));

  const cleanLabel = (text: string) => {
    if (!text) return "";
    const match = text.match(/[a-zA-Z0-9\s-]+/); 
    return match ? match[0].trim() : text.split(/[【\[]/)[0].trim();
  };

  const discountPercent = product.oldPrice && product.oldPrice > currentPrice ? Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100) : 0;
  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const shippingRates = (settings.shippingRates && settings.shippingRates.length > 0) ? settings.shippingRates : DEFAULT_SHIPPING_RATES;

  return (
    <>
      {/* ============================================================
          📱 MOBILE + TABLET VIEW (below 1024px)
          ============================================================ */}
      <div className="lg:hidden min-h-screen bg-white pb-32">
        {/* Mobile Header / Breadcrumb */}
        <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-[#FAD4DD]/50">
          <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6F6] text-[#2B1A24]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="flex-1 font-serif text-[17px] font-bold text-[#E4216F]">PRODUCT DETAILS</h1>
          <button onClick={handleShare} className="relative flex items-center justify-center h-8 w-8 text-[#E4216F]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {copied && <span className="absolute -bottom-6 text-[10px] bg-black text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">Copied!</span>}
          </button>
        </div>

        {/* Image Gallery */}
        <div className="relative w-full aspect-square bg-[#F9F9F9]">
          <img src={imgSrc(selectedImage)} alt={product.title} className="w-full h-full object-contain" />
          {discountPercent > 0 && (
            <span className="absolute top-4 left-4 rounded-full bg-[#E4216F] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>
        {product.gallery && product.gallery.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
            {product.gallery.map((img: string, i: number) => (
              <button key={i} onClick={() => setSelectedImage(img)} className={`h-14 w-14 flex-shrink-0 rounded-lg border-2 overflow-hidden bg-white p-0.5 ${selectedImage === img ? "border-[#E4216F]" : "border-transparent opacity-60"}`}>
                <img src={imgSrc(img)} alt="" className="w-full h-full object-cover rounded-md" />
              </button>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="px-4 py-4">
          <h2 className="text-[16px] font-bold text-[#2B1A24] leading-snug">{product.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-[#FFB800]">⭐ {product.rating || "4.8"}</span>
            <span className="text-[#8A6A75]">({product.reviews || "124"} reviews)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#E4216F]">{formatBDT(currentPrice)}</span>
            {product.oldPrice && product.oldPrice > currentPrice && (
              <span className="text-sm font-medium text-[#B49AA5] line-through">{formatBDT(product.oldPrice)}</span>
            )}
          </div>
        </div>

        <div className="w-full h-2 bg-[#FFF6F6]" />

        {/* Variations & Buttons */}
        <div className="px-4 py-4 space-y-5">
          
          {colorsArray.length > 0 && colorsArray[0].label !== "Default" && (
            <div>
              <p className="text-[13px] font-bold text-[#2B1A24] mb-2">Color: <span className="font-normal text-[#6B5558]">{cleanLabel(selectedColor?.label)}</span></p>
              <div className="grid grid-cols-5 gap-2">
                {colorsArray.map((c: any, idx: number) => {
                  const colorImg = c.image || product.image;
                  const isActive = selectedColor?.label === c.label;
                  return (
                    <button key={idx} onClick={() => handleSelectColor(c)} className={`w-full flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition ${isActive ? "border-[#E4216F] bg-[#FFF0F5]" : "border-gray-200 bg-white"}`} title={cleanLabel(c.label)}>
                      <div className="w-full aspect-square rounded-md overflow-hidden bg-white">
                        {colorImg ? (
                          <img src={imgSrc(colorImg)} alt={c.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ backgroundColor: c.hex || "#E4216F" }} />
                        )}
                      </div>
                      <span className="text-[8px] font-medium text-[#6B5558] truncate w-full text-center px-0.5">{cleanLabel(c.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizesArray.length > 0 && sizesArray[0] !== "One Size" && (
            <div>
               <p className="text-[13px] font-bold text-[#2B1A24] mb-2">Size: <span className="font-normal text-[#6B5558]">{cleanLabel(selectedSize)}</span></p>
               <div className="flex flex-wrap gap-2">
                 {sizesArray.map((s: string) => (
                   <button key={s} onClick={() => setSelectedSize(s)} className={`rounded-lg border px-4 py-1.5 text-[12px] font-bold transition ${selectedSize === s ? "border-[#E4216F] bg-[#E4216F] text-white" : "border-gray-200 bg-white text-[#2B1A24]"}`}>
                     {cleanLabel(s)}
                   </button>
                 ))}
               </div>
            </div>
          )}

          <div>
            <p className="text-[13px] font-bold text-[#2B1A24] mb-2">Quantity</p>
            <div className="flex w-[100px] items-center justify-between rounded-lg border border-gray-200 bg-white">
              <button onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))} className="flex h-8 w-8 items-center justify-center text-[#6B5558] text-sm font-bold">−</button>
              <input type="text" value={quantity} onChange={(e) => { const val = e.target.value; if (val === "" || (!isNaN(Number(val)) && Number(val) >= 1)) setQuantity(val); }} className="w-full bg-transparent text-center text-[12px] font-bold text-[#2B1A24] outline-none" />
              <button onClick={() => setQuantity(Number(quantity) + 1)} className="flex h-8 w-8 items-center justify-center text-[#6B5558] text-sm font-bold">+</button>
            </div>
          </div>

          {/* BUTTONS IN PAGE FLOW */}
          <div className="pt-2 space-y-2">
             <button onClick={handleBuyNow} className="w-full rounded-xl bg-[#E4216F] py-3.5 text-[13px] font-bold text-white shadow-md">Buy It Now</button>
             <button onClick={handleAddToCart} disabled={btnState !== "idle"} className={`w-full rounded-xl border-2 py-3.5 text-[13px] font-bold transition ${btnState === "success" ? "border-green-500 text-green-600 bg-green-50" : "border-[#E4216F] text-[#E4216F] bg-white"}`}>
               {btnState === "idle" ? "Add to Cart" : btnState === "success" ? "Added!" : "Adding..."}
             </button>
             <WhatsAppButton phoneNumber={settings.whatsappChatNumber} productTitle={product.title} productUrl={productUrl} />
          </div>

        </div>

        <div className="w-full h-2 bg-[#FFF6F6]" />

        {/* Shipping Notice */}
        <div className="px-4 py-4">
          <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2B1A24]">✈️ Shipping Information</h3>
              <span className="text-xs text-[#6B5558]">To Bangladesh</span>
            </div>
            <div className="rounded-xl bg-[#FFF6F6] p-4 mb-4">
              <p className="text-center text-sm font-bold text-[#E8546B] mb-2">Shipping Charge Will Be Added Later</p>
              <p className="text-center text-[11px] text-[#6B5558]">After you receive the product, the shipping charge will be calculated and added.</p>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1 text-[11px] text-[#6B5558]">⏱ Est. Delivery: <strong className="text-[#2B1A24]">{settings.estimatedDeliveryDays}</strong></span>
              <span className="rounded-full bg-[#FDE8EC] px-3 py-1 text-[10px] font-bold text-[#E8546B]">By Air</span>
            </div>
            <button onClick={() => setShippingModalOpen(true)} className="w-full rounded-xl bg-[#E8546B] py-2.5 text-xs font-bold text-white hover:bg-[#b02a58]">📋 View Full Shipping Chart →</button>
          </div>
        </div>

        <div className="w-full h-2 bg-[#FFF6F6]" />

        {/* Product Details */}
        <div className="px-4 py-5">
          <h3 className="text-[14px] font-bold text-[#2B1A24] mb-2">Product Details</h3>
          <p className="text-[12px] text-[#6B5558] leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        <div className="w-full h-2 bg-[#FFF6F6]" />

        {/* Specs */}
        <div className="px-4 py-5 mb-10">
          <h3 className="text-[14px] font-bold text-[#2B1A24] mb-2">Specifications</h3>
          {product.specs && product.specs.length > 0 ? (
            <div className="divide-y divide-[#FAD4DD]/50">
              {product.specs.map((spec: any, i: number) => (
                <div key={i} className="flex flex-col py-2.5 text-[12px]">
                  <span className="font-bold text-[#2B1A24] mb-0.5">{spec.name}</span>
                  <span className="text-[#6B5558]">{spec.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#6B5558]">No specifications available.</p>
          )}
        </div>
        
      </div>

      {/* ============================================================
          💻 DESKTOP VIEW (1024px and up)
          ============================================================ */}
      <div className="hidden lg:block min-h-screen bg-[#FFF6F6] pb-20">
        <div className="mx-auto max-w-[1400px] px-4 py-4 text-xs text-[#6B5558] flex items-center gap-2">
          <Link href="/" className="hover:text-[#E8546B]">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-[#E8546B]">Shop</Link>
          <span>/</span>
          <span className="text-[#2B1A24] font-medium truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="mx-auto max-w-[1400px] px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <div className="relative w-full aspect-square max-h-[550px] rounded-2xl bg-white border border-[#FAD4DD] overflow-hidden flex items-center justify-center p-4 mx-auto">
                  <img src={imgSrc(selectedImage)} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" />
                  {discountPercent > 0 && (
                    <span className="absolute top-4 left-4 rounded-full bg-[#E8546B] px-3 py-1 text-xs font-bold text-white">{discountPercent}% OFF</span>
                  )}
                </div>
                {product.gallery && product.gallery.length > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {product.gallery.map((img: string, i: number) => (
                      <button key={i} onClick={() => setSelectedImage(img)} className={`h-16 w-16 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-white p-1 transition ${selectedImage === img ? "border-[#E8546B]" : "border-[#FAD4DD]"}`}>
                        <img src={imgSrc(img)} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-[#2B1A24] leading-tight mb-3">{product.title}</h1>
                <button onClick={handleShare} className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white border border-[#FAD4DD] text-[#E8546B] hover:bg-[#FFF6F6] transition-colors flex-shrink-0 mt-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  {copied && <span className="absolute -bottom-8 text-[10px] bg-black text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">Copied!</span>}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.floor(product.rating ?? 4.5) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-[#2B1A24]">{product.rating}</span>
                <span className="text-sm text-[#6B5558]">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-6 border-b border-[#FAD4DD] pb-6">
                <span className="text-3xl md:text-4xl font-bold text-[#E8546B]">{formatBDT(currentPrice)}</span>
                {product.oldPrice && product.oldPrice > currentPrice && <span className="text-lg text-[#A88F92] line-through">{formatBDT(product.oldPrice)}</span>}
              </div>

              {colorsArray.length > 0 && colorsArray[0].label !== "Default" && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-[#2B1A24] mb-3">Color: <span className="font-normal text-[#6B5558]">{cleanLabel(selectedColor?.label)}</span></p>
                  <div className="flex flex-wrap gap-3">
                    {colorsArray.map((c: any, idx: number) => {
                      const colorImg = c.image || product.image;
                      const isActive = selectedColor?.label === c.label;
                      return (
                        <button key={idx} onClick={() => handleSelectColor(c)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition min-w-[70px] ${isActive ? "border-[#E8546B] bg-[#FFF6F6] shadow-sm" : "border-[#FAD4DD] bg-white hover:border-[#E8546B]"}`} title={cleanLabel(c.label)}>
                          <div className="h-14 w-14 rounded-lg bg-gray-50 overflow-hidden">
                            {colorImg ? <img src={imgSrc(colorImg)} alt={c.label} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundColor: c.hex || "#E8546B" }} />}
                          </div>
                          <span className={`text-[11px] font-medium max-w-[80px] truncate ${isActive ? "text-[#E8546B]" : "text-[#6B5558]"}`}>{cleanLabel(c.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sizesArray.length > 0 && sizesArray[0] !== "One Size" && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-[#2B1A24] mb-3">Size: <span className="font-normal text-[#6B5558]">{cleanLabel(selectedSize)}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {sizesArray.map((s: string) => {
                      const displaySize = cleanLabel(s);
                      if (!displaySize) return null;
                      return (
                        <button key={s} onClick={() => setSelectedSize(s)} className={`rounded-xl border px-4 py-2 min-w-[50px] text-sm font-bold transition ${selectedSize === s ? "border-[#E8546B] bg-[#E8546B] text-white shadow-md" : "border-[#FAD4DD] bg-white text-[#2B1A24] hover:border-[#E8546B]"}`}>
                          {displaySize}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-bold text-[#2B1A24] mb-3">Quantity</p>
                <div className="flex w-[120px] items-center justify-between rounded-full border border-[#FAD4DD] bg-white p-1 shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6F6] text-[#E8546B] transition-colors hover:bg-[#E8546B] hover:text-white disabled:opacity-50" disabled={Number(quantity) <= 1}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <input type="text" value={quantity} onChange={(e) => { const val = e.target.value; if (val === "") { setQuantity(""); return; } const num = Number(val); if (!isNaN(num) && num >= 1 && num <= 99) setQuantity(num); }} onBlur={() => { if (quantity === "" || Number(quantity) < 1) setQuantity(1); }} className="w-full bg-transparent text-center text-sm font-bold text-[#2B1A24] outline-none" />
                  <button onClick={() => setQuantity(Number(quantity) + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6F6] text-[#E8546B] transition-colors hover:bg-[#E8546B] hover:text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <button onClick={handleBuyNow} className="w-full rounded-xl bg-gradient-to-r from-[#E8546B] to-[#FF8B9A] py-4 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(232,84,107,0.6)] transition-all hover:scale-[1.01] hover:shadow-[0_12px_28px_-8px_rgba(232,84,107,0.7)] active:scale-[0.99]">
                  Buy It Now
                </button>

                <button onClick={handleAddToCart} disabled={btnState !== "idle"} className={`relative flex w-full items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-bold transition-all duration-300 overflow-hidden ${btnState === "success" ? "border-green-500 bg-green-50 text-green-600" : "border-[#E8546B] bg-white text-[#E8546B] hover:bg-[#FFF6F6]"}`}>
                  {btnState === "idle" && <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>Add to Cart</>}
                  {btnState === "loading" && <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Adding...</>}
                  {btnState === "success" && <span className="animate-fade-in flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>Added to Cart</span>}
                </button>

                <WhatsAppButton phoneNumber={settings.whatsappChatNumber} productTitle={product.title} productUrl={productUrl} />
              </div>

              <div className="mb-6 rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#2B1A24]">✈️ Shipping Information</h3>
                  <span className="text-xs text-[#6B5558]">To Bangladesh</span>
                </div>
                <div className="rounded-xl bg-[#FFF6F6] p-4 mb-4">
                  <p className="text-center text-lg font-bold text-[#E8546B] mb-2">Shipping Charge Will Be Added Later</p>
                  <p className="text-center text-xs text-[#6B5558]">After you receive the product, the shipping charge will be calculated and added.</p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1 text-sm text-[#6B5558]">⏱ Estimated Delivery: <strong className="text-[#2B1A24]">{settings.estimatedDeliveryDays}</strong></span>
                  <span className="rounded-full bg-[#FDE8EC] px-3 py-1 text-[10px] font-bold text-[#E8546B]">By Air</span>
                </div>
                <button onClick={() => setShippingModalOpen(true)} className="w-full rounded-xl bg-[#E8546B] py-2.5 text-xs font-bold text-white hover:bg-[#b02a58]">📋 View Full Shipping Chart →</button>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#2B1A24] mb-4">Specifications</h2>
            {product.specs && product.specs.length > 0 ? (
              <div className="divide-y divide-[#FAD4DD]">
                {product.specs.map((spec: any, i: number) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3">
                    <span className="text-sm font-medium text-[#6B5558]">{spec.name}</span>
                    <span className="text-sm text-[#2B1A24] md:col-span-2">{spec.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B5558]">No specifications available.</p>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#2B1A24] mb-4">Product Description</h2>
            <div className="prose prose-sm max-w-none text-[#6B5558] leading-relaxed whitespace-pre-line">{product.description}</div>
          </div>
        </div>
      </div>

      {/* SHIPPING MODAL */}
      {shippingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShippingModalOpen(false)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2B1A24]">✈️ Shipping Rate Chart</h2>
              <button onClick={() => setShippingModalOpen(false)} className="text-xl text-[#A88F92] hover:text-[#E8546B]">✕</button>
            </div>
            <p className="text-sm text-[#6B5558] mb-4">Check the shipping rates for different product categories from China to Bangladesh.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FFF6F6] text-[#2B1A24] text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Category</th>
                    <th className="px-4 py-3">Examples</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3 rounded-tr-xl">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAD4DD]">
                  {shippingRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-[#FFF6F6]">
                      <td className="px-4 py-3 font-semibold text-[#2B1A24]">{rate.category}</td>
                      <td className="px-4 py-3 text-[#6B5558]">{rate.examples}</td>
                      <td className="px-4 py-3 font-bold text-[#E8546B]">{rate.rate}</td>
                      <td className="px-4 py-3 text-xs text-[#6B5558]">{rate.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-xl bg-[#FFF6F6] p-4 text-xs text-[#6B5558]">
              <p><strong>Note:</strong> Shipping charges are calculated by weight and volume. Final charges will be confirmed once the product arrives at our warehouse in China.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShippingModalOpen(false)} className="rounded-xl bg-[#E8546B] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#d1475e]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
