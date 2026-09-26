import dns from "dns";
import type { Order, OrderItem } from "@prisma/client";

// Prefer IPv4 — Meta Graph API often times out over broken IPv6 routes.
dns.setDefaultResultOrder("ipv4first");

type OrderWithItems = Order & { items: OrderItem[] };

const META_TIMEOUT_MS = 30_000;

async function metaFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const code =
      err && typeof err === "object" && "cause" in err
        ? String((err as { cause?: { code?: string } }).cause?.code || "")
        : "";
    if (code.includes("TIMEOUT") || code.includes("ABORT")) {
      throw new Error(
        "Cannot reach Meta Graph API (graph.facebook.com). Check your internet, firewall, or VPN. Try: curl -I https://graph.facebook.com"
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function enabled() {
  const flag = (process.env.WHATSAPP_ENABLED || "true").toLowerCase();
  return flag !== "false" && flag !== "0";
}

function isConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function apiVersion() {
  return process.env.WHATSAPP_API_VERSION || "v21.0";
}

function formatPkr(amount: number | string) {
  return `Rs ${Number(amount).toLocaleString("en-PK")}`;
}

/** Meta expects digits only with country code (e.g. 923001234567). */
export function formatWhatsAppNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (digits.length === 10) digits = `92${digits}`;
  return digits;
}

function itemsSummary(items: OrderItem[], max = 120) {
  const text = items.map((i) => `${i.quantity}× ${i.nameAtOrder}`).join(", ");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type TemplateComponent = {
  type: "body";
  parameters: { type: "text"; text: string }[];
};

async function sendWhatsApp(
  to: string,
  payload:
    | { type: "text"; body: string }
    | { type: "template"; name: string; language: string; components?: TemplateComponent[] }
) {
  const recipient = formatWhatsAppNumber(to);
  if (!recipient) return false;

  if (!enabled()) {
    console.log(`[whatsapp] (disabled) To: ${recipient}`);
    return false;
  }

  if (!isConfigured()) {
    console.log(`[whatsapp] (not configured) To: ${recipient}`);
    return false;
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const url = `https://graph.facebook.com/${apiVersion()}/${phoneId}/messages`;

  const body =
    payload.type === "text"
      ? {
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { preview_url: false, body: payload.body },
        }
      : {
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: payload.name,
            language: { code: payload.language },
            ...(payload.components?.length ? { components: payload.components } : {}),
          },
        };

  try {
    const res = await metaFetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { error?: { message?: string; code?: number } };
    if (!res.ok) {
      console.error("[whatsapp] send failed:", data.error?.message || res.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
    return false;
  }
}

function templateBodyParams(values: string[]): TemplateComponent[] {
  return [{ type: "body", parameters: values.map((text) => ({ type: "text", text })) }];
}

export async function sendOrderReceivedWhatsApp(order: OrderWithItems, autoConfirmed: boolean) {
  const template = process.env.WHATSAPP_TEMPLATE_ORDER?.trim();
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  const fulfillment = order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery";
  const statusLine = autoConfirmed
    ? "Your order is confirmed — the kitchen is getting started."
    : `We'll call you on ${order.customerPhone} shortly to verify before cooking.`;

  if (template) {
    return sendWhatsApp(order.customerPhone, {
      type: "template",
      name: template,
      language: lang,
      components: templateBodyParams([
        order.customerName,
        order.orderNumber,
        formatPkr(Number(order.total)),
        fulfillment,
        statusLine,
      ]),
    });
  }

  const body = [
    `Hi ${order.customerName}!`,
    autoConfirmed
      ? `Your order *${order.orderNumber}* is confirmed.`
      : `We received order *${order.orderNumber}*.`,
    `Total: ${formatPkr(Number(order.total))} · ${fulfillment}`,
    statusLine,
    "— Ubaid Fast Foodz",
  ].join("\n");

  return sendWhatsApp(order.customerPhone, { type: "text", body });
}

export async function sendNewOrderStaffWhatsApp(order: OrderWithItems, storeWhatsApp?: string) {
  const notifyTo = process.env.WHATSAPP_NOTIFY_TO?.trim() || storeWhatsApp?.trim();
  if (!notifyTo) return false;

  const template = process.env.WHATSAPP_TEMPLATE_STAFF?.trim();
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  const fulfillment = order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery";
  const location = `${fulfillment} · ${order.deliveryAddress}`;
  const summary = itemsSummary(order.items);

  if (template) {
    return sendWhatsApp(notifyTo, {
      type: "template",
      name: template,
      language: lang,
      components: templateBodyParams([
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        formatPkr(Number(order.total)),
        location,
        summary,
      ]),
    });
  }

  const body = [
    `🆕 New order *${order.orderNumber}*`,
    `${order.customerName} · ${order.customerPhone}`,
    `Total: ${formatPkr(Number(order.total))}`,
    location,
    summary,
  ].join("\n");

  return sendWhatsApp(notifyTo, { type: "text", body });
}

export async function verifyWhatsAppConfig() {
  if (!isConfigured()) {
    console.error("Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env");
    return false;
  }
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const url = `https://graph.facebook.com/${apiVersion()}/${phoneId}`;
  const res = await metaFetch(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  const data = (await res.json()) as { display_phone_number?: string; id?: string; error?: { message?: string } };
  if (!res.ok) {
    console.error("WhatsApp API error:", data.error?.message || data);
    return false;
  }
  console.log("WhatsApp phone number OK:", data.display_phone_number || data.id);
  return true;
}
