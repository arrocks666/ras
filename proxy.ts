import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH = "/control-room";
const COOKIE_NAME = "ras_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";

export const config = {
  matcher: ["/control-room/:path*"],
};

function b64urlToArrayBuffer(value: string): ArrayBuffer {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const buffer = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return buffer;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PATH)) return NextResponse.next();
  if (pathname === `${ADMIN_PATH}/login`) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
  }

  try {
    const [payloadB64, signatureB64] = token.split(".");
    if (!payloadB64 || !signatureB64) throw new Error("Invalid token format");

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToArrayBuffer(signatureB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!isValid) throw new Error("Invalid signature");

    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToArrayBuffer(payloadB64))
    );
    if (!payload.exp || Date.now() > payload.exp) throw new Error("Session expired");

    return NextResponse.next();
  } catch (err) {
    console.error("Auth check failed:", err);
    const res = NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}
