import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html, replyTo } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ⚠️ IMPORTANT: You MUST use a verified domain with Resend.
    // If you are testing, use "onboarding@resend.dev" as the from address.
    // For production, use "orders@yourdomain.com".
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const data = await resend.emails.send({
      from: `Ratry's Artistry Shop <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: html,
      reply_to: replyTo || fromAddress,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}