"use client";

import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { pkr } from "@/lib/format";
import { AdminSelect } from "./AdminSelect";

const CLOSE_MS = 340;

export type DealFormData = {
  title: string;
  description: string;
  dealPrice: string;
  imageUrl: string;
  isActive: boolean;
  items: { menuItemId: string; quantity: number }[];
};

function DealImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-stone-100 text-stone-400">
        <ImageIcon size={28} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function DealFormSheet({
  open,
  editingId,
  form,
  setForm,
  menuItems,
  saving,
  uploading,
  uploadError,
  onClose,
  onSubmit,
  onImagePick,
}: {
  open: boolean;
  editingId: string | null;
  form: DealFormData;
  setForm: Dispatch<SetStateAction<DealFormData>>;
  menuItems: MenuItem[];
  saving: boolean;
  uploading: boolean;
  uploadError: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onImagePick: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const dishOptions = menuItems.map((m) => ({
    value: m.id,
    label: `${m.name} — ${pkr(m.price)}`,
  }));

  const regularTotal = form.items.reduce((sum, row) => {
    const item = menuItems.find((m) => m.id === row.menuItemId);
    return sum + (item ? Number(item.price) * row.quantity : 0);
  }, 0);

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
        className={`drawer-panel relative flex h-full w-full max-w-[480px] flex-col rounded-l-2xl bg-white shadow-[-12px_0_48px_rgba(0,0,0,0.2)] ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-1 shrink-0 rounded-tl-2xl bg-violet-500" />
        <header className="shrink-0 border-b border-stone-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-stone-500">{editingId ? "Edit deal" : "New deal"}</p>
              <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-stone-900">
                <Sparkles size={18} className="text-violet-600" />
                {editingId ? "Edit combo deal" : "Create combo deal"}
              </h2>
            </div>
            <button type="button" onClick={close} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100">
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Deal image</label>
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                {form.imageUrl ? <DealImage src={form.imageUrl} alt="Deal" /> : (
                  <div className="absolute inset-0 grid place-items-center text-stone-400">
                    <ImageIcon size={32} className="opacity-50" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-white/80">
                    <Loader2 size={28} className="animate-spin text-brand-600" />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:border-brand-300"
              >
                <Upload size={16} /> Upload image
              </button>
              {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Deal title</label>
              <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Family Feast" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Description</label>
              <textarea className="input min-h-[72px] resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's included in this deal?" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Deal price (PKR)</label>
              <input className="input" type="number" min={0} value={form.dealPrice} onChange={(e) => setForm((f) => ({ ...f, dealPrice: e.target.value }))} required />
              {regularTotal > 0 && form.dealPrice && (
                <p className="mt-1 text-xs text-stone-500">
                  Regular price {pkr(regularTotal)} · Save {pkr(Math.max(0, regularTotal - Number(form.dealPrice)))}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-stone-500">Items in deal</label>
                <button
                  type="button"
                  disabled={menuItems.length === 0}
                  onClick={() => setForm((f) => ({ ...f, items: [...f.items, { menuItemId: menuItems[0]?.id || "", quantity: 1 }] }))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} /> Add item
                </button>
              </div>
              {menuItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-center text-xs text-stone-500">
                  Add dishes to the menu first, then include them in a deal.
                </p>
              ) : (
              <ul className="space-y-2">
                {form.items.map((row, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-[minmax(0,1fr)_3.5rem_2.5rem] items-center gap-2"
                  >
                    <div className="min-w-0">
                      <AdminSelect
                        className="w-full"
                        minWidth="w-full"
                        value={row.menuItemId}
                        onChange={(menuItemId) =>
                          setForm((f) => ({
                            ...f,
                            items: f.items.map((r, i) => (i === idx ? { ...r, menuItemId } : r)),
                          }))
                        }
                        options={dishOptions}
                        placeholder="Select dish…"
                        aria-label={`Deal item ${idx + 1}`}
                      />
                    </div>
                    <input
                      type="number"
                      min={1}
                      className="input w-full py-2 text-center text-sm text-stone-800"
                      value={row.quantity}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          items: f.items.map((r, i) => (i === idx ? { ...r, quantity: Number(e.target.value) || 1 } : r)),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                      className="grid h-10 w-10 place-items-center rounded-xl text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
                form.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-stone-50 text-stone-600"
              }`}
            >
              <span>{form.isActive ? "Active on storefront" : "Hidden from customers"}</span>
              {form.isActive && <Check size={16} />}
            </button>
          </div>
          <footer className="shrink-0 border-t border-stone-100 bg-stone-50/80 px-6 py-4">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : editingId ? "Save deal" : "Create deal"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
