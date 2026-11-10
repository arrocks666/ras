"use client";

import { useRouter } from "next/navigation";

export default function HeroBanner() {
  const router = useRouter();

  return (
    <section className="relative w-full bg-[#FFF6F6]">
      {/* Full Width Banner Image */}
      <img 
        src="/banner.png" 
        alt="Welcome to Ratry's Artistry Shop" 
        className="w-full h-auto block"
      />
      
      {/* Invisible clickable button over "Shop Now" (adjust positions if needed) */}
      <button
        onClick={() => router.push("/search")}
        className="absolute left-[6%] top-[70%] w-[120px] md:w-[150px] h-[40px] md:h-[50px] bg-transparent cursor-pointer rounded-full"
        aria-label="Shop Now"
      />
    </section>
  );
}