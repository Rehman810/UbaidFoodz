function toMinor(value: string | number) {
  const raw = typeof value === "number" ? value.toFixed(2) : String(value).trim();
  const negative = raw.startsWith("-");
  const [wholeRaw, fracRaw = ""] = raw.replace("-", "").split(".");
  const whole = parseInt(wholeRaw || "0", 10) || 0;
  const frac = (fracRaw.replace(/\D/g, "") + "00").slice(0, 2);
  const minor = whole * 100 + (parseInt(frac || "0", 10) || 0);
  return negative ? -minor : minor;
}

export type ChargeSettings = {
  taxPercent?: unknown;
  taxLabel?: string | null;
  taxIncluded?: boolean | null;
  serviceChargePercent?: unknown;
  serviceChargeLabel?: string | null;
  serviceIncluded?: boolean | null;
};

function percentMinor(baseMinor: number, percent: number) {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.round((baseMinor * percent) / 100);
}

function includedMinor(baseMinor: number, percent: number) {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  const net = Math.round(baseMinor / (1 + percent / 100));
  return baseMinor - net;
}

export function quoteCharges(subtotal: string | number, delivery: string | number, settings: ChargeSettings) {
  const subtotalMinor = toMinor(subtotal);
  const deliveryMinor = toMinor(delivery);
  const taxPercent = Number(settings.taxPercent ?? 0);
  const servicePercent = Number(settings.serviceChargePercent ?? 0);
  const taxMinor = settings.taxIncluded
    ? includedMinor(subtotalMinor, taxPercent)
    : percentMinor(subtotalMinor, taxPercent);
  const serviceMinor = settings.serviceIncluded
    ? includedMinor(subtotalMinor, servicePercent)
    : percentMinor(subtotalMinor, servicePercent);
  const added = (settings.taxIncluded ? 0 : taxMinor) + (settings.serviceIncluded ? 0 : serviceMinor);
  return {
    tax: taxMinor / 100,
    service: serviceMinor / 100,
    total: (subtotalMinor + deliveryMinor + added) / 100,
  };
}
