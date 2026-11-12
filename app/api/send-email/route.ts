import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || "orderchinadailybazar@gmail.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields: to, subject, html" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not set in .env.local");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: `Ratry's Artistry Shop <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      replyTo: REPLY_TO_EMAIL,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Email sent to ${to} (ID: ${data?.id})`);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("❌ Send email API error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}