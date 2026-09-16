import { Router } from "express";
import fs from "fs";
import path from "path";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateInvoicePdf } from "../lib/invoice";

export const invoicesRouter = Router();

invoicesRouter.get("/:orderId/download", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { invoice: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const u = req.user!;
  const allowed = u.role === Role.ADMIN || order.customerId === u.id || order.riderId === u.id;
  if (!allowed) return res.status(403).json({ error: "Forbidden" });
  if (order.status !== "DELIVERED" && !order.invoice) {
    return res.status(400).json({ error: "Invoice is available after delivery." });
  }

  const invoice = order.invoice || (await generateInvoicePdf(order.id));
  if (!fs.existsSync(invoice.pdfPath)) {
    await generateInvoicePdf(order.id);
  }
  const fresh = await prisma.invoice.findUnique({ where: { orderId: order.id } });
  if (!fresh || !fs.existsSync(fresh.pdfPath)) {
    return res.status(500).json({ error: "Could not generate invoice." });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${path.basename(fresh.pdfPath)}"`
  );
  fs.createReadStream(fresh.pdfPath).pipe(res);
});
