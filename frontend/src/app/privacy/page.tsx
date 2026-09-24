import { StoreShell } from "@/components/StoreShell";

export default function PrivacyPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl">Privacy policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            We collect your name, phone number and delivery address only to process and deliver your order.
            Guest orders are tracked with a secure token stored in your browser session.
          </p>
          <p>
            We do not sell your personal information. Order data is retained for kitchen operations and
            customer support. Staff accounts are protected with encrypted passwords.
          </p>
          <p>
            For questions about your data, contact us at the phone number listed on our website.
          </p>
        </div>
      </div>
    </StoreShell>
  );
}
