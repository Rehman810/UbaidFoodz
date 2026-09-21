"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Bike, X } from "lucide-react";

const CLOSE_MS = 340;

export type RiderFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export function RiderFormSheet({
  open,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: RiderFormData;
  setForm: Dispatch<SetStateAction<RiderFormData>>;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    setVisible(false);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setClosing(false);
    document.body.style.overflow = "hidden";
    const r1 = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(r1);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-hidden={closing}>
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className={`drawer-backdrop absolute inset-0 bg-stone-950/60 backdrop-blur-[4px] ${
          visible && !closing ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`drawer-panel relative flex h-full w-full max-w-[440px] flex-col rounded-l-2xl bg-white shadow-[-12px_0_48px_rgba(0,0,0,0.2)] ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-1 shrink-0 rounded-tl-2xl bg-violet-500" />
        <header className="shrink-0 border-b border-stone-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Fleet management</p>
              <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-stone-900">
                <Bike size={18} className="text-violet-600" />
                Add rider
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Full name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Hassan Rider"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Email (login)</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                placeholder="rider@ubaidfastfoodz.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="03xx-xxxxxxx"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank for demo123"
              />
              <p className="mt-1 text-xs text-stone-400">
                Rider uses this email and password to sign in and see assigned deliveries.
              </p>
            </div>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          </div>

          <footer className="shrink-0 border-t border-stone-100 bg-stone-50/80 px-6 py-4">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Creating…" : "Create rider"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
