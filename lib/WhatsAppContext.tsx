// lib/WhatsAppContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";

type WhatsAppContextType = {
  openChat: () => void;
};

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const openChat = () => {
    window.open("https://wa.me/8801700000000", "_blank"); // Change this number later
  };

  return (
    <WhatsAppContext.Provider value={{ openChat }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  const ctx = useContext(WhatsAppContext);
  if (!ctx) throw new Error("useWhatsApp must be used within WhatsAppProvider");
  return ctx;
}