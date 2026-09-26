import { StoreShell } from "@/components/StoreShell";

const FAQS = [
  {
    q: "Do I need an account to order?",
    a: "No. Guest checkout is available — just enter your name, phone and address.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Cash on delivery (COD) is available across all delivery areas.",
  },
  {
    q: "How do I track my order?",
    a: "After placing an order you will see a live status page. You can also visit Track order from the menu.",
  },
  {
    q: "What is the minimum order?",
    a: "Minimum order amount is shown in your cart and at checkout. It may change during promotions.",
  },
  {
    q: "Can I pick up instead of delivery?",
    a: "Yes. Choose Takeaway when prompted and collect from our restaurant location.",
  },
];

export default function FaqPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-4xl">FAQ</h1>
        <dl className="mt-8 space-y-6">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-2xl border border-orange-100 bg-white p-5">
              <dt className="font-semibold text-stone-900">{f.q}</dt>
              <dd className="mt-2 text-sm text-stone-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </StoreShell>
  );
}
