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
import { Building2, MapPin, Phone, Plus, Save, X } from "lucide-react";

const CLOSE_MS = 340;

export type BranchFormData = {
  name: string;
  code: string;
  address: string;
  phone: string;
  isDefault: boolean;
};

export function BranchFormSheet({
  open,
  mode,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: BranchFormData;
  setForm: Dispatch<SetStateAction<BranchFormData>>;
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
        aria-label={mode === "create" ? "Add branch" : "Edit branch"}
        className={`drawer-panel relative flex h-full w-full max-w-[440px] flex-col rounded-l-2xl bg-white shadow-[-12px_0_48px_rgba(0,0,0,0.2)] dark:bg-stone-900 ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-1 shrink-0 rounded-tl-2xl bg-brand-500" />
        <header className="shrink-0 border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {mode === "create" ? "New outlet" : "Update outlet"}
              </p>
              <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-stone-900 dark:text-stone-50">
                <Building2 size={18} className="text-brand-600" />
                {mode === "create" ? "Add branch" : "Edit branch"}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Branch name
              </label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Gulberg outlet"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Short code
              </label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="gulberg (auto-generated from name if empty)"
              />
              <p className="mt-1 text-xs text-stone-400">Used in URLs and internal references. Lowercase, no spaces.</p>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                <MapPin size={12} /> Address
              </label>
              <textarea
                className="input min-h-[88px] resize-y"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, area, city"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                <Phone size={12} /> Phone
              </label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="03xx-xxxxxxx"
              />
              <p className="mt-1 text-xs text-stone-400">Shown on storefront pickup and order confirmations for this outlet.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              <span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">Default branch</span>
                <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                  Online takeaway and POS fallback when no branch is selected.
                </span>
              </span>
            </label>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}
          </div>
          <footer className="shrink-0 border-t border-stone-100 bg-stone-50/80 px-6 py-4 dark:border-stone-800 dark:bg-stone-900/80">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
              {saving ? "Saving…" : mode === "create" ? "Create branch" : "Save changes"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
