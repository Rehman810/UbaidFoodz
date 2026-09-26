import path from "path";
import dotenv from "dotenv";
import { formatWhatsAppNumber, verifyWhatsAppConfig } from "../src/lib/whatsapp";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run test:whatsapp -- 923001234567");
  process.exit(1);
}

async function main() {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error("Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env");
    process.exit(1);
  }

  console.log("Checking Meta API connection…");
  const ok = await verifyWhatsAppConfig();
  if (!ok) process.exit(1);

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const recipient = formatWhatsAppNumber(to);
  const template = process.env.WHATSAPP_TEMPLATE_ORDER || "hello_world";
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

  console.log(`Sending template "${template}" to ${recipient}…`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: { name: template, language: { code: lang } },
      }),
    });
  } catch (err) {
    console.error("\nNetwork error — could not reach graph.facebook.com.");
    console.error("Try: curl -I https://graph.facebook.com");
    console.error("If that fails, check firewall/VPN or use a different network.\n");
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();
  if (!res.ok) {
    console.error("Send failed:", JSON.stringify(data, null, 2));
    const code = data?.error?.code;
    if (code === 131030) {
      console.error(`
Recipient not whitelisted (test mode).

Fix in Meta DEVELOPERS (not WhatsApp Manager):
  1. developers.facebook.com → My Apps → your app
  2. WhatsApp → API Setup
  3. Under "Send and receive messages" → click "Manage phone number list"
  4. Add: ${recipient}  (must match your real WhatsApp number)
  5. Enter the verification code WhatsApp sends you
  6. Re-run: npm run test:whatsapp -- ${recipient}

You tried: ${recipient}
Format: country code + number, no + or leading 0 (Pakistan: 92XXXXXXXXXX)
`);
    }
    if (code === 100) {
      console.error("\nTip: Add your phone as a test recipient in Meta → WhatsApp → API Setup.");
    }
    if (code === 132000) {
      console.error(`\nTip: Create and approve the "${template}" template in WhatsApp Manager.`);
    }
    process.exit(1);
  }
  console.log("Test message queued:", data);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
