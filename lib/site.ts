// lib/site.ts
// One place for every contact detail shown on the storefront.

export const WHATSAPP_NUMBER = "880179123735";
export const WHATSAPP_DISPLAY = "+880 179 123 735";
export const SUPPORT_EMAIL = "support@ratrisartistry.com";

export function waLink(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(): string {
  return `tel:+${WHATSAPP_NUMBER.replace(/\D/g, "")}`;
}
