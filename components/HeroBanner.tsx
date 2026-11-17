"use client";

import { useRouter } from "next/navigation";

export default function HeroBanner() {
  const router = useRouter();

  return (
    <section className="relative w-full bg-[#FFF6F6]">
      <img 
        src="/banner.png" 
        alt="Welcome to Ratry's Artistry Shop" 
        className="w-full h-auto object-cover block" 
      />
      
      {/* Slider Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        <div className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
      </div>
    </section>
  );
}