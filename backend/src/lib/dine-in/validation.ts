const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeGuestEmail(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v || !EMAIL_RE.test(v)) return null;
  return v;
}

/** Pakistan mobile: 03XXXXXXXXX or +923XXXXXXXXX */
export function normalizeGuestPhone(raw: unknown): string | null {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.startsWith("3") && digits.length === 10) digits = `0${digits}`;
  if (/^03\d{9}$/.test(digits)) return digits;
  return null;
}

export function isLegacyPlaceholderEmail(email: string) {
  return email === "legacy-missing@invalid.local" || email.endsWith("@invalid.local");
}
