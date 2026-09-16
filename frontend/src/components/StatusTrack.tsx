import { OrderStatus, STATUS_FLOW, STATUS_LABEL } from "@/lib/types";

export function StatusTrack({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-medium text-stone-600">
        This order was cancelled.
      </div>
    );
  }
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="text-center">
            <div className={`mx-auto h-1.5 rounded-full ${done ? "bg-brand-600" : "bg-stone-200"}`} />
            <p className={`mt-2 text-[11px] font-semibold ${done ? "text-brand-800" : "text-stone-400"}`}>
              {STATUS_LABEL[s]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
