import MobileBottomNav from "@/components/MobileBottomNav";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFF6F6] flex flex-col">
      {/* 
        The padding-bottom (pb-20) ensures the mobile bottom nav 
        doesn't cover the last items on the page. 
        It is removed on desktop (md:pb-0).
      */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile App Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}