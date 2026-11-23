// lib/sendEmail.ts
import { formatBDT } from "./data";
import { Order, STATUS_LABELS, OrderStatus } from "./OrderContext";

const BRAND_NAME = "Ratri's Artistry Shop";
const BRAND_MARK = "Ratri&rsquo;s Artistry";
const BRAND_TAGLINE = "Trendy products · Direct from China";
const SITE_URL = "https://ratrisartistry.com";

const C = {
  ink: "#2B1A24",
  body: "#6B5558",
  muted: "#A88F92",
  rose: "#E8546B",
  roseDeep: "#C21C5E",
  blush: "#FFF6F6",
  blush2: "#FFEFF3",
  line: "#FAD4DD",
  white: "#FFFFFF",
  gold: "#E9C9A6",
  green: "#2E7D32",
};

function absoluteImage(src?: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

function emailWrapper(title: string, content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en" style="color-scheme:light only;">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${title}</title>
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body { margin:0; padding:0; background-color:${C.blush}; }
  img { border:0; outline:none; text-decoration:none; display:block; }
  a { text-decoration:none; }
  @media (max-width:600px) {
    .container { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:23px !important; }
    .brand { font-size:23px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.blush};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader || title}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.blush}" style="background-color:${C.blush};">
  <tr>
    <td align="center" style="padding:28px 12px;">

      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <!-- pink header band -->
        <tr>
          <td bgcolor="${C.rose}" style="background-color:${C.rose};border-radius:20px 20px 0 0;padding:30px 30px 26px;text-align:center;">
            <div class="brand" style="font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.25;color:#FFFFFF;font-weight:bold;letter-spacing:.3px;">
              ${BRAND_MARK}
            </div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;line-height:1.6;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.82);padding-top:10px;">
              ${BRAND_TAGLINE}
            </div>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td bgcolor="${C.white}" class="px" style="background-color:${C.white};border-left:1px solid ${C.line};border-right:1px solid ${C.line};padding:34px 34px 30px;">
            ${content}
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td bgcolor="${C.blush2}" style="background-color:${C.blush2};border:1px solid ${C.line};border-top:0;border-radius:0 0 20px 20px;padding:24px 30px 26px;text-align:center;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${C.body};">
              Questions? Reply to this email or message us on WhatsApp.
            </p>
            <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:${C.muted};">
              &copy; ${new Date().getFullYear()} ${BRAND_NAME} · Made with &hearts; for Bangladesh
            </p>
            <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.5px;">
              <a href="${SITE_URL}" style="color:${C.rose};">ratrisartistry.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 class="h1" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:${C.ink};font-weight:bold;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.75;color:${C.body};">${text}</p>`;
}

function box(inner: string, bg = C.blush, border = C.line): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bg}" style="background-color:${bg};border:1px solid ${border};border-radius:16px;">
    <tr><td style="padding:22px;">${inner}</td></tr>
  </table>`;
}

function label(text: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-weight:bold;">${text}</div>`;
}

function amountRow(l: string, v: string, strong = false, color = C.ink): string {
  return `<tr>
    <td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:${strong ? "15px" : "13.5px"};color:${strong ? C.ink : C.body};font-weight:${strong ? "bold" : "normal"};">${l}</td>
    <td align="right" style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:${strong ? "16px" : "13.5px"};color:${color};font-weight:${strong ? "bold" : "600"};">${v}</td>
  </tr>`;
}

function divider(space = 24): string {
  return `<div style="height:${space}px;line-height:${space}px;font-size:0;">&nbsp;</div>`;
}

async function sendEmailViaAPI(to: string, subject: string, html: string) {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Send email failed:", data.error);
      return { success: false, error: data.error };
    }

    return await res.json();
  } catch (err) {
    console.error("❌ Failed to call email API:", err);
    return { success: false };
  }
}

/* ============================================================
   1. ORDER CONFIRMATION
   ============================================================ */
export async function sendOrderEmail(order: Order) {
  if (!order.address?.email) {
    console.warn("No email in order, skipping confirmation email");
    return { success: false, error: "No email" };
  }

  const itemsHtml = order.items
    .map((item) => {
      const img = absoluteImage(item.image);
      const cell = img
        ? `<img src="${img}" width="62" height="62" alt="" style="width:62px;height:62px;border-radius:12px;border:1px solid ${C.line};background-color:${C.white};object-fit:contain;" />`
        : `<div style="width:62px;height:62px;border-radius:12px;border:1px solid ${C.line};background-color:${C.blush};text-align:center;line-height:62px;font-size:22px;">🎁</div>`;

      return `<tr>
        <td width="78" valign="middle" style="padding:12px 0;border-bottom:1px solid ${C.line};">${cell}</td>
        <td valign="middle" style="padding:12px 8px;border-bottom:1px solid ${C.line};">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:bold;color:${C.ink};line-height:1.5;">${item.title || "Product"}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:${C.muted};padding-top:3px;">Qty ${item.quantity}${item.variant ? ` · ${item.variant}` : ""}</div>
        </td>
        <td align="right" valign="middle" style="padding:12px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:bold;color:${C.rose};">${formatBDT(item.price * item.quantity)}</td>
      </tr>`;
    })
    .join("");

  const hasServices = !!order.selectedServices && order.selectedServices.length > 0;
  const servicesTotal = hasServices ? order.selectedServices!.reduce((s, x) => s + x.price, 0) : 0;

  const servicesRows = hasServices
    ? order.selectedServices!
        .map(
          (s) => `<tr>
            <td style="padding:8px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.body};">${s.name}</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${C.ink};">${formatBDT(s.price)}</td>
          </tr>`
        )
        .join("")
    : "";

  const content = `
    ${heading("Order Confirmed")}
    ${paragraph(`Hello <strong style="color:${C.ink};">${order.address.name || "Customer"}</strong>, thank you for your order — we have received it and will start processing right away.`)}

    ${box(`
      <div align="center">
        ${label("Your order number")}
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;font-weight:bold;color:${C.rose};padding-top:8px;line-height:1.2;">#${order.id}</div>
        <div style="padding-top:12px;">
          <span style="display:inline-block;background-color:${C.blush2};color:${C.roseDeep};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.6px;padding:7px 16px;border-radius:999px;border:1px solid ${C.line};">
            ${STATUS_LABELS["placed"] || "Order placed"}
          </span>
        </div>
      </div>
    `, C.blush, C.line)}

    ${divider(26)}

    <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:bold;color:${C.ink};padding-bottom:4px;">Order summary</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemsHtml}${servicesRows}</table>

    ${divider(18)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${amountRow("Subtotal", formatBDT(order.subtotal))}
      ${servicesTotal > 0 ? amountRow("Services", formatBDT(servicesTotal)) : ""}
      ${amountRow("Shipping", order.shipping > 0 ? formatBDT(order.shipping) : "To be confirmed")}
      <tr><td colspan="2" style="border-top:1px solid ${C.line};font-size:0;line-height:0;padding-top:10px;">&nbsp;</td></tr>
      ${amountRow("Total", formatBDT(order.total), true, C.rose)}
    </table>

    ${divider(24)}

    ${box(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};font-weight:bold;padding-bottom:5px;">Payment</td>
          <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ink};font-weight:bold;">${order.paymentMethod}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};font-weight:bold;padding-top:12px;">Delivery</td>
          <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ink};padding-top:12px;line-height:1.6;">${order.address.address}, ${order.address.district}</td>
        </tr>
      </table>
    `, C.blush, C.line)}

    ${divider(22)}

    ${paragraph("You can follow every step of your order from your account page. We will email you again as soon as the status changes.")}
  `;

  return sendEmailViaAPI(
    order.address.email,
    `Order Confirmed: #${order.id}`,
    emailWrapper("Order Confirmed", content, `Order #${order.id} confirmed — ${formatBDT(order.total)}`)
  );
}

/* ============================================================
   2. STATUS UPDATE
   ============================================================ */
export async function sendStatusUpdateEmail(order: Order, newStatus: OrderStatus) {
  if (!order.address?.email) return { success: false, error: "No email" };

  const statusLabel = STATUS_LABELS[newStatus] || "Updated";
  const note = order.statusNotes?.[newStatus];

  const content = `
    ${heading(statusLabel)}
    ${paragraph(`Hello <strong style="color:${C.ink};">${order.address.name || "Customer"}</strong>, your order status has been updated.`)}

    ${box(`
      <div align="center">
        ${label(`Order #${order.id}`)}
        <div style="padding-top:14px;">
          <span style="display:inline-block;background-color:${C.rose};color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:.5px;padding:12px 28px;border-radius:999px;">${statusLabel}</span>
        </div>
        ${note ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.75;color:${C.body};padding-top:18px;font-style:italic;">&ldquo;${note}&rdquo;</div>` : ""}
      </div>
    `)}

    ${divider(24)}

    ${paragraph("You can see the full timeline anytime from your orders page.")}
  `;

  return sendEmailViaAPI(
    order.address.email,
    `Order Update: #${order.id} — ${statusLabel}`,
    emailWrapper(statusLabel, content, `Order #${order.id}: ${statusLabel}`)
  );
}

/* ============================================================
   3. PAYMENT RECEIVED
   ============================================================ */
export async function sendPaymentEmail(order: Order, amountAdded: number) {
  if (!order.address?.email) return { success: false, error: "No email" };

  const content = `
    ${heading("Payment Received")}
    ${paragraph(`Hello <strong style="color:${C.ink};">${order.address.name || "Customer"}</strong>, we have received your payment. Thank you!`)}

    ${box(`
      <div align="center">
        ${label("Amount received")}
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:33px;font-weight:bold;color:${C.rose};padding-top:8px;line-height:1.2;">${formatBDT(amountAdded)}</div>
      </div>
    `, C.blush2, C.line)}

    ${divider(22)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${amountRow("Order", `#${order.id}`)}
      ${amountRow("Total paid", formatBDT(order.paidAmount || 0), false, C.green)}
      ${amountRow("Remaining due", formatBDT(order.dueAmount || 0), false, order.dueAmount ? C.rose : C.green)}
    </table>
  `;

  return sendEmailViaAPI(
    order.address.email,
    `Payment Received for Order #${order.id}`,
    emailWrapper("Payment Received", content, `${formatBDT(amountAdded)} received for order #${order.id}`)
  );
}
