export type MoneySettings = {
  currencyCode?: string | null;
  currencySymbol?: string | null;
};

const ZERO_DECIMAL = new Set(["PKR", "JPY", "KRW", "VND", "CLP"]);

export function fractionDigits(code?: string | null) {
  const c = (code || "PKR").toUpperCase();
  return ZERO_DECIMAL.has(c) ? 0 : 2;
}

/** Integer minor units (cents/paisa) from a decimal string or number, without binary float drift. */
export function toMinorUnits(value: string | number, scale = 2): number {
  const raw = typeof value === "number" ? value.toFixed(scale) : String(value).trim();
  const negative = raw.startsWith("-");
  const [wholeRaw, fracRaw = ""] = raw.replace("-", "").split(".");
  const whole = parseInt(wholeRaw || "0", 10) || 0;
  const frac = (fracRaw.replace(/\D/g, "") + "0".repeat(scale)).slice(0, scale);
  const minor = whole * 10 ** scale + (parseInt(frac || "0", 10) || 0);
  return negative ? -minor : minor;
}

export function formatMoney(value: string | number | null | undefined, settings?: MoneySettings) {
  const code = (settings?.currencyCode || "PKR").toUpperCase();
  const symbol = (settings?.currencySymbol || "Rs").trim() || "Rs";
  const digits = fractionDigits(code);
  const minor = toMinorUnits(value ?? 0, 2);
  const factor = 10 ** (2 - digits);
  const roundedMinor = Math.round(minor / factor) * factor;
  const major = roundedMinor / 100;
  const formatted = major.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${symbol} ${formatted}`;
}
