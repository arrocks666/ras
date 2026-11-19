// GET /api/img/<hex of the original URL>
// The picture lives in the PATH, so every product has a physically different
// URL — no cache can ever hand one product's photo to another.
// Base64url keys from the first version are still accepted.

import { proxyImage, decodeImgKey } from "@/lib/imgProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeAny(key: string): string | null {
  const fromHex = decodeImgKey(key);
  if (fromHex) return fromHex;

  try {
    const b64 = key.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const text = Buffer.from(padded, "base64").toString("utf8");
    return /^https?:\/\//i.test(text) ? text : null;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const { key } = await ctx.params;
  const joined = (key || []).join("/");

  if (joined === "test") {
    return new Response("image proxy alive ✔", { status: 200 });
  }

  const raw = decodeAny(joined);
  if (!raw) {
    console.error("[api/img] could not decode key:", joined.slice(0, 120));
    return new Response(`Could not decode key (${joined.length} chars)`, { status: 400 });
  }

  return proxyImage(raw);
}
