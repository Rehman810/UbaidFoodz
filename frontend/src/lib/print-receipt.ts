import { Order } from "./types";

export type ReceiptStore = {
  name: string;
  phone: string;
  address: string;
  whatsapp?: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPkr(n: number | string) {
  return `Rs ${Number(n).toLocaleString("en-PK")}`;
}

function fulfillmentLabel(type?: string | null) {
  if (type === "DINE_IN") return "Dine-in";
  if (type === "PICKUP") return "Takeaway";
  return "Delivery";
}

function paymentLabel(method?: string | null) {
  if (method === "CARD") return "Card";
  return "Cash";
}

export function receiptHtml(order: Order, store: ReceiptStore, cashier?: string) {
  const date = new Date(order.createdAt).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const items = order.items
    .map((i) => {
      const opts = i.optionsLabel ? `<div class="muted">${esc(i.optionsLabel)}</div>` : "";
      const note = i.instructions ? `<div class="muted">Note: ${esc(i.instructions)}</div>` : "";
      return `
        <tr>
          <td class="qty">${i.quantity}×</td>
          <td class="name">${esc(i.nameAtOrder)}${opts}${note}</td>
          <td class="amt">${formatPkr(Number(i.priceAtOrder) * i.quantity)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${esc(order.orderNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 72mm;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #1c1917;
      padding: 2mm;
    }
    .center { text-align: center; }
    .brand { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
    .tag { font-size: 9px; color: #78716c; margin-top: 2px; }
    .rule { border: none; border-top: 1px dashed #d6d3d1; margin: 8px 0; }
    .rule-bold { border-top: 2px solid #1c1917; margin: 10px 0 6px; }
    .order-no { font-size: 20px; font-weight: 800; letter-spacing: 0.04em; }
    .meta { font-size: 10px; color: #57534e; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    td { vertical-align: top; padding: 3px 0; }
    .qty { width: 22px; font-weight: 700; }
    .name { padding-right: 4px; }
    .amt { text-align: right; white-space: nowrap; font-weight: 600; }
    .muted { font-size: 9px; color: #78716c; margin-top: 1px; }
    .totals { margin-top: 6px; font-size: 11px; }
    .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
    .grand { font-size: 14px; font-weight: 800; margin-top: 4px; }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      border: 1px solid #1c1917;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .footer { margin-top: 10px; font-size: 9px; color: #78716c; text-align: center; }
    .thanks { margin-top: 8px; font-size: 12px; font-weight: 700; text-align: center; }
  </style>
</head>
<body>
  <div class="center">
    <div class="brand">${esc(store.name)}</div>
    <div class="tag">${esc(store.address)}</div>
    <div class="tag">Tel: ${esc(store.phone)}</div>
  </div>
  <hr class="rule-bold" />
  <div class="center">
    <div class="order-no">${esc(order.orderNumber)}</div>
    <div class="meta">${date}</div>
    <span class="badge">${fulfillmentLabel(order.fulfillmentType)}</span>
    ${order.tableNumber ? `<div class="meta">Table ${esc(order.tableNumber)}</div>` : ""}
  </div>
  <hr class="rule" />
  <div class="meta">Customer: <strong>${esc(order.customerName)}</strong></div>
  ${order.customerPhone ? `<div class="meta">Phone: ${esc(order.customerPhone)}</div>` : ""}
  ${order.notes ? `<div class="meta">Note: ${esc(order.notes)}</div>` : ""}
  <table>${items}</table>
  <hr class="rule" />
  <div class="totals">
    ${order.subtotal != null ? `<div><span>Subtotal</span><span>${formatPkr(order.subtotal)}</span></div>` : ""}
    ${Number(order.deliveryCharge || 0) > 0 ? `<div><span>Delivery</span><span>${formatPkr(order.deliveryCharge!)}</span></div>` : ""}
    <div class="grand"><span>TOTAL</span><span>${formatPkr(order.total)}</span></div>
    <div><span>Payment</span><span>${paymentLabel(order.paymentMethod)} · ${order.paymentStatus === "UNPAID" ? "Unpaid" : "Paid"}</span></div>
  </div>
  <p class="thanks">Thank you — enjoy your meal!</p>
  <div class="footer">
    ${cashier ? `Served by ${esc(cashier)} · ` : ""}Kitchen copy — ${esc(order.orderNumber)}
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

export function printReceipt(order: Order, store: ReceiptStore, cashier?: string) {
  const html = receiptHtml(order, store, cashier);
  const w = window.open("", "_blank", "width=400,height=720");
  if (!w) {
    alert("Allow pop-ups to print the receipt.");
    return false;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
