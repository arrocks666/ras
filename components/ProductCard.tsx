"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/data";
import { imgSrc } from "@/lib/img";
import { Product } from "@/lib/ProductsContext";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";

export default function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [src, setSrc] = useState(() => imgSrc(product.image));

  const saved = wishlist.has(product.id);
  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.add(
      product.id,
      "Default",
      "One Size",
      1,
      undefined,
      product.price,
      product.title,
      product.image
    );
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(product.id);
  };

  const handleImgError = () => {
    // proxy failed? try the original file once before giving up
    if (product.image && src !== product.image) {
      setSrc(product.image);
      return;
    }
    setStatus("error");
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#F9F9F9]">
        {status === "loading" && <div className="skeleton-shimmer absolute inset-0" />}

        {product.image && status !== "error" ? (
          <img
            src={src}
            alt={product.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-contain p-2 mix-blend-multiply transition-opacity duration-500 group-hover:scale-110 ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setStatus("loaded")}
            onError={handleImgError}
          />
        ) : (
          status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#FFF6F6] to-[#FDE8EC]">
              <span className="text-3xl opacity-50">🖼️</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#C4A2B1]">No photo</span>
            </div>
          )
        )}

        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[#E8546B] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}

        <button
          onClick={toggleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "#E8546B" : "none"} stroke="#E8546B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#2B1A24] transition-colors group-hover:text-[#E8546B]">
          {product.title}
        </h3>

        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] text-[#FFB800]">⭐</span>
          <span className="text-[10px] font-bold text-[#6B5558]">
            {product.rating || "4.8"} ({product.reviews || "12"})
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[16px] font-bold leading-none text-[#E8546B]">
              {formatBDT(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="mt-1 text-[10px] font-medium text-[#A88F92] line-through">
                {formatBDT(product.oldPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to cart`}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FDE8EC] text-[#E8546B] transition-transform active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
