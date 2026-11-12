"use client";

import Link from "next/link";
import { formatBDT } from "@/lib/data";
import { Product } from "@/lib/ProductsContext";

export default function ProductCard({ product }: { product: Product }) {
  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#FAD4DD] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      
      <div className="relative aspect-square w-full overflow-hidden bg-[#FFF6F6]">
        <img 
          src={product.image} 
          alt={product.title} 
          className="h-full w-full object-contain mix-blend-multiply p-2 transition-transform duration-500 group-hover:scale-110" 
        />
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-[#E8546B] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 md:p-4">
        <h3 className="line-clamp-2 text-[13px] md:text-sm font-bold text-[#2B1A24] leading-snug group-hover:text-[#E8546B]">
          {product.title}
        </h3>
        
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-[15px] md:text-base font-bold text-[#E8546B]">
            {formatBDT(product.price)}
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-[11px] md:text-xs font-medium text-[#A88F92] line-through">
              {formatBDT(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}