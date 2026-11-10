"use client";

import Link from "next/link";

const CATEGORIES = [
  { id: "womens-fashion", name: "Fashion & Accessories", icon: "👗" },
  { id: "beauty-skincare", name: "Beauty & Skincare", icon: "💄" },
  { id: "home-kitchen", name: "Home & Living", icon: "🏠" },
  { id: "gadgets-electronics", name: "Gadgets & Electronics", icon: "📱" },
];

export default function CategoryStrip() {
  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#2B1A24]">Shop by Category</h2>
          <Link href="/categories" className="text-sm font-semibold text-[#E8546B] hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#FDE8EC] p-6 aspect-square hover:shadow-lg transition-all duration-300"
            >
              <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-xs md:text-sm font-bold text-[#2B1A24] text-center mb-1">
                {cat.name}
              </h3>
              <p className="text-[10px] md:text-xs text-[#E8546B] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Explore Now →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}