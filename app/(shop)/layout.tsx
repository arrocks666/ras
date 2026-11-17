export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFF6F6] flex flex-col">
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
    </div>
  );
}
