// lib/imgbb.ts
// Downloads an image from a Chinese CDN and re-hosts it on ImgBB.

const ALLOWED_SOURCE_HOSTS = [
  "alicdn.com",
  "alicdn.net",
  "alicdn.pub",
  "1688.com",
  "taobao.com",
  "tmall.com",
  "alibaba.com",
  "aliexpress.com",
];

export const IMG_MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;

export function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_SOURCE_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

export async function uploadRemoteImageToImgbb(sourceUrl: string): Promise<string> {
  if (!isAllowedImageUrl(sourceUrl)) throw new Error("Image host not allowed");

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY is not set");

  const target = new URL(sourceUrl);
  if (target.protocol === "http:") target.protocol = "https:";

  const upstream = await fetch(target.toString(), {
    headers: {
      Referer: "https://detail.1688.com/",
      Origin: "https://detail.1688.com",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!upstream.ok) throw new Error(`Source returned ${upstream.status}`);

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error("Source is not an image");

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("Empty image");
  if (buffer.byteLength > IMG_MAX_BYTES) throw new Error("Image is larger than 8 MB");

  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const blob = new Blob([buffer], { type: contentType });

  const form = new FormData();
  form.append("image", blob, `product.${ext}`);

  const upload = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await upload.json().catch(() => null);
  if (!data?.success) throw new Error(data?.error?.message || "ImgBB upload failed");

  return data.data.display_url || data.data.url;
}
