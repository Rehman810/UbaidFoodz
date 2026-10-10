import { randomBytes } from "crypto";

let processSecret: string | undefined;

/** Never hardcode a signing secret. Production must set JWT_SECRET. */
export function jwtSecret() {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) {
    if (fromEnv.length < 32) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be at least 32 characters");
      }
      console.warn(
        "[security] JWT_SECRET is shorter than 32 characters. For production run: openssl rand -hex 32"
      );
    }
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required");
  }
  if (!processSecret) {
    processSecret = randomBytes(32).toString("hex");
    console.warn("[security] JWT_SECRET is not set. Using a process-local secret; sessions reset on restart.");
  }
  return processSecret;
}
