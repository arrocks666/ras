// lib/generateInvoice.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Order } from "./OrderContext";
import { formatBDT } from "./adminOrders";

export async function generateInvoice(
  order: Order,
  storeName: string = "Ratry's Artistry Shop",
  storeUrl: string = "ratrysartistry.com",
  logoUrl?: string
): Promise<void> {
  // 1. Create a hidden container for the invoice HTML
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.backgroundColor = "#FFFFFF";
  container.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  container.style.padding = "40px";
  container.style.color = "#2B1A24";

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #FAD4DD;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${item.image ? `<img src="${item.image}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #FAD4DD;" />` : ""}
            <div>
              <p style="margin: 0; font-weight: bold; color: #2B1A24; font-size: 13px;">${item.title || "Product"}</p>
              <p style="margin: 2px 0 0 0; color: #6B5558; font-size: 11px;">Qty: ${item.quantity}${item.variant ? ` | ${item.variant}` : ""}</p>
            </div>
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #FAD4DD; text-align: right; font-weight: bold; color: #E8546B; font-size: 13px;">
          ${formatBDT(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />`
    : `<h1 style="color: #E8546B; margin: 0; font-size: 28px;">${storeName}</h1>`;

  container.innerHTML = `
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 3px solid #E8546B;">
      ${logoHtml}
      <p style="color: #6B5558; font-size: 12px; margin-top: 6px;">${storeUrl}</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
      <div>
        <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #A88F92;">Billed To</p>
        <p style="margin: 6px 0 0 0; font-weight: bold; color: #2B1A24; font-size: 14px;">${order.address?.name || "Customer"}</p>
        <p style="margin: 2px 0 0 0; color: #6B5558; font-size: 12px;">${order.address?.phone || ""}</p>
        <p style="margin: 2px 0 0 0; color: #6B5558; font-size: 12px;">${order.address?.address || ""}, ${order.address?.district || ""}</p>
        ${order.address?.email ? `<p style="margin: 2px 0 0 0; color: #6B5558; font-size: 12px;">${order.address.email}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #A88F92;">Invoice Details</p>
        <p style="margin: 6px 0 0 0; font-weight: bold; color: #2B1A24; font-size: 14px;">#${order.id}</p>
        <p style="margin: 2px 0 0 0; color: #6B5558; font-size: 12px;">Date: ${createdDate}</p>
        <p style="margin: 2px 0 0 0; color: #6B5558; font-size: 12px;">Payment: ${order.paymentMethod}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 10px 0; border-bottom: 2px solid #E8546B; font-size: 12px; text-transform: uppercase; color: #6B5558;">Product</th>
          <th style="text-align: right; padding: 10px 0; border-bottom: 2px solid #E8546B; font-size: 12px; text-transform: uppercase; color: #6B5558;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
      <div style="width: 300px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6B5558; padding: 4px 0;">
          <span>Subtotal</span><span>${formatBDT(order.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6B5558; padding: 4px 0;">
          <span>Shipping</span><span>${order.shipping > 0 ? formatBDT(order.shipping) : "---"}</span>
        </div>
        ${
          order.selectedServices && order.selectedServices.length > 0
            ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #6B5558; padding: 4px 0;">
                <span>Services</span><span>${formatBDT(order.selectedServices.reduce((s, x) => s + x.price, 0))}</span>
              </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #E8546B; padding-top: 12px; border-top: 2px solid #E8546B; margin-top: 8px;">
          <span>Total</span><span>${formatBDT(order.total)}</span>
        </div>
        ${
          (order.paidAmount ?? 0) > 0
            ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #2e7d32; padding: 4px 0; margin-top: 6px;">
                <span>Paid</span><span>${formatBDT(order.paidAmount ?? 0)}</span>
              </div>`
            : ""
        }
        ${
          (order.dueAmount ?? 0) > 0
            ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #E8546B; padding: 4px 0;">
                <span>Due</span><span>${formatBDT(order.dueAmount ?? 0)}</span>
              </div>`
            : ""
        }
      </div>
    </div>

    <div style="text-align: center; margin-top: 50px; color: #A88F92; font-size: 10px; border-top: 1px solid #FAD4DD; padding-top: 20px;">
      <p>Thank you for shopping with ${storeName}!</p>
      <p>For any inquiries, please reply to this invoice or contact us via WhatsApp.</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#FFFFFF" });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${order.id}.pdf`);
  } catch (err) {
    console.error("Invoice generation failed:", err);
    throw err;
  } finally {
    document.body.removeChild(container);
  }
}