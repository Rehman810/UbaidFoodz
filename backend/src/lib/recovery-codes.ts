import { createHash, randomBytes, timingSafeEqual } from "crypto";

function hashCode(code: string) {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

export function createRecoveryCodes(count = 8) {
  const plain = Array.from({ length: count }, () => {
    const raw = randomBytes(4).toString("hex");
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
  return { plain, stored: JSON.stringify(plain.map(hashCode)) };
}

export function matchRecoveryCode(stored: string | null | undefined, code: string) {
  if (!stored || !code.trim()) return { ok: false as const, remaining: stored ?? null };
  let hashes: string[] = [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) hashes = parsed.filter((item) => typeof item === "string");
  } catch {
    return { ok: false as const, remaining: stored };
  }
  const digest = hashCode(code);
  const digestBuf = Buffer.from(digest);
  const index = hashes.findIndex((hash) => {
    const buf = Buffer.from(hash);
    return buf.length === digestBuf.length && timingSafeEqual(buf, digestBuf);
  });
  if (index < 0) return { ok: false as const, remaining: stored };
  const next = hashes.filter((_, i) => i !== index);
  return { ok: true as const, remaining: JSON.stringify(next) };
}
