export function readCsrfFromDocument() {
  if (typeof document === "undefined") return "";
  const match = /(?:^|;\s*)ros_csrf=([^;]+)/.exec(document.cookie);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}
