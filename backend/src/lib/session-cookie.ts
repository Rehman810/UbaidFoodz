const WEEK_SECONDS = 7 * 24 * 60 * 60;

export function sessionCookie(token: string, secure: boolean) {
  const parts = [
    `ros_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${WEEK_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure: boolean) {
  const parts = ["ros_session=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function cookieSecure(protoHeader: string | undefined) {
  if (process.env.NODE_ENV === "production") return true;
  return protoHeader === "https";
}

export function readSessionCookie(header: string | undefined) {
  if (!header) return null;
  const match = /(?:^|;\s*)ros_session=([^;]+)/.exec(header);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
