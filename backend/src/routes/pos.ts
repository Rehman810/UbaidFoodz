import { Router } from "express";
import {
  FulfillmentType,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { findOrderBlock } from "../lib/blocklist";
import { buildOrderLines, nextOrderNumber } from "../lib/order-lines";
import { emitOrderChange } from "../lib/realtime";
import { storeNameFrom } from "../lib/branding";
import { quoteCharges } from "../lib/charges";
import { cleanText } from "../lib/text";
import { getStoreSettings } from "../lib/settings-data";
import { branchScopeError, getDefaultBranchId, resolveBranchScope } from "../lib/branch-scope";
import { ADMIN_LIKE } from "../lib/roles";
import { requireAuth, requireRole } from "../middleware/auth";
import { posLimiter } from "../middleware/security";

export const posRouter = Router();

const include = {
  items: true,
  deliveryArea: { select: { id: true, name: true, deliveryCharge: true } },
  createdBy: { select: { id: true, name: true } },
};

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  return cleaned.length >= 10 ? cleaned : "";
}

posRouter.post("/", posLimiter, requireAuth, requireRole(...ADMIN_LIKE, Role.CASHIER), async (req, res) => {
  const storeSettings = await getStoreSettings();
  const storeAddress = `${storeNameFrom(storeSettings)} — ${storeSettings.address}`;

  const {
    items,
    deals,
    fulfillmentType,
    deliveryAreaId,
    deliveryAddress,
    customerName,
    customerPhone,
    notes,
    tableNumber,
    paymentMethod,
    paymentStatus,
  } = req.body as {
    items?: {
      menuItemId: string;
      quantity: number;
      sizeId?: string;
      optionIds?: string[];
      addonIds?: string[];
      instructions?: string;
    }[];
    deals?: { dealId: string; quantity: number }[];
    fulfillmentType?: FulfillmentType;
    deliveryAreaId?: string;
    deliveryAddress?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    tableNumber?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: "PAID" | "UNPAID";
  };

  const mode =
    fulfillmentType === FulfillmentType.DINE_IN
      ? FulfillmentType.DINE_IN
      : fulfillmentType === FulfillmentType.PICKUP
        ? FulfillmentType.PICKUP
        : FulfillmentType.DELIVERY;

  const built = await buildOrderLines(items ?? [], deals ?? []);
  if (!built.ok) return res.status(built.status).json({ error: built.error });

  let deliveryCharge = 0;
  let areaId: string | null = null;
  let address = storeAddress;

  if (mode === FulfillmentType.DELIVERY) {
    if (!deliveryAreaId) {
      return res.status(400).json({ error: "Select a delivery area for delivery orders." });
    }
    const area = await prisma.deliveryArea.findUnique({ where: { id: deliveryAreaId } });
    if (!area || !area.isDelivering) {
      return res.status(400).json({ error: "Selected area is not available." });
    }
    deliveryCharge = Number(area.deliveryCharge);
    areaId = area.id;
    address = String(deliveryAddress || "").trim() || storeAddress;
    if (
      storeSettings.freeDeliveryAbove != null &&
      built.subtotal >= Number(storeSettings.freeDeliveryAbove)
    ) {
      deliveryCharge = 0;
    }
  } else if (mode === FulfillmentType.DINE_IN) {
    address = tableNumber?.trim()
      ? `Dine-in · Table ${tableNumber.trim()}`
      : "Dine-in · Counter";
  } else {
    address = storeAddress;
  }

  const payMethod =
    paymentMethod === PaymentMethod.CARD ? PaymentMethod.CARD : PaymentMethod.CASH;
  if (payMethod === PaymentMethod.CARD && !storeSettings.acceptCard) {
    return res.status(400).json({ error: "Card at the counter is turned off." });
  }
  if (payMethod === PaymentMethod.CASH && !storeSettings.acceptCash) {
    return res.status(400).json({ error: "Cash is turned off." });
  }
  const payStatus = paymentStatus === "UNPAID" ? "UNPAID" : "PAID";

  const name = cleanText(customerName, 80) || "Walk-in";
  const phone = normalizePhone(String(customerPhone || ""));
  const quoted = quoteCharges(built.subtotal, deliveryCharge, storeSettings);

  const blocked = await findOrderBlock(null, phone || "");
  if (blocked) {
    return res.status(403).json({
      error: "This contact is blocked from ordering. Contact a manager.",
    });
  }

  let scope;
  try {
    scope = await resolveBranchScope(req);
  } catch (err) {
    return branchScopeError(res, err);
  }
  const resolvedBranchId = scope.allBranches ? await getDefaultBranchId() : scope.branchId!;

  const order = await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(),
      branchId: resolvedBranchId,
      orderSource: OrderSource.POS,
      createdById: req.user!.id,
      fulfillmentType: mode,
      deliveryAreaId: areaId,
      subtotal: built.subtotal,
      deliveryCharge,
      taxAmount: quoted.tax,
      serviceAmount: quoted.service,
      total: quoted.total,
      deliveryAddress: address,
      notes: notes ? cleanText(notes, 400) || null : null,
      tableNumber: mode === FulfillmentType.DINE_IN ? tableNumber?.trim() || null : null,
      customerName: name,
      customerPhone: phone,
      paymentMethod: payMethod,
      paymentStatus: payStatus,
      status: OrderStatus.CONFIRMED,
      items: { create: built.lines },
    },
    include,
  });

  emitOrderChange("order:created", order);
  res.status(201).json(order);
});

posRouter.get(
  "/receipt/:orderId",
  requireAuth,
  requireRole(...ADMIN_LIKE, Role.CASHIER),
  async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: true,
        deliveryArea: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.orderSource !== OrderSource.POS) {
      return res.status(403).json({ error: "Receipt is only available for POS orders." });
    }
    const settings = await getStoreSettings();
    res.json({
      order,
      store: {
        name: storeNameFrom(settings),
        phone: settings.phone,
        address: settings.address,
        whatsapp: settings.whatsapp,
        footer: settings.receiptFooter,
        taxNumber: settings.taxNumber,
      },
    });
  }
);
