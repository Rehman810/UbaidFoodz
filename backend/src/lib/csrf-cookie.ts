import crypto from "crypto";

const CSRF_COOKIE = "ros_csrf";
const DAY_SECONDS = 24 * 60 * 60;

export function issueCsrfCookie(res: import("express").Response, secure: boolean) {
  const token = crypto.randomBytes(32).toString("hex");
  const parts = [
    `${CSRF_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${DAY_SECONDS}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
  return token;
}

export function readCsrfCookie(header: string | undefined) {
  if (!header) return null;
  const match = new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`).exec(header);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function clearCsrfCookie(secure: boolean) {
  const parts = [`${CSRF_COOKIE}=`, "Path=/", "Max-Age=0", "SameSite=Lax"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
