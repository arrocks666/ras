"use client";

import { useWishlist } from "@/lib/WishlistContext";
import { useProducts } from "@/lib/ProductsContext";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const wishlist = useWishlist();
  const { products, loading } = useProducts();

  // Filter all products to only show the ones in the wishlist
  const wishlistProducts = products.filter((p) => wishlist.has(p.id));

  return (
    <div className="min-h-screen bg-[#FFF6F6] py-10 px-4">
      <div className="mx-auto max-w-[1400px]">
        
        <div className="flex items-center gap-2 mb-8">
          <span className="text-3xl">❤️</span>
          <h1 className="font-serif text-3xl font-bold text-[#2B1A24]">My Wishlist</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8546B] border-t-transparent" />
          </div>
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#FAD4DD] shadow-sm">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-bold text-[#2B1A24] mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-[#6B5558] mb-6">Save your favorite items here to buy them later.</p>
            <Link href="/search" className="inline-block rounded-full bg-[#E8546B] px-8 py-3 text-sm font-bold text-white hover:bg-[#b02a58] shadow-orange-glow transition">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}