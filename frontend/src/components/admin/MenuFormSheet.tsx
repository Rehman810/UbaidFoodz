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
import {
  Check,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { AdminSelect } from "./AdminSelect";

const CLOSE_MS = 340;

function DishImage({ src, alt }: { src: string; alt: string }) {
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

export type SizeRow = { name: string; price: string };
export type AddonRow = { name: string; price: string };

export type MenuFormData = {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  sizes: SizeRow[];
  addons: AddonRow[];
};

export function MenuFormSheet({
  open,
  editingId,
  form,
  setForm,
  categories,
  saving,
  uploading,
  uploadError,
  onClose,
  onSubmit,
  onImagePick,
}: {
  open: boolean;
  editingId: string | null;
  form: MenuFormData;
  setForm: Dispatch<SetStateAction<MenuFormData>>;
  categories: string[];
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

    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

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
        aria-label="Close form"
        onClick={close}
        className={`drawer-backdrop absolute inset-0 bg-stone-950/60 backdrop-blur-[4px] ${
          visible && !closing ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={editingId ? "Edit dish" : "Add new dish"}
        className={`drawer-panel relative flex h-full w-full max-w-[440px] flex-col rounded-l-2xl bg-white shadow-[-12px_0_48px_rgba(0,0,0,0.2)] ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-1 shrink-0 rounded-tl-2xl bg-brand-500" />

        <header className="shrink-0 border-b border-stone-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-stone-500">
                {editingId ? "Edit menu item" : "New menu item"}
              </p>
              <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-stone-900">
                {editingId ? (
                  <>
                    <Pencil size={18} className="text-brand-600" /> Edit dish
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-brand-600" /> Add dish
                  </>
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Dish photo</label>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                {form.imageUrl ? (
                  <DishImage src={form.imageUrl} alt="Preview" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-stone-400">
                    <div className="text-center">
                      <ImageIcon size={32} className="mx-auto opacity-50" />
                      <p className="mt-2 text-sm">No image yet</p>
                    </div>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
                    <Loader2 size={28} className="animate-spin text-brand-600" />
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImagePick}
              />

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Upload image
                    </>
                  )}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="rounded-xl border border-stone-200 px-3 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
              <p className="mt-2 text-[11px] text-stone-400">JPG, PNG, WebP or GIF · max 5 MB</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700">
                  Or paste image URL
                </summary>
                <input
                  className="input mt-2"
                  placeholder="https://…"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
              </details>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Dish name</label>
              <input
                className="input"
                placeholder="e.g. Karachi Chicken Biryani"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Description</label>
              <textarea
                className="input min-h-[96px] resize-none"
                placeholder="Short description for the menu"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-500">Price (PKR)</label>
                <input
                  className="input"
                  placeholder="0"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-500">Sale price (optional)</label>
                <input
                  className="input"
                  placeholder="Discount"
                  type="number"
                  min={0}
                  value={form.discountPrice}
                  onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-stone-500">Sizes (optional)</label>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => setForm((f) => ({ ...f, sizes: [...f.sizes, { name: "", price: "" }] }))}
                >
                  + Add size
                </button>
              </div>
              {form.sizes.map((row, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Name"
                    value={row.name}
                    onChange={(e) =>
                      setForm((f) => {
                        const sizes = [...f.sizes];
                        sizes[i] = { ...sizes[i], name: e.target.value };
                        return { ...f, sizes };
                      })
                    }
                  />
                  <input
                    className="input w-24"
                    placeholder="Rs"
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      setForm((f) => {
                        const sizes = [...f.sizes];
                        sizes[i] = { ...sizes[i], price: e.target.value };
                        return { ...f, sizes };
                      })
                    }
                  />
                  <button
                    type="button"
                    className="text-stone-400"
                    onClick={() => setForm((f) => ({ ...f, sizes: f.sizes.filter((_, j) => j !== i) }))}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-stone-500">Add-ons (optional)</label>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => setForm((f) => ({ ...f, addons: [...f.addons, { name: "", price: "" }] }))}
                >
                  + Add addon
                </button>
              </div>
              {form.addons.map((row, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Name"
                    value={row.name}
                    onChange={(e) =>
                      setForm((f) => {
                        const addons = [...f.addons];
                        addons[i] = { ...addons[i], name: e.target.value };
                        return { ...f, addons };
                      })
                    }
                  />
                  <input
                    className="input w-24"
                    placeholder="Rs"
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      setForm((f) => {
                        const addons = [...f.addons];
                        addons[i] = { ...addons[i], price: e.target.value };
                        return { ...f, addons };
                      })
                    }
                  />
                  <button
                    type="button"
                    className="text-stone-400"
                    onClick={() => setForm((f) => ({ ...f, addons: f.addons.filter((_, j) => j !== i) }))}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <AdminSelect
              label="Category"
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={categories.map((c) => ({ value: c, label: c }))}
              minWidth="min-w-full"
            />

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${
                form.isAvailable
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-stone-200 bg-stone-50 text-stone-600"
              }`}
            >
              <span className="flex items-center gap-2">
                {form.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                {form.isAvailable ? "Visible on menu" : "Hidden (sold out)"}
              </span>
              <span
                className={`grid h-5 w-5 place-items-center rounded-full ${
                  form.isAvailable ? "bg-emerald-500 text-white" : "bg-stone-300 text-white"
                }`}
              >
                {form.isAvailable && <Check size={12} />}
              </span>
            </button>
          </div>

          <footer className="shrink-0 border-t border-stone-100 bg-stone-50/80 px-6 py-4">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : editingId ? "Save changes" : "Add dish"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
