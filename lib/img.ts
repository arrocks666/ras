// lib/img.ts
// Chinese CDNs (alicdn / 1688 / taobao) block hotlinking: the browser sends a
// Referer from our own site, the CDN answers 403 and the picture never shows.
// Every image from those hosts is rewritten to /api/img/<hex>, which re-fetches
// the file server-side with the right Referer and serves it from our own origin.

const PROXIED_HOSTS = [
  "alicdn.com",
  "alicdn.net",
  "1688.com",
  "taobao.com",
  "tmall.com",
  "alibaba.com",
  "aliexpress.com",
  "alicdn.pub",
];

export function isProxiedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PROXIED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

/** UTF-8 URL -> lowercase hex string (0-9a-f only, nothing to mangle) */
function encodeKey(url: string): string {
  const bytes = new TextEncoder().encode(url);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Returns a browser-safe src for any product image.
 * - local paths, data: and blob: URLs are returned untouched
 * - hotlink-protected Chinese hosts are routed through /api/img/<hex>
 * - everything else (imgbb, unsplash, firebase storage...) is returned as-is
 */
export function imgSrc(url?: string | null, fallback = ""): string {
  if (!url) return fallback;
  const raw = String(url).trim();
  if (!raw) return fallback;

  const normalized = raw.startsWith("//") ? "https:" + raw : raw;

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (isProxiedHost(parsed.toString())) {
      return `/api/img/${encodeKey(parsed.toString())}`;
    }
    return parsed.toString();
  } catch {
    return normalized;
  }
}

/** Same helper for lists (gallery / thumbnails). */
export function imgSrcList(urls?: (string | null | undefined)[] | null): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => imgSrc(u)).filter(Boolean);
}

/** True when the URL still points at a hotlink-protected CDN (needs migration to imgbb). */
export function needsImgbbMigration(url?: string | null): boolean {
  if (!url) return false;
  const normalized = url.startsWith("//") ? "https:" + url : url;
  if (!/^https?:/i.test(normalized)) return false;
  return isProxiedHost(normalized);
}
