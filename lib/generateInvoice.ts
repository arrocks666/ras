
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Order } from "./OrderContext";
import { STATUS_LABELS } from "./OrderContext";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const money = (value: unknown): string => {
  const amount = Number(value ?? 0);
  return `৳${Math.round(
    Number.isFinite(amount) ? amount : 0
  ).toLocaleString("en-BD")}`;
};

export async function generateInvoice(
  order: Order,
  storeName: string = "Ratry's Artistry Shop",
  storeUrl: string = "ratrysartistry.com",
  logoUrl?: string
): Promise<void> {

  // FINANCIAL CALCULATIONS
  const subtotal = Math.max(0, Number(order.subtotal) || 0);
  const shipping = Math.max(0, Number(order.shipping) || 0);
  const shippingConfirmed = shipping > 0;

  // Do not use a stale order.total value.
  const grandTotal = subtotal + shipping;

  const paid = Math.max(0, Number(order.paidAmount) || 0);
  const due = Math.max(0, grandTotal - paid);

  const createdAt = new Date(order.createdAt);

  const dateStr = Number.isNaN(createdAt.getTime())
    ? "—"
    : createdAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const status = escapeHtml(
    STATUS_LABELS?.[order.status] ??
    String(order.status ?? "Order Placed")
  );

  // PRODUCT ROWS
  const itemsHtml = (order.items ?? [])
    .map((item, index) => {

      const title = escapeHtml(item.title || "Product");

      const variant = item.variant
        ? `<div class="variant">${escapeHtml(item.variant)}</div>`
        : "";

      const image = item.image
        ? `<img class="product-image"
            src="${escapeHtml(item.image)}"
            crossorigin="anonymous"
            alt="${title}" />`
        : `<div class="product-placeholder">🎁</div>`;

      const quantity = Math.max(
        0,
        Number(item.quantity) || 0
      );

      const lineTotal =
        (Number(item.price) || 0) * quantity;

      return `
        <tr class="product-row">

          <td class="number-cell">
            ${index + 1}
          </td>

          <td class="product-cell">
            ${image}

            <div class="product-copy">
              <div class="product-title">
                ${title}
              </div>

              ${variant}
            </div>
          </td>

          <td class="qty-cell">
            ${quantity}
          </td>

          <td class="price-cell">
            ${money(lineTotal)}
          </td>

        </tr>
      `;
    })
    .join("");

  // CUSTOMER INFORMATION
  const customerName = escapeHtml(
    order.address?.name || "Valued Customer"
  );

  const email = escapeHtml(
    order.address?.email || "—"
  );

  const phone = escapeHtml(
    order.address?.phone || "—"
  );

  const address = [
    order.address?.address,
    order.address?.district
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ") || "—";

  // INVOICE CONTAINER
  const container = document.createElement("div");

  container.style.cssText = `
    position: fixed;
    left: -10000px;
    top: 0;
    width: 794px;
    z-index: -1;
    background: #fff7f7;
  `;

  container.innerHTML = `

    <style>

      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Dancing+Script:wght@600;700&display=swap');

      #invoice {
        width: 794px;
        min-height: 1123px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        padding: 34px 36px 28px;
        color: #351629;

        background:
          radial-gradient(
            ellipse at 4% 0%,
            rgba(255,190,211,.45),
            transparent 25%
          ),
          radial-gradient(
            ellipse at 100% 38%,
            rgba(255,215,228,.42),
            transparent 28%
          ),
          linear-gradient(
            145deg,
            #fffafa 0%,
            #fff4f6 55%,
            #fff9fa 100%
          );

        font-family: 'DM Sans', Arial, sans-serif;
      }

      #invoice * {
        box-sizing: border-box;
      }

      .top-decoration {
        position: absolute;
        top: -72px;
        left: -40px;
        width: 360px;
        height: 125px;
        border-radius: 0 0 55% 35%;
        transform: rotate(-5deg);
        background: linear-gradient(
          110deg,
          #ffb4ce,
          #ffe1eb 75%
        );
        opacity: .8;
      }

      /* HEADER */

      .header {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 112px;
        margin-bottom: 20px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 0;
      }

      .logo {
        width: 72px;
        height: 72px;
        flex: 0 0 72px;
        border-radius: 19px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 34px;
        font-weight: 800;

        background: linear-gradient(
          145deg,
          #ff7897,
          #df1455
        );

        box-shadow: 0 8px 18px rgba(219,31,91,.18);
      }

      .logo-img {
        width: 72px;
        height: 72px;
        object-fit: contain;
      }

      .brand-name {
        margin: 0;
        color: #d91e59;
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 25px;
        line-height: 1.2;
        font-weight: 700;
      }

      .brand-url {
        margin: 5px 0 0;
        color: #886b76;
        font-size: 12px;
      }

      .thank-you {
        text-align: right;
        padding-left: 10px;
      }

      .thank-title {
        margin: 0;
        color: #c81755;
        font-family: 'Dancing Script', cursive;
        font-size: 39px;
        line-height: 1.05;
        font-weight: 700;
      }

      .thank-sub {
        margin: 7px 0 0;
        color: #573b49;
        font-size: 13px;
        font-style: italic;
      }

      /* ORDER DETAILS */

      .meta {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;

        background: linear-gradient(
          105deg,
          #ffe5ed,
          #fff0f4
        );

        border: 1px solid #ffc2d3;
        border-radius: 16px;
        margin-bottom: 22px;
        overflow: hidden;
      }

      .meta-item {
        min-height: 78px;
        padding: 15px 17px;
        display: flex;
        gap: 11px;
        align-items: center;
      }

      .meta-item + .meta-item {
        border-left: 1px solid #f5a8bf;
      }

      .meta-icon {
        width: 36px;
        height: 36px;
        flex: 0 0 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        color: white;
        font-size: 19px;

        background: linear-gradient(
          145deg,
          #f85b85,
          #d91e59
        );
      }

      .meta-label {
        margin: 0 0 5px;
        color: #d63b68;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .7px;
        text-transform: uppercase;
      }

      .meta-value {
        margin: 0;
        color: #351629;
        font-size: 13px;
        font-weight: 800;
      }

      .status-pill {
        display: inline-block;
        padding: 5px 11px;
        border-radius: 20px;
        background: #e92c66;
        color: white;
        font-size: 10px;
        font-weight: 800;
      }

      /* CUSTOMER DETAILS */

      .customer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        min-height: 166px;
        padding: 17px 21px;
        margin-bottom: 22px;
        border: 1px solid #ffc4d4;
        border-radius: 17px;
        background: rgba(255,255,255,.72);
      }

      .customer-main {
        width: 62%;
      }

      .section-heading {
        margin: 0 0 13px;
        display: flex;
        align-items: center;
        gap: 9px;
        color: #3b1b2d;
        font-size: 17px;
        font-weight: 800;
      }

      .heading-icon {
        width: 27px;
        height: 27px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
        background: #e52d67;
        font-size: 14px;
      }

      .customer-grid {
        display: grid;
        grid-template-columns: 75px 1fr;
        gap: 7px 9px;
        font-size: 12px;
        line-height: 1.35;
      }

      .customer-grid strong {
        color: #4a2939;
      }

      .customer-grid span {
        color: #563e49;
        overflow-wrap: anywhere;
      }

      .gift-side {
        width: 38%;
        text-align: center;
        color: #df2b68;

        background: radial-gradient(
          ellipse,
          #ffe6ee 0%,
          rgba(255,239,244,0) 72%
        );

        padding: 5px;
      }

      .gift-script {
        margin: 0;
        font-family: 'Dancing Script', cursive;
        font-size: 27px;
        line-height: 1.05;
        font-weight: 700;
      }

      .gift-icon {
        margin-top: 5px;
        font-size: 42px;
        line-height: 1.1;
      }

      /* PRODUCT TABLE */

      .table-wrap {
        overflow: hidden;
        border: 1px solid #ffb8cc;
        border-radius: 15px;
        background: rgba(255,255,255,.9);
        margin-bottom: 17px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      thead {
        background: linear-gradient(
          100deg,
          #ec3970,
          #d91e5b
        );
        color: white;
      }

      th {
        padding: 12px 10px;
        font-size: 11px;
        text-align: left;
        font-weight: 800;
      }

      th:first-child {
        width: 48px;
        text-align: center;
      }

      th:nth-child(3) {
        width: 78px;
        text-align: center;
      }

      th:nth-child(4) {
        width: 120px;
        text-align: right;
      }

      .product-row {
        border-bottom: 1px solid #f8d6df;
      }

      .product-row:last-child {
        border-bottom: 0;
      }

      .product-row td {
        padding: 10px 9px;
        vertical-align: middle;
      }

      .number-cell {
        text-align: center;
        color: #e32d68;
        font-size: 13px;
        font-weight: 800;
      }

      .product-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .product-image,
      .product-placeholder {
        width: 57px;
        height: 57px;
        flex: 0 0 57px;
        border-radius: 10px;
        border: 1px solid #ffc2d3;
        background: #fff5f7;
        object-fit: contain;
        padding: 3px;
      }

      .product-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
      }

      .product-copy {
        min-width: 0;
      }

      .product-title {
        color: #351629;
        font-size: 11px;
        line-height: 1.35;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .variant {
        margin-top: 3px;
        color: #886b76;
        font-size: 10px;
      }

      .qty-cell {
        text-align: center;
        color: #351629;
        font-size: 12px;
        font-weight: 800;
      }

      .price-cell {
        text-align: right;
        color: #df205c;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }

      /* TOTALS */

      .totals-row {
        display: flex;
        justify-content: flex-end;
        margin: 0 0 21px;
      }

      .totals {
        width: 310px;
        border: 1px solid #ffc0d1;
        border-radius: 13px;
        overflow: hidden;
        background: #fff1f5;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        padding: 8px 14px;
        font-size: 12px;
        border-bottom: 1px solid #f8d2dd;
      }

      .total-line strong {
        color: #421d30;
      }

      .shipping-note {
        display: block;
        margin-top: 2px;
        color: #947681;
        font-size: 9px;
      }

      .grand-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        color: white;

        background: linear-gradient(
          100deg,
          #ed3970,
          #d81758
        );

        font-size: 17px;
        font-weight: 800;
      }

      /* PAYMENT AND INFORMATION */

      .bottom-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 20px;
      }

      .info-card {
        min-height: 123px;
        padding: 15px 17px;
        border: 1px solid #ffc0d1;
        border-radius: 15px;
        background: rgba(255,255,255,.82);
      }

      .info-heading {
        margin: 0 0 12px;
        color: #3b1b2d;
        font-size: 13px;
        font-weight: 800;
      }

      .info-line {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
        font-size: 11px;
        color: #765d68;
      }

      .paid {
        color: #27a568;
        font-weight: 800;
      }

      .due {
        color: #df205c;
        font-weight: 800;
      }

      .info-list {
        margin: 0;
        padding-left: 15px;
        color: #765d68;
        font-size: 10px;
        line-height: 1.65;
      }

      /* FOOTER */

      .footer {
        position: relative;
        text-align: center;
        padding: 13px 12px 10px;
        border-top: 1px solid #f4a9bf;
      }

      .footer-heart {
        color: #e52d67;
        font-size: 22px;
        line-height: 1;
      }

      .footer-thanks {
        margin: 5px 0;
        color: #d91e59;
        font-family: 'Dancing Script', cursive;
        font-size: 27px;
        font-weight: 700;
      }

      .copyright {
        margin: 0;
        color: #947681;
        font-size: 9px;
      }

      .bottom-bar {
        margin: 12px -36px -28px;
        padding: 15px 36px;
        color: white;

        background: linear-gradient(
          100deg,
          #cf1554,
          #f0447a
        );

        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: 800;
      }

      .bottom-bar small {
        font-size: 10px;
        font-weight: 500;
        opacity: .9;
      }

      .sparkle {
        position: absolute;
        color: #f18bad;
        font-size: 20px;
      }

      .s1 {
        top: 125px;
        right: 25px;
      }

      .s2 {
        bottom: 100px;
        left: 20px;
      }

    </style>

    <div id="invoice">

      <div class="top-decoration"></div>

      <span class="sparkle s1">✦</span>
      <span class="sparkle s2">✧</span>

      <!-- HEADER -->

      <header class="header">

        <div class="brand">

          ${
            logoUrl
              ? `<img class="logo-img"
                  src="${escapeHtml(logoUrl)}"
                  crossorigin="anonymous"
                  alt="Store logo" />`
              : `<div class="logo">R</div>`
          }

          <div>
            <h1 class="brand-name">
              ${escapeHtml(storeName)}
            </h1>

            <p class="brand-url">
              ${escapeHtml(storeUrl)}
            </p>
          </div>

        </div>

        <div class="thank-you">

          <h2 class="thank-title">
            Thank You ♡
          </h2>

          <p class="thank-sub">
            for shopping with us!
          </p>

        </div>

      </header>

      <!-- ORDER DETAILS -->

      <section class="meta">

        <div class="meta-item">

          <div class="meta-icon">▤</div>

          <div>
            <p class="meta-label">Invoice No.</p>
            <p class="meta-value">#${escapeHtml(order.id)}</p>
          </div>

        </div>

        <div class="meta-item">

          <div class="meta-icon">▦</div>

          <div>
            <p class="meta-label">Order Date</p>
            <p class="meta-value">${dateStr}</p>
          </div>

        </div>

        <div class="meta-item">

          <div class="meta-icon">✓</div>

          <div>
            <p class="meta-label">Order Status</p>
            <span class="status-pill">${status}</span>
          </div>

        </div>

      </section>

      <!-- CUSTOMER DETAILS -->

      <section class="customer">

        <div class="customer-main">

          <h3 class="section-heading">
            <span class="heading-icon">♟</span>
            Customer Details
          </h3>

          <div class="customer-grid">

            <strong>Name:</strong>
            <span>${customerName}</span>

            <strong>Email:</strong>
            <span>${email}</span>

            <strong>Phone:</strong>
            <span>${phone}</span>

            <strong>Address:</strong>
            <span>${address}</span>

          </div>

        </div>

        <div class="gift-side">

          <p class="gift-script">
            Always here<br/>for you ♡
          </p>

          <div class="gift-icon">🎁</div>

        </div>

      </section>

      <!-- PRODUCT TABLE -->

      <section class="table-wrap">

        <table>

          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total Price</th>
            </tr>
          </thead>

          <tbody>

            ${
              itemsHtml ||
              `<tr>
                <td colspan="4"
                  style="padding:22px;text-align:center;color:#886b76;">
                  No products found for this order.
                </td>
              </tr>`
            }

          </tbody>

        </table>

      </section>

      <!-- TOTALS -->

      <section class="totals-row">

        <div class="totals">

          <div class="total-line">
            <span>Subtotal</span>
            <strong>${money(subtotal)}</strong>
          </div>

          <div class="total-line">

            <span>
              Shipping

              <small class="shipping-note">
                ${
                  shippingConfirmed
                    ? "Confirmed shipping charge"
                    : "To be added after shipment"
                }
              </small>
            </span>

            <strong>
              ${
                shippingConfirmed
                  ? money(shipping)
                  : "To be added"
              }
            </strong>

          </div>

          <div class="grand-total">

            <span>Total</span>
            <span>${money(grandTotal)}</span>

          </div>

        </div>

      </section>

      <!-- PAYMENT AND INFORMATION -->

      <section class="bottom-cards">

        <div class="info-card">

          <h3 class="info-heading">
            ▰ &nbsp; Payment Status
          </h3>

          <div class="info-line">

            <span>Amount Paid:</span>

            <strong class="paid">
              ${money(paid)}
            </strong>

          </div>

          <div class="info-line">

            <span>Remaining Due:</span>

            <strong class="due">
              ${money(due)}
            </strong>

          </div>

        </div>

        <div class="info-card">

          <h3 class="info-heading">
            ⓘ &nbsp; Important Information
          </h3>

          <ul class="info-list">

            <li>
              Shipping charge will be added after shipment.
            </li>

            <li>
              You will receive a notification once dispatched.
            </li>

            <li>
              For any query, contact us anytime!
            </li>

          </ul>

        </div>

      </section>

      <!-- FOOTER -->

      <footer class="footer">

        <div class="footer-heart">♡</div>

        <p class="footer-thanks">
          Thank You for Shopping With Us!
        </p>

        <p class="copyright">
          © ${new Date().getFullYear()}
          ${escapeHtml(storeName)}.
          All rights reserved.
        </p>

      </footer>

      <div class="bottom-bar">

        <span>
          ♡ &nbsp; Shop More. Stay Awesome!
        </span>

        <small>
          ${escapeHtml(storeUrl)}
        </small>

      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {

    // WAIT FOR FONTS

    if ("fonts" in document) {
      await document.fonts.ready;
    }

    // WAIT FOR PRODUCT AND LOGO IMAGES

    const images = Array.from(
      container.querySelectorAll("img")
    );

    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {

            if (img.complete) {
              resolve();
              return;
            }

            img.onload = () => resolve();
            img.onerror = () => resolve();

          })
      )
    );

    const invoiceElement =
      container.querySelector<HTMLElement>("#invoice");

    if (!invoiceElement) {
      throw new Error(
        "Invoice layout could not be created."
      );
    }

    // GENERATE IMAGE

    const canvas = await html2canvas(
      invoiceElement,
      {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#fff7f7",
        logging: false,
        width: 794,
        windowWidth: 794,
      }
    );

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.96
    );

    // CREATE A4 PDF

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    // FIT COMPLETE INVOICE ON ONE PAGE

    const scale = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );

    const renderWidth =
      canvas.width * scale;

    const renderHeight =
      canvas.height * scale;

    const x =
      (pageWidth - renderWidth) / 2;

    const y =
      (pageHeight - renderHeight) / 2;

    pdf.addImage(
      imageData,
      "JPEG",
      x,
      y,
      renderWidth,
      renderHeight,
      undefined,
      "FAST"
    );

    // DOWNLOAD

    pdf.save(
      `Invoice-${String(order.id).replace(
        /[^a-zA-Z0-9-_]/g,
        ""
      )}.pdf`
    );

  } catch (err) {

    console.error(
      "Failed to generate PDF:",
      err
    );

    alert(
      "Failed to generate PDF. Please try again."
    );

  } finally {

    document.body.removeChild(container);

  }
}
