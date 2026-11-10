// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "ras_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin-panel")) return NextResponse.next();
  if (pathname === "/admin-panel/login") return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin-panel/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-panel/:path*"],
};