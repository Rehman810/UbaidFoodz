import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const user = (process.env.SMTP_USER || "").trim();
const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const to = (process.argv[2] || user).trim();

if (!user || !pass) {
  console.error("Set SMTP_USER and SMTP_PASS in backend/.env first.");
  process.exit(1);
}

console.log(`Testing Gmail SMTP as ${user} (password length: ${pass.length})…`);

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

transport
  .verify()
  .then(async () => {
    console.log("SMTP login OK.");
    await transport.sendMail({
      from: process.env.SMTP_FROM || user,
      to,
      subject: "Ubaid Fast Foodz — SMTP test",
      text: "If you received this, order emails will work.",
    });
    console.log(`Test email sent to ${to}`);
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
