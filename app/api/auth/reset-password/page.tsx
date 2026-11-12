import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("❌ Firebase Admin init error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const { phone, newPassword } = await req.json();

    if (!phone || !newPassword) {
      return NextResponse.json({ error: "Phone and new password required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalized = phone.replace(/\D/g, "");
    const email = `${normalized}@ratrysartistry.app`;

    // 1. Look up the user by email
    const user = await admin.auth().getUserByEmail(email);

    // 2. Update the password
    await admin.auth().updateUser(user.uid, { password: newPassword });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (err: any) {
    console.error("❌ Reset error:", err.code, err.message);
    
    if (err.code === "auth/user-not-found") {
      return NextResponse.json({ error: "No account found with this phone number" }, { status: 404 });
    }
    
    return NextResponse.json({ error: err.message || "Failed to reset password" }, { status: 500 });
  }
}