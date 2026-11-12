// lib/sendEmail.ts
import { formatBDT } from "./data";
import { Order, STATUS_LABELS, OrderStatus } from "./OrderContext";

// Beautiful branded email wrapper
function emailWrapper(title: string, content: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF6F6; padding: 20px; border-radius: 12px;">
      <div style="text-align: center; padding-bottom: 24px;">
        <h1 style="color: #E8546B; margin: 0; font-size: 28px; font-family: Georgia, serif;">Ratry's Artistry Shop</h1>
        <p style="color: #6B5558; font-size: 12px; margin-top: 6px; letter-spacing: 0.1em; text-transform: uppercase;">Trendy Products · Direct from China</p>
      </div>
      <div style="background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #E8546B;">
        <h2 style="color: #2B1A24; margin-top: 0; font-size: 22px;">${title}</h2>
        ${content}
      </div>
      <div style="text-align: center; margin-top: 24px; color: #A88F92; font-size: 11px;">
        <p>If you have any questions, reply to this email or contact us on WhatsApp.</p>
        <p>© ${new Date().getFullYear()} Ratry's Artistry Shop. All rights reserved.</p>
      </div>
    </div>
  `;
}

// Helper to call our secure API route
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

// 1. ORDER CONFIRMATION EMAIL
export async function sendOrderEmail(order: Order) {
  if (!order.address?.email) {
    console.warn("No email in order, skipping confirmation email");
    return { success: false, error: "No email" };
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #FAD4DD;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="" style="width: 56px; height: 56px; object-fit: contain; border-radius: 8px; border: 1px solid #FAD4DD; background: #FFF6F6; padding: 4px;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: 700; color: #2B1A24; font-size: 14px;">${item.title || 'Product'}</p>
            <p style="margin: 4px 0 0 0; color: #6B5558; font-size: 12px;">Qty: ${item.quantity}${item.variant ? ` | ${item.variant}` : ''}</p>
          </div>
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #FAD4DD; text-align: right; font-weight: 700; color: #E8546B; font-size: 14px;">${formatBDT(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const servicesHtml = order.selectedServices && order.selectedServices.length > 0 
    ? order.selectedServices.map(s => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #FAD4DD;"><span style="color: #6B5558; font-size: 13px;">${s.name}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #FAD4DD; text-align: right; font-weight: 600; color: #2B1A24; font-size: 13px;">${formatBDT(s.price)}</td>
      </tr>
    `).join('') : '';

  const content = `
    <p style="color: #6B5558; font-size: 14px;">Hello <strong style="color: #2B1A24;">${order.address.name || 'Customer'}</strong>,</p>
    <p style="color: #6B5558; font-size: 14px;">Thank you for your order! We have received it successfully and will begin processing it shortly.</p>
    
    <div style="background-color: #FFF6F6; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center; border: 1px solid #FAD4DD;">
      <p style="margin: 0; color: #6B5558; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Order ID</p>
      <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #E8546B;">#${order.id}</p>
    </div>

    <h3 style="color: #2B1A24; font-size: 16px; border-bottom: 2px solid #E8546B; padding-bottom: 8px; margin-top: 32px;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">${itemsHtml}${servicesHtml}</table>

    <table style="width: 100%; margin-top: 24px; font-size: 14px;">
      <tr><td style="color: #6B5558; padding: 4px 0;">Subtotal</td><td style="text-align: right; color: #2B1A24; padding: 4px 0;">${formatBDT(order.subtotal)}</td></tr>
      ${order.selectedServices && order.selectedServices.length > 0 ? `<tr><td style="color: #6B5558; padding: 4px 0;">Services</td><td style="text-align: right; color: #2B1A24; padding: 4px 0;">${formatBDT(order.selectedServices.reduce((sum, s) => sum + s.price, 0))}</td></tr>` : ''}
      <tr><td style="color: #6B5558; padding: 4px 0;">Shipping</td><td style="text-align: right; color: #2B1A24; padding: 4px 0;">${order.shipping > 0 ? formatBDT(order.shipping) : '---'}</td></tr>
      <tr><td style="font-weight: 700; color: #2B1A24; padding-top: 12px; border-top: 2px solid #FAD4DD; padding: 4px 0;">Total</td><td style="text-align: right; font-weight: 700; color: #E8546B; font-size: 20px; padding-top: 12px; border-top: 2px solid #FAD4DD; padding: 4px 0;">${formatBDT(order.total)}</td></tr>
    </table>

    <div style="margin-top: 32px; padding: 16px; background-color: #E8F5E9; border-radius: 12px; border: 1px solid #C8E6C9;">
      <p style="margin: 0; color: #2E7D32; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p style="margin: 6px 0 0 0; color: #2E7D32; font-size: 14px;"><strong>Delivery Address:</strong> ${order.address.address}, ${order.address.district}</p>
    </div>
  `;

  return sendEmailViaAPI(order.address.email, `Order Confirmed: #${order.id}`, emailWrapper("Order Confirmed! 🎉", content));
}

// 2. STATUS UPDATE EMAIL
export async function sendStatusUpdateEmail(order: Order, newStatus: OrderStatus) {
  if (!order.address?.email) return { success: false, error: "No email" };

  const content = `
    <p style="color: #6B5558; font-size: 14px;">Hello <strong style="color: #2B1A24;">${order.address.name || 'Customer'}</strong>,</p>
    <p style="color: #6B5558; font-size: 14px;">Your order status has been updated.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <p style="margin: 0; color: #6B5558; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Order #${order.id}</p>
      <div style="display: inline-block; background: linear-gradient(135deg, #E8546B, #FF8B9A); color: white; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 16px; margin-top: 12px;">${STATUS_LABELS[newStatus]}</div>
    </div>

    <div style="background-color: #FFF6F6; padding: 16px; border-radius: 12px; margin-top: 24px; border: 1px solid #FAD4DD;">
      <p style="margin: 0; color: #2B1A24; font-size: 14px;"><strong>Current Status:</strong> ${STATUS_LABELS[newStatus]}</p>
      ${order.statusNotes?.[newStatus] ? `<p style="margin: 8px 0 0 0; color: #6B5558; font-size: 13px; font-style: italic;">Note: "${order.statusNotes[newStatus]}"</p>` : ''}
    </div>
  `;

  return sendEmailViaAPI(order.address.email, `Order Update: #${order.id} is ${STATUS_LABELS[newStatus]}`, emailWrapper("Order Status Updated", content));
}

// 3. PAYMENT RECEIVED EMAIL
export async function sendPaymentEmail(order: Order, amountAdded: number) {
  if (!order.address?.email) return { success: false, error: "No email" };

  const content = `
    <p style="color: #6B5558; font-size: 14px;">Hello <strong style="color: #2B1A24;">${order.address.name || 'Customer'}</strong>,</p>
    <p style="color: #6B5558; font-size: 14px;">We have successfully received your payment. Thank you!</p>

    <div style="background-color: #E8F5E9; border: 1px solid #C8E6C9; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; color: #2E7D32; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Amount Received</p>
      <p style="margin: 12px 0 0 0; font-size: 32px; font-weight: 700; color: #2E7D32;">${formatBDT(amountAdded)}</p>
    </div>

    <table style="width: 100%; font-size: 14px; margin-top: 24px;">
      <tr><td style="color: #6B5558; padding-bottom: 10px;">Order ID</td><td style="text-align: right; font-weight: 700; color: #2B1A24; padding-bottom: 10px;">#${order.id}</td></tr>
      <tr><td style="color: #6B5558; padding-bottom: 10px;">Total Amount Paid</td><td style="text-align: right; font-weight: 700; color: #2E7D32; padding-bottom: 10px;">${formatBDT(order.paidAmount || 0)}</td></tr>
      <tr><td style="color: #6B5558; padding-bottom: 10px;">Remaining Due</td><td style="text-align: right; font-weight: 700; color: #E8546B; padding-bottom: 10px;">${formatBDT(order.dueAmount || 0)}</td></tr>
    </table>
  `;

  return sendEmailViaAPI(order.address.email, `Payment Received for Order #${order.id}`, emailWrapper("Payment Received 💰", content));
}