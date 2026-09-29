import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { getStoreSettings } from "./settings-data";
import { storeNameFrom } from "./branding";
import { formatMoney } from "./money";

const INVOICE_DIR = path.join(__dirname, "../../invoices");

function money(n: number, settings?: { currencyCode?: string | null; currencySymbol?: string | null }) {
  return formatMoney(n, settings);
}

export async function generateInvoicePdf(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing && fs.existsSync(existing.pdfPath)) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });
  if (!order) throw new Error("Order not found");

  const settings = await getStoreSettings();
  const storeName = storeNameFrom(settings).toUpperCase();

  fs.mkdirSync(INVOICE_DIR, { recursive: true });
  const invoiceNumber = `INV-${order.orderNumber.replace(/^[A-Z]+-/, "")}`;
  const pdfPath = path.join(INVOICE_DIR, `${invoiceNumber}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.rect(0, 0, 595, 90).fill("#C2410C");
    doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text(storeName, 48, 28);
    doc.fontSize(11).font("Helvetica").text("Invoice", 48, 56);

    doc.fillColor("#1c1917").fontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 48, 120);
    doc.text(`Order #: ${order.orderNumber}`, 48, 136);
    doc.text(`Date: ${order.createdAt.toLocaleDateString("en-PK")}`, 48, 152);

    doc.font("Helvetica-Bold").text("Bill to", 340, 120);
    doc.font("Helvetica").text(order.customerName, 340, 136);
    doc.text(order.customerPhone, 340, 152);
    doc.text(order.fulfillmentType === "PICKUP" ? "Takeaway" : "Delivery", 340, 168);
    doc.text(order.deliveryAddress, 340, 184, { width: 200 });

    let y = 250;
    doc.rect(48, y, 500, 24).fill("#FFF7ED");
    doc.fillColor("#9A3412").font("Helvetica-Bold").fontSize(10);
    doc.text("Item", 56, y + 7);
    doc.text("Qty", 340, y + 7);
    doc.text("Price", 400, y + 7);
    doc.text("Amount", 480, y + 7);

    y += 32;
    doc.fillColor("#1c1917").font("Helvetica");
    for (const item of order.items) {
      const amount = Number(item.priceAtOrder) * item.quantity;
      doc.text(item.nameAtOrder, 56, y, { width: 270 });
      doc.text(String(item.quantity), 340, y);
      doc.text(money(Number(item.priceAtOrder), settings), 400, y);
      doc.text(money(amount, settings), 480, y);
      y += 22;
    }

    y += 12;
    doc.moveTo(48, y).lineTo(548, y).strokeColor("#FED7AA").stroke();
    y += 16;
    doc.font("Helvetica").fontSize(10).fillColor("#1c1917");
    doc.text("Subtotal", 400, y);
    doc.text(money(Number(order.subtotal), settings), 480, y);
    y += 18;
    if (Number(order.deliveryCharge) > 0) {
      doc.text("Delivery", 400, y);
      doc.text(money(Number(order.deliveryCharge), settings), 480, y);
      y += 18;
    }
    doc.font("Helvetica").fontSize(9).fillColor("#78716c");
    if (Number(order.taxAmount) > 0) {
      doc.text(settings.taxLabel || "Tax", 400, y);
      doc.text(money(Number(order.taxAmount), settings), 480, y);
      y += 18;
    }
    if (Number(order.serviceAmount) > 0) {
      doc.text(settings.serviceChargeLabel || "Service", 400, y);
      doc.text(money(Number(order.serviceAmount), settings), 480, y);
      y += 18;
    }
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#C2410C");
    doc.text("Total", 400, y);
    doc.text(money(Number(order.total), settings), 480, y);

    y += 48;
    doc.font("Helvetica").fontSize(9).fillColor("#78716c");
    const pay = order.paymentMethod === "CARD" ? "Card" : order.paymentMethod === "CASH" ? "Cash" : "Cash on delivery";
    doc.text(`Payment: ${pay}`, 48, y);
    if (settings.taxNumber) doc.text(`Tax no. ${settings.taxNumber}`, 48, y + 14);
    const footer = settings.receiptFooter.trim() || settings.footerText.trim() || `Thank you for ordering from ${storeNameFrom(settings)}.`;
    doc.text(footer, 48, y + (settings.taxNumber ? 28 : 14), { width: 500 });

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return prisma.invoice.upsert({
    where: { orderId },
    update: { pdfPath, invoiceNumber },
    create: { orderId, pdfPath, invoiceNumber },
  });
}
