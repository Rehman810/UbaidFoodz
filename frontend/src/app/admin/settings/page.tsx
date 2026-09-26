"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  Clock,
  Facebook,
  ImageIcon,
  Instagram,
  Phone,
  Plus,
  Save,
  Settings,
  Share2,
  Trash2,
  Truck,
  Youtube,
} from "lucide-react";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";
import { TwoFactorSettings } from "@/components/admin/TwoFactorSettings";
import { SettingsField, SettingsSection } from "@/components/admin/SettingsSection";
import { api, apiUpload } from "@/lib/api";
import { isStoreOpen } from "@/lib/store-hours";
import { PromoBanner, StoreSettings } from "@/lib/types";

type SettingsPayload = { settings: StoreSettings; banners: PromoBanner[] };

const SOCIAL_FIELDS = [
  { key: "facebookUrl" as const, label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/..." },
  { key: "instagramUrl" as const, label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/..." },
  { key: "tiktokUrl" as const, label: "TikTok", icon: Share2, placeholder: "https://tiktok.com/..." },
  { key: "youtubeUrl" as const, label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/..." },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [bannerForm, setBannerForm] = useState({ title: "", imageUrl: "", linkUrl: "" });
  const [uploading, setUploading] = useState(false);

  async function load() {
    const data = await api<SettingsPayload>("/settings");
    setSettings(data.settings);
    setBanners(data.banners);
  }

  useEffect(() => {
    load().catch(() => setMsg("Could not load settings."));
  }, []);

  async function onSave(e?: FormEvent) {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/settings", { method: "PATCH", body: JSON.stringify(settings) });
      setMsg("Settings saved successfully.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onBannerUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await apiUpload("/upload", file);
      setBannerForm((f) => ({ ...f, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  }

  async function addBanner() {
    if (!bannerForm.imageUrl) return;
    await api("/settings/banners", {
      method: "POST",
      body: JSON.stringify(bannerForm),
    });
    setBannerForm({ title: "", imageUrl: "", linkUrl: "" });
    await load();
  }

  async function toggleBanner(b: PromoBanner) {
    await api(`/settings/banners/${b.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    load();
  }

  async function removeBanner(id: string) {
    if (!confirm("Delete this banner?")) return;
    await api(`/settings/banners/${id}`, { method: "DELETE" });
    load();
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-36 rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="skeleton h-72 rounded-3xl" />
        </div>
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  const storeOpen = isStoreOpen(settings);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-brand-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-300">
              <Settings size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Configuration</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl">Store settings</h1>
            <p className="mt-2 max-w-lg text-sm text-stone-300">
              Contact details, delivery rules, opening hours, and homepage banners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                storeOpen ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${storeOpen ? "bg-emerald-400" : "bg-amber-400"}`} />
              {storeOpen ? "Storefront open" : "Storefront closed"}
            </span>
            <button
              type="button"
              onClick={() => onSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-stone-900 transition hover:bg-brand-50 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save all"}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            msg.includes("failed") || msg.includes("Could not")
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {msg}
        </p>
      )}

      <TwoFactorSettings />

      <form onSubmit={onSave} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsSection
            icon={Phone}
            title="Contact"
            description="Shown on the storefront, footer, and order receipts."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Phone">
                <input
                  className="input"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </SettingsField>
              <SettingsField label="WhatsApp" hint="Digits only, with country code">
                <input
                  className="input"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                />
              </SettingsField>
            </div>
            <SettingsField label="Address">
              <input
                className="input"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </SettingsField>
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Latitude">
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={settings.latitude ?? ""}
                  onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
                />
              </SettingsField>
              <SettingsField label="Longitude">
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={settings.longitude ?? ""}
                  onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
                />
              </SettingsField>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Truck}
            title="Orders & delivery"
            description="Minimums, free delivery threshold, and time estimates."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsField label="Minimum order (Rs)">
                <input
                  className="input"
                  type="number"
                  value={settings.minimumOrder}
                  onChange={(e) => setSettings({ ...settings, minimumOrder: e.target.value })}
                />
              </SettingsField>
              <SettingsField label="Free delivery above (Rs)">
                <input
                  className="input"
                  type="number"
                  value={settings.freeDeliveryAbove ?? ""}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryAbove: e.target.value || null })}
                />
              </SettingsField>
              <SettingsField label="Delivery estimate (min)">
                <input
                  className="input"
                  type="number"
                  value={settings.deliveryEstimateMin}
                  onChange={(e) => setSettings({ ...settings, deliveryEstimateMin: Number(e.target.value) })}
                />
              </SettingsField>
              <SettingsField label="Takeaway estimate (min)">
                <input
                  className="input"
                  type="number"
                  value={settings.pickupEstimateMin}
                  onChange={(e) => setSettings({ ...settings, pickupEstimateMin: Number(e.target.value) })}
                />
              </SettingsField>
            </div>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                settings.autoConfirmOrders
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-600"
                checked={settings.autoConfirmOrders}
                onChange={(e) => setSettings({ ...settings, autoConfirmOrders: e.target.checked })}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Confirm orders instantly</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {settings.autoConfirmOrders
                    ? "New orders go straight to the kitchen. Customers get a confirmation email immediately."
                    : "New orders wait for your call. Use Confirm on the order after you verify by phone."}
                </p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                settings.autoAssignRiders
                  ? "border-violet-300 bg-violet-50"
                  : "border-stone-200 bg-stone-50"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-600"
                checked={settings.autoAssignRiders ?? true}
                onChange={(e) => setSettings({ ...settings, autoAssignRiders: e.target.checked })}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Auto-assign riders</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {settings.autoAssignRiders ?? true
                    ? "When an order goes out for delivery, the least-busy rider is assigned automatically."
                    : "Pick a rider manually from the order panel before dispatching."}
                </p>
              </div>
            </label>
          </SettingsSection>
        </div>

        <SettingsSection
          icon={Clock}
          title="Hours & availability"
          description="When customers can order. Times are in Karachi (PKT)."
        >
          <OpeningHoursEditor
            settings={settings}
            onChange={(patch) => setSettings({ ...settings, ...patch })}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <SettingsField label="Closed message" hint="Shown on the storefront when you're closed">
              <textarea
                className="input min-h-24 resize-none"
                value={settings.closedMessage}
                onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })}
              />
            </SettingsField>

            <div className="flex flex-col justify-center">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  settings.forceClosed
                    ? "border-amber-300 bg-amber-50"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                  checked={settings.forceClosed}
                  onChange={(e) => setSettings({ ...settings, forceClosed: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-semibold text-stone-900">Force closed</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    Override opening hours and block all orders until you turn this off.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Share2}
          title="Social links"
          description="Optional links shown in the storefront footer."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <SettingsField key={key} label={label}>
                <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                  <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                    <Icon size={16} />
                  </span>
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                    placeholder={placeholder}
                    value={settings[key]}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  />
                </div>
              </SettingsField>
            ))}
          </div>
        </SettingsSection>
      </form>

      <SettingsSection
        icon={ImageIcon}
        title="Promo banners"
        description="Hero carousel images on the homepage. Up to 3 slots are used."
      >
        {banners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
            <ImageIcon size={28} className="mx-auto text-stone-300" />
            <p className="mt-2 text-sm font-medium text-stone-600">No banners yet</p>
            <p className="text-xs text-stone-400">Add your first promo image below</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {banners.map((b) => (
              <li
                key={b.id}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-brand-200 hover:shadow-sm"
              >
                <div className="relative aspect-[16/7] bg-stone-100">
                  {b.imageUrl ? (
                    <Image src={b.imageUrl} alt={b.title || "Banner"} fill className="object-cover" sizes="400px" />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      b.isActive ? "bg-emerald-500 text-white" : "bg-stone-800/70 text-white"
                    }`}
                  >
                    {b.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">{b.title || "Untitled banner"}</p>
                    <p className="truncate text-xs text-stone-500">{b.linkUrl || "No link"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBanner(b)}
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                  >
                    {b.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBanner(b.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete banner"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-2xl border border-dashed border-brand-200 bg-[#fffaf5] p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-stone-800">Add new banner</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsField label="Title (optional)">
              <input
                className="input"
                placeholder="e.g. Biryani night"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              />
            </SettingsField>
            <SettingsField label="Link URL (optional)">
              <input
                className="input"
                placeholder="/menu or https://..."
                value={bannerForm.linkUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
              />
            </SettingsField>
          </div>
          <SettingsField label="Banner image" className="mt-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input flex-1"
                placeholder="Paste image URL or upload"
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              />
              <label className="btn-ghost shrink-0 cursor-pointer justify-center">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onBannerUpload(e.target.files[0])}
                />
              </label>
            </div>
          </SettingsField>
          {bannerForm.imageUrl && (
            <div className="relative mt-3 aspect-[16/7] max-h-40 overflow-hidden rounded-xl border border-stone-200">
              <Image src={bannerForm.imageUrl} alt="Preview" fill className="object-cover" sizes="600px" />
            </div>
          )}
          <button
            type="button"
            className="btn-primary mt-4 w-full sm:w-auto"
            onClick={addBanner}
            disabled={!bannerForm.imageUrl}
          >
            <Plus size={16} /> Add banner
          </button>
        </div>
      </SettingsSection>

      {/* Sticky save bar */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4 lg:bottom-6 lg:left-72">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="hidden text-sm text-stone-500 sm:block">Changes apply to the live storefront after saving.</p>
          <button
            type="button"
            onClick={() => onSave()}
            disabled={saving}
            className="btn-primary ml-auto shrink-0"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
