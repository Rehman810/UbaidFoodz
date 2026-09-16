import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const INVOICE_DIR = path.join(__dirname, "../../invoices");

function money(n: number) {
  return `Rs ${n.toLocaleString("en-PK")}`;
}

export async function generateInvoicePdf(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing && fs.existsSync(existing.pdfPath)) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });
  if (!order) throw new Error("Order not found");

  fs.mkdirSync(INVOICE_DIR, { recursive: true });
  const invoiceNumber = `INV-${order.orderNumber.replace("UF-", "")}`;
  const pdfPath = path.join(INVOICE_DIR, `${invoiceNumber}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.rect(0, 0, 595, 90).fill("#C2410C");
    doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold").text("UBAID FAST FOODZ", 48, 28);
    doc.fontSize(11).font("Helvetica").text("Invoice", 48, 56);

    doc.fillColor("#1c1917").fontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 48, 120);
    doc.text(`Order #: ${order.orderNumber}`, 48, 136);
    doc.text(`Date: ${order.createdAt.toLocaleDateString("en-PK")}`, 48, 152);

    doc.font("Helvetica-Bold").text("Bill to", 340, 120);
    doc.font("Helvetica").text(order.customerName, 340, 136);
    doc.text(order.customerPhone, 340, 152);
    doc.text(order.deliveryAddress, 340, 168, { width: 200 });

    let y = 230;
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
      doc.text(money(Number(item.priceAtOrder)), 400, y);
      doc.text(money(amount), 480, y);
      y += 22;
    }

    y += 12;
    doc.moveTo(48, y).lineTo(548, y).strokeColor("#FED7AA").stroke();
    y += 16;
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#C2410C");
    doc.text("Total", 400, y);
    doc.text(money(Number(order.total)), 480, y);

    y += 48;
    doc.font("Helvetica").fontSize(9).fillColor("#78716c");
    doc.text("Payment: Cash on Delivery", 48, y);
    doc.text("Thank you for ordering from Ubaid Fast Foodz.", 48, y + 14);
    doc.text("This is a demo invoice generated for client presentation.", 48, y + 28);

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
