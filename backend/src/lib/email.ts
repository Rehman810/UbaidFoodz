import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function fromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "orders@ubaidfastfoodz.com";
}

function formatPkr(amount: number | string) {
  return `Rs ${Number(amount).toLocaleString("en-PK")}`;
}

function itemsHtml(items: OrderItem[]) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity}× ${i.nameAtOrder}</td><td style="padding:6px 0;text-align:right">${formatPkr(Number(i.priceAtOrder) * i.quantity)}</td></tr>`
    )
    .join("");
}

function wrap(title: string, body: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1c1917">
      <div style="background:#ea580c;color:white;padding:20px 24px;border-radius:16px 16px 0 0">
        <h1 style="margin:0;font-size:20px">Ubaid Fast Foodz</h1>
      </div>
      <div style="border:1px solid #fed7aa;border-top:0;padding:24px;border-radius:0 0 16px 16px;background:#fffaf5">
        <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
        ${body}
        <p style="margin-top:24px;font-size:12px;color:#78716c">Thank you for ordering from Ubaid Fast Foodz · Karachi</p>
      </div>
    </div>
  `;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const email = to.trim().toLowerCase();
  if (!email || !email.includes("@")) return false;

  if (!isConfigured()) {
    console.log(`[email] (SMTP not configured) To: ${email} | ${subject}`);
    return false;
  }

  try {
    await transporter().sendMail({
      from: fromAddress(),
      to: email,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

export async function sendOrderPlacedEmail(order: OrderWithItems, autoConfirmed: boolean) {
  if (!order.customerEmail) return;
  const title = autoConfirmed ? "Order confirmed" : "We received your order";
  const intro = autoConfirmed
    ? `Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> is confirmed and the kitchen is getting started.`
    : `Hi ${order.customerName}, we received order <strong>${order.orderNumber}</strong>. Our team will call you shortly on <strong>${order.customerPhone}</strong> to verify details before we start cooking.`;

  const html = wrap(
    title,
    `
      <p style="line-height:1.6">${intro}</p>
      <table style="width:100%;margin-top:16px;font-size:14px">${itemsHtml(order.items)}</table>
      <p style="margin-top:16px;font-size:15px"><strong>Total: ${formatPkr(Number(order.total))}</strong></p>
      <p style="font-size:13px;color:#57534e">${order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"} · ${order.deliveryAddress}</p>
    `
  );

  await sendEmail(
    order.customerEmail,
    autoConfirmed
      ? `Order ${order.orderNumber} confirmed — Ubaid Fast Foodz`
      : `Order ${order.orderNumber} received — we'll call to confirm`,
    html
  );
}

export async function sendOrderConfirmedEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const html = wrap(
    "Order confirmed",
    `
      <p style="line-height:1.6">Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> is now confirmed after our verification call. The kitchen is preparing your food.</p>
      <p style="margin-top:16px;font-size:15px"><strong>Total: ${formatPkr(Number(order.total))}</strong></p>
    `
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} confirmed — Ubaid Fast Foodz`, html);
}

export async function sendOrderDeliveredEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const html = wrap(
    "Order delivered",
    `
      <p style="line-height:1.6">Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> has been delivered. We hope you enjoy your meal!</p>
      <p style="margin-top:16px;font-size:15px"><strong>Total paid: ${formatPkr(Number(order.total))}</strong></p>
      <p style="font-size:13px;color:#57534e">Thank you for choosing Ubaid Fast Foodz. Order again anytime.</p>
    `
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} delivered — Ubaid Fast Foodz`, html);
}
