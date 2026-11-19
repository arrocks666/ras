// lib/imgProxy.ts
// Server-side half of the 1688 image proxy: validate the host, download the
// file the way 1688 expects it, and return it with a long cache header.
//
// The key in the URL is plain HEX (only 0-9a-f), so no path normalisation,
// no +/-, no %-encoding and no padding can ever corrupt it.

const ALLOWED_HOSTS = [
  "alicdn.com",
  "alicdn.net",
  "alicdn.pub",
  "1688.com",
  "taobao.com",
  "tmall.com",
  "alibaba.com",
  "aliexpress.com",
];

const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 15000;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** hex -> original URL */
export function decodeImgKey(key: string): string | null {
  try {
    const hex = key.trim().toLowerCase();
    if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isAllowed(target: URL): boolean {
  const host = target.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

/** Sniff the real image type from the first bytes. */
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "image/avif";
  }
  return null;
}

async function download(target: string, withReferer: boolean): Promise<Response | null> {
  const headers: Record<string, string> = {
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "User-Agent": UA,
  };
  if (withReferer) {
    headers.Referer = "https://detail.1688.com/";
    headers.Origin = "https://detail.1688.com";
  }

  try {
    const res = await fetch(target, {
      headers,
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function proxyImage(raw: string): Promise<Response> {
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response(`Invalid url: ${raw.slice(0, 80)}`, { status: 400 });
  }

  if (target.protocol === "http:") target.protocol = "https:";
  if (target.protocol !== "https:" || !isAllowed(target)) {
    return new Response(`Host not allowed: ${target.hostname}`, { status: 403 });
  }

  // 1688 CDN answers only with a 1688 Referer — then plain, then public proxy.
  let upstream =
    (await download(target.toString(), true)) || (await download(target.toString(), false));

  if (!upstream) {
    const bare = target.toString().replace(/^https?:\/\//, "");
    upstream = await download(
      `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&output=jpg`,
      false
    );
  }

  if (!upstream) return new Response(`Upstream unavailable: ${target.toString()}`, { status: 502 });

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0) return new Response("Empty image", { status: 502 });
  if (buffer.byteLength > MAX_BYTES) return new Response("Image too large", { status: 413 });

  const bytes = new Uint8Array(buffer);
  const contentType = sniffImageType(bytes) || upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return new Response("Upstream is not an image", { status: 415 });
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control":
        "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, stale-while-revalidate=604800",
      "Netlify-CDN-Cache-Control":
        "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, durable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
