import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const BRAND = "Ratris Artistry Shop";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "orders@ratrisartistry.com";
const REPLY_TO = process.env.RESEND_REPLY_TO || "ratrisartistry@gmail.com";

/* Simple health check: open /api/send-email in the browser to see what is configured */
export async function GET() {
  return NextResponse.json({
    ok: Boolean(process.env.RESEND_API_KEY),
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
    from: FROM_EMAIL,
    replyTo: REPLY_TO,
    hint: "If hasApiKey is false, add RESEND_API_KEY in Netlify env vars and redeploy.",
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("❌ RESEND_API_KEY is missing");
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    if (!FROM_EMAIL.includes("@") || FROM_EMAIL.includes("yourdomain")) {
      console.error("❌ RESEND_FROM_EMAIL is not a real address:", FROM_EMAIL);
      return NextResponse.json(
        {
          error:
            "RESEND_FROM_EMAIL is invalid. Use an address on your verified domain, e.g. orders@ratrisartistry.com",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { to, subject, html } = body || {};

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: `${BRAND} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [String(to)],
      subject: String(subject),
      html: String(html),
      replyTo: REPLY_TO,
    });

    if (error) {
      console.error("❌ Resend error:", error);

      const msg = String(error.message || "Failed to send email");
      const friendly = msg.toLowerCase().includes("domain")
        ? `Resend rejected ${FROM_EMAIL}. Verify ratrisartistry.com in Resend → Domains, and make sure RESEND_FROM_EMAIL uses that same domain.`
        : msg;

      return NextResponse.json({ error: friendly }, { status: 500 });
    }

    console.log(`✅ Email sent to ${to} (ID: ${data?.id})`);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("❌ Send email API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
