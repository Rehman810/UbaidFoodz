import { API_URL } from "./api";

/** Turn stored image paths into URLs the browser can load. */
export function resolveMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/uploads/")) {
    if (API_URL.startsWith("/")) {
      return `${API_URL.replace(/\/$/, "")}${trimmed}`;
    }
    return `${API_URL.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

export function isLocalPublicAsset(url: string) {
  const resolved = resolveMediaUrl(url);
  return resolved.startsWith("/") && !resolved.startsWith("/uploads");
}
