"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { formatBDT } from "@/lib/data";
import { imgSrc } from "@/lib/img";
import type { Product } from "@/lib/ProductsContext";

export default function MobileProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [src, setSrc] = useState(() => imgSrc(product.image));

  const saved = wishlist.has(product.id);
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? 0;
  const discount =
    oldPrice > price && oldPrice > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.add(product.id, "Default", "One Size", 1);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(product.id);
  };

  const handleImgError = () => {
    if (product.image && src !== product.image) {
      setSrc(product.image);
      return;
    }
    setStatus("error");
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_-10px_rgba(228,33,111,0.45)] transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-[1/0.94] w-full overflow-hidden bg-[#F7F1F4]">
        {/* placeholder while the picture downloads */}
        {status === "loading" && <div className="skeleton-shimmer absolute inset-0" />}

        {product.image && status !== "error" ? (
          <img
            src={src}
            alt={product.title}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setStatus("loaded")}
            onError={handleImgError}
          />
        ) : (
          status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#FFF0F5] to-[#FDE4EC]">
              <span className="text-2xl opacity-60">🖼️</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#C9A3B3]">No photo</span>
            </div>
          )
        )}

        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#F4558F] to-[#E4216F] px-2 py-[3px] text-[10px] font-bold leading-none text-white shadow-sm">
            -{discount}%
          </span>
        )}

        <button
          onClick={toggleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "#E4216F" : "none"} stroke="#E4216F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {product.inStock === false && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[#2B1A24]/70 px-2 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-3 text-[12px] font-semibold leading-[1.35] text-[#2B1A24]">
          {product.title}
        </h3>

        {product.rating ? (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] leading-none">⭐</span>
            <span className="text-[10px] font-semibold leading-none text-[#8A6A75]">
              {product.rating}
              {product.reviews ? ` (${product.reviews})` : ""}
            </span>
          </div>
        ) : (
          <div className="mt-1.5 text-[10px] font-semibold leading-none text-[#B98BA0]">New arrival</div>
        )}

        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-[15px] font-extrabold leading-none text-[#E4216F]">
              {formatBDT(price)}
            </span>
            {oldPrice > price && (
              <span className="mt-1 text-[10px] font-medium leading-none text-[#B49AA5] line-through">
                {formatBDT(oldPrice)}
              </span>
            )}
          </div>

          <button
            onClick={addToCart}
            aria-label={`Add ${product.title} to cart`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF0F5] text-[#E4216F] ring-1 ring-[#F9D5E2] transition-transform active:scale-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2.5h2.2l2.4 11.9a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4l1.6-7.4H6" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
