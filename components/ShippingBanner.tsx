"use client";

import Link from "next/link";

export default function ShippingBanner() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FDE8EC] to-[#FFF6F6] px-6 py-8 md:px-12 md:py-12 border border-[#FAD4DD] shadow-sm flex flex-col md:flex-row items-center justify-between">
        
        {/* Decorative Plane Background (CSS) */}
        <div className="absolute top-4 right-1/4 opacity-30 text-4xl hidden md:block">
           ✈️
        </div>

        <div className="relative z-10 md:w-1/2 text-center md:text-left mb-6 md:mb-0">
          <p className="font-serif italic text-[#E8546B] text-lg md:text-xl mb-1">From China to Bangladesh</p>
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-[#2B1A24] mb-3">Bringing You the Latest Trends</h2>
          <p className="text-xs md:text-sm text-[#6B5558] max-w-md mx-auto md:mx-0 mb-5">
            We source the best products from trusted Chinese suppliers and deliver them directly to your doorstep in Bangladesh.
          </p>
          <Link 
            href="/about"
            className="inline-block rounded-full bg-[#E8546B] px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-[#b02a58] transition"
          >
            Learn More →
          </Link>
        </div>

        {/* Decorative Box Image */}
        <div className="relative z-10 md:w-1/2 flex justify-center md:justify-end">
          {/* 
            Save the gift box image from your mockup as 'box.png' 
            and put it in the public folder. 
          */}
          <img 
            src="/box.png" 
            alt="Gift Box" 
            className="w-40 md:w-64 object-contain drop-shadow-2xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/200x200/FFF6F6/E8546B?text=Add+box.png";
            }}
          />
        </div>
      </div>
    </section>
  );
}