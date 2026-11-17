import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH = "/control-room";
const COOKIE_NAME = "ras_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";

export const config = {
  matcher: ["/control-room/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard the admin routes
  if (!pathname.startsWith(ADMIN_PATH)) {
    return NextResponse.next();
  }

  // Allow the login page itself
  if (pathname === `${ADMIN_PATH}/login`) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
  }

  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) throw new Error("Invalid token format");

    // ✅ FIX: Verify the HMAC signature using Edge-compatible Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(payloadB64)
    );

    if (!isValid) throw new Error("Invalid signature");

    // Decode payload to check expiry
    const payload = JSON.parse(atob(payloadB64));
    if (!payload.exp || Date.now() > payload.exp) {
      return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
  }

  return NextResponse.next();
}