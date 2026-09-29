export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type TimezoneOption = {
  value: string;
  label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal" },
  { code: "OMR", symbol: "OMR", name: "Omani Rial" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "Asia/Karachi", label: "Pakistan — Karachi (PKT)" },
  { value: "Asia/Dubai", label: "UAE — Dubai (GST)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia — Riyadh" },
  { value: "Asia/Kolkata", label: "India — Kolkata (IST)" },
  { value: "Asia/Dhaka", label: "Bangladesh — Dhaka" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia — Kuala Lumpur" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Europe/London", label: "UK — London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe — Paris" },
  { value: "America/New_York", label: "US — Eastern" },
  { value: "America/Chicago", label: "US — Central" },
  { value: "America/Los_Angeles", label: "US — Pacific" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
];

export function currencyForCode(code: string | null | undefined): CurrencyOption | undefined {
  const normalized = (code || "PKR").trim().toUpperCase();
  return CURRENCY_OPTIONS.find((item) => item.code === normalized);
}

export function symbolForCode(code: string | null | undefined): string {
  const fromList = currencyForCode(code)?.symbol;
  if (fromList) return fromList;
  return (code || "Rs").trim() || "Rs";
}

export function timezoneOptions(current?: string | null): TimezoneOption[] {
  const value = (current || "Asia/Karachi").trim();
  if (!value || TIMEZONE_OPTIONS.some((item) => item.value === value)) {
    return TIMEZONE_OPTIONS;
  }
  return [{ value, label: `${value} (current)` }, ...TIMEZONE_OPTIONS];
}

export function currencyOptions(current?: string | null): CurrencyOption[] {
  const code = (current || "PKR").trim().toUpperCase();
  if (!code || CURRENCY_OPTIONS.some((item) => item.code === code)) {
    return CURRENCY_OPTIONS;
  }
  return [{ code, symbol: code, name: "Custom currency" }, ...CURRENCY_OPTIONS];
}
