import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "ras_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

// Get secret from env (fallback for local testing)
const SECRET = process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Generate a signed session token
function createSessionToken() {
  const payload = JSON.stringify({
    user: ADMIN_USERNAME,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  });

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // Check credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Create signed cookie
    const token = createSessionToken();

    // Set the cookie in the response
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}