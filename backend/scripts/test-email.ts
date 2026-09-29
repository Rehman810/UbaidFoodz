import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { DEFAULT_STORE_NAME } from "../src/lib/branding";
import { passwordResetEmail } from "../src/lib/email-templates";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const user = (process.env.SMTP_USER || "").trim();
const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const to = (process.argv[2] || user).trim();

if (!user || !pass) {
  console.error("Set SMTP_USER and SMTP_PASS in backend/.env first.");
  process.exit(1);
}

const from =
  process.env.SMTP_FROM?.includes(user) ? process.env.SMTP_FROM : `${DEFAULT_STORE_NAME} <${user}>`;
const replyTo = (process.env.SMTP_REPLY_TO || user).trim();
const domain = user.split("@")[1] || "restaurant.local";

const sample = passwordResetEmail(
  { storeName: DEFAULT_STORE_NAME },
  "Test User",
  "https://example.com/reset-password?token=test"
);

console.log(`Testing SMTP as ${user} → ${to}…`);

const transport = nodemailer.createTransport({
  service: (process.env.SMTP_SERVICE || "gmail").trim().toLowerCase() === "gmail" ? "gmail" : undefined,
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user, pass },
});

transport
  .verify()
  .then(async () => {
    console.log("SMTP login OK.");
    await transport.sendMail({
      from,
      to,
      replyTo,
      subject: `${DEFAULT_STORE_NAME} — email template test`,
      html: sample.html,
      text: sample.text,
      headers: {
        "X-Mailer": "Restaurant-OS",
        "X-Priority": "3",
        Precedence: "auto",
      },
      messageId: `<${crypto.randomUUID()}@${domain}>`,
    });
    console.log(`Test email sent to ${to}`);
    console.log("\nSpam tips:");
    console.log("  • SMTP_FROM must use the same address as SMTP_USER (Gmail)");
    console.log("  • Use a Gmail App Password, not your normal password");
    console.log("  • For production, use your own domain + SPF/DKIM/DMARC");
  })
  .catch((err: { code?: string; response?: string }) => {
    console.error("\nSMTP failed:", err.code || err);
    if (err.code === "EAUTH") {
      console.error(`
Gmail rejected the App Password. Fix it like this:

1. Open https://myaccount.google.com/security
2. Turn ON "2-Step Verification" (required)
3. Open https://myaccount.google.com/apppasswords
4. Create a new App Password → choose "Mail" → generate
5. Copy the 16-character password (no spaces) into SMTP_PASS in backend/.env
6. Restart the API and run: npm run test:email

Do NOT use your normal Gmail password.
`);
    }
    process.exit(1);
  });
