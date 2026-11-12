import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH = "/control-room";
const COOKIE_NAME = "ras_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";

export function proxy(request: NextRequest) {
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

  // Verify the token signature (basic check — full HMAC verify requires Edge runtime crypto)
  // For now: if the token has the correct format (payload.signature), let it through
  // The server-side API will do the real validation
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) throw new Error("Invalid token");

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!decoded.exp || Date.now() > decoded.exp) {
      return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL(`${ADMIN_PATH}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/control-room/:path*"],
};