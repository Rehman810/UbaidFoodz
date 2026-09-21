import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Step = { label: string; count: number; color: string; bg: string; ring: string };

export function PipelineFlow({ steps, active }: { steps: Step[]; active: number }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-stone-900">Live kitchen pipeline</h2>
          <p className="text-sm text-stone-500">{active} orders in progress right now</p>
        </div>
        <Link
          href="/admin/tracking"
          className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
        >
          Open board <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.label} className="relative">
            {i < steps.length - 1 && (
              <span className="absolute -right-1.5 top-1/2 z-10 hidden h-0.5 w-3 bg-stone-200 lg:block" aria-hidden />
            )}
            <div className={`rounded-2xl border p-4 ${s.bg} ring-1 ring-inset ${s.ring}`}>
              <div className="flex items-center justify-between">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step {i + 1}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{s.count}</p>
              <p className="mt-0.5 text-xs font-semibold text-stone-600">{s.label}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.color}`}
                  style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 12 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
