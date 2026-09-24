"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageIcon, Plus, Settings, Trash2 } from "lucide-react";
import { api, apiUpload } from "@/lib/api";
import { PromoBanner, StoreSettings } from "@/lib/types";

type SettingsPayload = { settings: StoreSettings; banners: PromoBanner[] };

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

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/settings", { method: "PATCH", body: JSON.stringify(settings) });
      setMsg("Settings saved.");
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
    return <div className="skeleton h-96 rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-brand-700">
          <Settings size={20} />
          <h1 className="font-display text-3xl">Store settings</h1>
        </div>
        <p className="mt-1 text-sm text-stone-500">Hours, contact, delivery rules and promo banners.</p>
      </div>

      {msg && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>
      )}

      <form onSubmit={onSave} className="card space-y-5 p-6">
        <h2 className="font-semibold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Phone</label>
            <input className="input" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">WhatsApp (digits only)</label>
            <input className="input" value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Address</label>
          <input className="input" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Latitude</label>
            <input className="input" type="number" step="any" value={settings.latitude ?? ""} onChange={(e) => setSettings({ ...settings, latitude: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Longitude</label>
            <input className="input" type="number" step="any" value={settings.longitude ?? ""} onChange={(e) => setSettings({ ...settings, longitude: e.target.value })} />
          </div>
        </div>

        <h2 className="font-semibold pt-2">Orders & delivery</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Minimum order (Rs)</label>
            <input className="input" type="number" value={settings.minimumOrder} onChange={(e) => setSettings({ ...settings, minimumOrder: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Free delivery above (Rs)</label>
            <input className="input" type="number" value={settings.freeDeliveryAbove ?? ""} onChange={(e) => setSettings({ ...settings, freeDeliveryAbove: e.target.value || null })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Delivery estimate (min)</label>
            <input className="input" type="number" value={settings.deliveryEstimateMin} onChange={(e) => setSettings({ ...settings, deliveryEstimateMin: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Pickup estimate (min)</label>
            <input className="input" type="number" value={settings.pickupEstimateMin} onChange={(e) => setSettings({ ...settings, pickupEstimateMin: Number(e.target.value) })} />
          </div>
        </div>

        <h2 className="font-semibold pt-2">Opening hours (Karachi)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Open hour (0–23)</label>
            <input className="input" type="number" min={0} max={23} value={settings.openHour} onChange={(e) => setSettings({ ...settings, openHour: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Open minute</label>
            <input className="input" type="number" min={0} max={59} value={settings.openMinute} onChange={(e) => setSettings({ ...settings, openMinute: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Close hour (0–23)</label>
            <input className="input" type="number" min={0} max={23} value={settings.closeHour} onChange={(e) => setSettings({ ...settings, closeHour: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Close minute</label>
            <input className="input" type="number" min={0} max={59} value={settings.closeMinute} onChange={(e) => setSettings({ ...settings, closeMinute: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Closed message</label>
          <textarea className="input min-h-20" value={settings.closedMessage} onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.forceClosed} onChange={(e) => setSettings({ ...settings, forceClosed: e.target.checked })} />
          Force closed (override hours)
        </label>

        <h2 className="font-semibold pt-2">Social links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["facebookUrl", "instagramUrl", "tiktokUrl", "youtubeUrl"] as const).map((key) => (
            <input
              key={key}
              className="input"
              placeholder={key.replace("Url", "")}
              value={settings[key]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
            />
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Promo banners</h2>
        <ul className="space-y-3">
          {banners.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
              <div className="relative h-14 w-24 overflow-hidden rounded-lg bg-stone-100">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-stone-400"><ImageIcon size={18} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title || "Banner"}</p>
                <p className="truncate text-xs text-stone-500">{b.linkUrl || "No link"}</p>
              </div>
              <button type="button" onClick={() => toggleBanner(b)} className="text-xs font-semibold text-brand-700">
                {b.isActive ? "Active" : "Hidden"}
              </button>
              <button type="button" onClick={() => removeBanner(b.id)} className="text-stone-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-2 rounded-xl border border-dashed border-stone-300 p-4">
          <input className="input" placeholder="Title (optional)" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
          <input className="input" placeholder="Link URL (optional)" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} />
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} />
            <label className="btn-ghost shrink-0 cursor-pointer">
              {uploading ? "…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onBannerUpload(e.target.files[0])} />
            </label>
          </div>
          <button type="button" className="btn-primary w-full" onClick={addBanner} disabled={!bannerForm.imageUrl}>
            <Plus size={16} /> Add banner
          </button>
        </div>
      </section>
    </div>
  );
}
