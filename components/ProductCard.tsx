"use client";

import Link from "next/link";
import { formatBDT } from "@/lib/data";
import { Product } from "@/lib/ProductsContext";
import { useCart } from "@/lib/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    cart.add(product.id, "Default", "One Size", 1);
  };

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col bg-white rounded-2xl border border-[#FAD4DD] overflow-hidden shadow-sm">
      
      <div className="relative w-full aspect-square bg-[#F9F9F9]">
        <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply p-2" />
        
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-[#E8546B] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-col p-3">
        <h3 className="line-clamp-2 text-[12px] font-semibold text-[#2B1A24] leading-snug">
          {product.title}
        </h3>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#FFB800] text-[10px]">⭐</span>
          <span className="text-[10px] font-bold text-[#6B5558]">{product.rating || "4.8"} ({product.reviews || "12"})</span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[16px] font-bold text-[#E8546B] leading-none">
              {formatBDT(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-[10px] font-medium text-[#A88F92] line-through mt-1">
                {formatBDT(product.oldPrice)}
              </span>
            )}
          </div>
          <button onClick={handleAddToCart} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE8EC] text-[#E8546B] active:scale-90 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          </button>
        </div>
      </div>
    </Link>
  );
}