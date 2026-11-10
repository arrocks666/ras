"use client";

import { useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/WishlistContext";
import { useCart } from "@/lib/CartContext"; // 👈 Imported Cart
import { formatBDT } from "@/lib/data";
import type { Product } from "@/lib/ProductsContext";

export default function ProductCard({ product }: { product: Product }) {
  const wishlist = useWishlist();
  const cart = useCart(); // 👈 Initialize Cart
  const inWishlist = wishlist.has(product.id);
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = product.image && !imgFailed;
  const discountPercent = product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // 👈 Function to handle adding to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Stops the link from opening the product page
    e.stopPropagation();
    
    cart.addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    
    // Optional: You can add a toast notification here later
    alert(`${product.title} added to cart!`); 
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Wishlist Heart */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlist.toggle(product.id); }}
        className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-sm ${inWishlist ? "bg-[#E8546B] text-white" : "bg-white/80 text-gray-400 hover:bg-[#E8546B] hover:text-white backdrop-blur-sm"}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <Link href={`/product/${product.id}`} className="block flex-1">
        {/* Image */}
        <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-[#FDE8EC] m-2 rounded-xl">
          {showImage ? (
            <img src={product.image} alt="" className="h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-110" onError={() => setImgFailed(true)} />
          ) : (
            <span className="text-5xl opacity-50">🎁</span>
          )}
          {discountPercent > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-[#E8546B] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">-{discountPercent}%</span>
          )}
        </div>

        {/* Info */}
        <div className="px-3 pb-3 pt-1">
          <h3 className="text-xs md:text-sm font-semibold leading-snug text-[#2B1A24] line-clamp-2 min-h-[36px]">{product.title}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] md:text-xs">
            <div className="flex text-[#FFB800]">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < Math.floor(product.rating ?? 4.5) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[#6B5558] font-medium">{(product.rating ?? 4.5).toFixed(1)}</span>
            <span className="text-[#A88F92]">({product.reviews ?? 0})</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base md:text-lg font-bold text-[#E8546B]">{formatBDT(product.price)}</span>
            {product.oldPrice > product.price && (
              <span className="text-xs text-[#A88F92] line-through">{formatBDT(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* 👈 ADD TO CART BUTTON */}
      <div className="px-3 pb-3 mt-auto">
        <button
          onClick={handleAddToCart}
          className="w-full rounded-xl bg-[#E8546B] py-2 text-xs font-bold text-white transition-colors hover:bg-[#c9465a] shadow-orange-glow"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}