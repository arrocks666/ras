"use client";

import { useRouter } from "next/navigation";

export default function HeroBanner() {
  const router = useRouter();

  return (
    <section className="relative w-full bg-[#FFF6F6]">
      {/* 
        The image will scale to fit the width of the screen. 
        Using `h-auto` prevents it from squishing. 
      */}
      <img 
        src="/banner.png" 
        alt="Welcome to Ratry's Artistry Shop" 
        className="w-full h-auto block object-cover"
      />

      {/* 
        Invisible clickable button over "Shop Now" 
        Adjusted percentages so it works on mobile and desktop 
      */}
      <button
        onClick={() => router.push("/search")}
        className="absolute left-[8%] bottom-[15%] w-[120px] md:w-[150px] h-[40px] md:h-[50px] bg-transparent cursor-pointer rounded-full"
        aria-label="Shop Now"
      />
    </section>
  );
}