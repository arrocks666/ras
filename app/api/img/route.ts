// app/api/img/route.ts
// Public image proxy for Chinese product pictures (1688 / alicdn / taobao).
// Those CDNs refuse requests whose Referer is not 1688, so a browser can never
// load the file directly. We fetch it server-side, validate it, and stream the
// bytes back from our own origin with a long cache header.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      cache: "force-cache",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u");
  if (!raw) return new Response("Missing ?u=", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol === "http:") target.protocol = "https:";
  if (target.protocol !== "https:" || !isAllowed(target)) {
    return new Response("Host not allowed", { status: 403 });
  }

  // 1688 CDN answers only with a 1688 Referer — then plain, then a public proxy.
  let upstream =
    (await download(target.toString(), true)) || (await download(target.toString(), false));

  if (!upstream) {
    const bare = target.toString().replace(/^https?:\/\//, "");
    upstream = await download(
      `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&output=jpg`,
      false
    );
  }

  if (!upstream) return new Response("Upstream unavailable", { status: 502 });

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
      "X-Content-Type-Options": "nosniff",
    },
  });
}
