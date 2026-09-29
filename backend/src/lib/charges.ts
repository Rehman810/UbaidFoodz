import { toMinorUnits } from "./money";

export type ChargeSettings = {
  taxPercent?: unknown;
  taxIncluded?: boolean | null;
  serviceChargePercent?: unknown;
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

export function quoteCharges(
  subtotal: string | number,
  delivery: string | number,
  settings: ChargeSettings
) {
  const subtotalMinor = toMinorUnits(subtotal);
  const deliveryMinor = toMinorUnits(delivery);
  const taxPercent = Number(settings.taxPercent ?? 0);
  const servicePercent = Number(settings.serviceChargePercent ?? 0);
  const taxMinor = settings.taxIncluded
    ? includedMinor(subtotalMinor, taxPercent)
    : percentMinor(subtotalMinor, taxPercent);
  const serviceMinor = settings.serviceIncluded
    ? includedMinor(subtotalMinor, servicePercent)
    : percentMinor(subtotalMinor, servicePercent);
  const added =
    (settings.taxIncluded ? 0 : taxMinor) + (settings.serviceIncluded ? 0 : serviceMinor);
  return {
    tax: taxMinor / 100,
    service: serviceMinor / 100,
    total: (subtotalMinor + deliveryMinor + added) / 100,
  };
}
