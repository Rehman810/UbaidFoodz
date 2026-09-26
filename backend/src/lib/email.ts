import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

function smtpUser() {
  return (process.env.SMTP_USER || "").trim();
}

function smtpPass() {
  return (process.env.SMTP_PASS || "").replace(/\s+/g, "");
}

function isConfigured() {
  return Boolean((process.env.SMTP_HOST || process.env.SMTP_SERVICE) && smtpUser() && smtpPass());
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1"
      ? true
      : process.env.SMTP_SECURE === "false" || process.env.SMTP_SECURE === "0"
        ? false
        : port === 465;
  const service = (process.env.SMTP_SERVICE || "").trim().toLowerCase();
  return nodemailer.createTransport({
    ...(service === "gmail" ? { service: "gmail" } : { host: process.env.SMTP_HOST, port, secure }),
    auth: {
      user: smtpUser(),
      pass: smtpPass(),
    },
  });
}

function fromAddress() {
  return (
    process.env.SMTP_FROM ||
    process.env.SMTP_FROM_EMAIL ||
    smtpUser() ||
    "orders@ubaidfastfoodz.com"
  );
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPkr(amount: number | string) {
  return `Rs ${Number(amount).toLocaleString("en-PK")}`;
}

function itemsHtml(items: OrderItem[]) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity}× ${esc(i.nameAtOrder)}</td><td style="padding:6px 0;text-align:right">${formatPkr(Number(i.priceAtOrder) * i.quantity)}</td></tr>`
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
    const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
    if (code === "EAUTH") {
      console.error(
        "[email] Gmail rejected the login. Use the Gmail address in SMTP_USER and a 16-character App Password in SMTP_PASS (Google Account → Security → 2-Step Verification → App passwords). Do not use your normal Gmail password."
      );
    } else {
      console.error("[email] send failed:", err);
    }
    return false;
  }
}

export async function sendOrderPlacedEmail(order: OrderWithItems, autoConfirmed: boolean) {
  if (!order.customerEmail) return;
  const title = autoConfirmed ? "Order confirmed" : "We received your order";
  const intro = autoConfirmed
    ? `Hi ${esc(order.customerName)}, your order <strong>${esc(order.orderNumber)}</strong> is confirmed and the kitchen is getting started.`
    : `Hi ${esc(order.customerName)}, we received order <strong>${esc(order.orderNumber)}</strong>. Our team will call you shortly on <strong>${esc(order.customerPhone)}</strong> to verify details before we start cooking.`;

  const html = wrap(
    title,
    `
      <p style="line-height:1.6">${intro}</p>
      <table style="width:100%;margin-top:16px;font-size:14px">${itemsHtml(order.items)}</table>
      <p style="margin-top:16px;font-size:15px"><strong>Total: ${formatPkr(Number(order.total))}</strong></p>
      <p style="font-size:13px;color:#57534e">${order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery"} · ${esc(order.deliveryAddress)}</p>
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
      <p style="line-height:1.6">Hi ${esc(order.customerName)}, your order <strong>${esc(order.orderNumber)}</strong> is now confirmed after our verification call. The kitchen is preparing your food.</p>
      <p style="margin-top:16px;font-size:15px"><strong>Total: ${formatPkr(Number(order.total))}</strong></p>
      <p style="font-size:13px;color:#57534e">${order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery"} · ${esc(order.deliveryAddress)}</p>
    `
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} confirmed — Ubaid Fast Foodz`, html);
}

export async function sendOrderDeliveredEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const html = wrap(
    "Order delivered",
    `
      <p style="line-height:1.6">Hi ${esc(order.customerName)}, your order <strong>${esc(order.orderNumber)}</strong> has been delivered. We hope you enjoy your meal!</p>
      <p style="margin-top:16px;font-size:15px"><strong>Total paid: ${formatPkr(Number(order.total))}</strong></p>
      <p style="font-size:13px;color:#57534e">Thank you for choosing Ubaid Fast Foodz. Order again anytime.</p>
    `
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} delivered — Ubaid Fast Foodz`, html);
}

export async function sendOrderPreparingEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const html = wrap(
    "Kitchen is cooking",
    `<p style="line-height:1.6">Hi ${esc(order.customerName)}, the kitchen has started preparing order <strong>${esc(order.orderNumber)}</strong>.</p>`
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} is being prepared`, html);
}

export async function sendOrderOnTheWayEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const takeaway = order.fulfillmentType === "PICKUP";
  const html = wrap(
    takeaway ? "Ready for pickup" : "Out for delivery",
    takeaway
      ? `<p style="line-height:1.6">Hi ${esc(order.customerName)}, order <strong>${esc(order.orderNumber)}</strong> is ready. Please collect it from the restaurant.</p><p style="font-size:13px;color:#57534e">${esc(order.deliveryAddress)}</p>`
      : `<p style="line-height:1.6">Hi ${esc(order.customerName)}, order <strong>${esc(order.orderNumber)}</strong> is on the way.</p><p style="font-size:13px;color:#57534e">${esc(order.deliveryAddress)}</p>`
  );
  await sendEmail(
    order.customerEmail,
    takeaway ? `Order ${order.orderNumber} is ready for pickup` : `Order ${order.orderNumber} is on the way`,
    html
  );
}

export async function sendOrderCancelledEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const html = wrap(
    "Order cancelled",
    `<p style="line-height:1.6">Hi ${esc(order.customerName)}, order <strong>${esc(order.orderNumber)}</strong> has been cancelled. If you did not request this, call the restaurant.</p>`
  );
  await sendEmail(order.customerEmail, `Order ${order.orderNumber} cancelled`, html);
}

export async function sendNewOrderStaffEmail(order: OrderWithItems, adminEmails: string[]) {
  const html = wrap(
    "New order",
    `
      <p style="line-height:1.6"><strong>${esc(order.orderNumber)}</strong> · ${esc(order.customerName)} · ${esc(order.customerPhone)}</p>
      <p style="font-size:13px;color:#57534e">${order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery"} · ${esc(order.deliveryAddress)}</p>
      <table style="width:100%;margin-top:16px;font-size:14px">${itemsHtml(order.items)}</table>
      <p style="margin-top:16px;font-size:15px"><strong>Total: ${formatPkr(Number(order.total))}</strong></p>
    `
  );
  await Promise.all(
    adminEmails.map((email) => sendEmail(email, `New order ${order.orderNumber} — Kitchen OS`, html))
  );
}

export async function sendRiderAssignedEmail(
  riderEmail: string | null | undefined,
  riderName: string,
  order: OrderWithItems
) {
  if (!riderEmail) return;
  const html = wrap(
    "New delivery assigned",
    `<p style="line-height:1.6">Hi ${esc(riderName)}, you have been assigned <strong>${esc(order.orderNumber)}</strong>.</p><p style="font-size:13px;color:#57534e">${esc(order.customerName)} · ${esc(order.customerPhone)}<br/>${esc(order.deliveryAddress)}</p>`
  );
  await sendEmail(riderEmail, `Delivery ${order.orderNumber} assigned to you`, html);
}

export async function sendStaffWelcomeEmail(
  email: string,
  name: string,
  role: string,
  temporaryPassword?: string
) {
  const html = wrap(
    "Your staff account",
    `
      <p style="line-height:1.6">Hi ${esc(name)}, an account was created for you on Kitchen OS.</p>
      <p>Role: <strong>${esc(role)}</strong><br/>Email: <strong>${esc(email)}</strong>${
        temporaryPassword ? `<br/>Temporary password: <strong>${esc(temporaryPassword)}</strong>` : ""
      }</p>
      <p style="font-size:13px;color:#57534e">Sign in at the staff login page and change your password if you were given a temporary one.</p>
    `
  );
  await sendEmail(email, "Your Ubaid Fast Foodz staff account", html);
}
