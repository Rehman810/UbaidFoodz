"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bike,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { pkr, formatWhen } from "@/lib/format";
import { AdminRider } from "@/lib/admin-types";
import { usePoll } from "@/hooks/usePoll";
import { FulfillmentBadge } from "@/components/FulfillmentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RiderFormSheet, RiderFormData } from "@/components/admin/RiderFormSheet";

const emptyRider: RiderFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-brand-500 to-orange-600",
];

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Bike;
  accent: "violet" | "emerald" | "sky" | "brand";
}) {
  const styles = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${styles[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

export default function RidersPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RiderFormData>(emptyRider);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => api<AdminRider[]>("/admin/riders"), []);
  const { data: riders, loading, refresh } = usePoll(load, 10000);

  const stats = useMemo(() => {
    const list = riders ?? [];
    const onRoad = list.filter((r) => r.activeOrders.length > 0).length;
    const activeDrops = list.reduce((s, r) => s + r.activeOrders.length, 0);
    const delivered = list.reduce((s, r) => s + r.deliveredCount, 0);
    const available = list.length - onRoad;
    return { total: list.length, onRoad, activeDrops, delivered, available };
  }, [riders]);

  const filtered = useMemo(() => {
    let list = [...(riders ?? [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.activeOrders.length !== b.activeOrders.length) {
        return b.activeOrders.length - a.activeOrders.length;
      }
      return b.deliveredCount - a.deliveredCount;
    });
  }, [riders, search]);

  function closeForm() {
    setFormOpen(false);
    setForm(emptyRider);
    setFormError("");
  }

  async function onCreateRider(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api("/admin/riders", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      closeForm();
      refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create rider");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
              <Bike size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Riders</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Delivery fleet — live assignments and rider accounts
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyRider);
                setFormError("");
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <Plus size={16} /> Add rider
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fleet size" value={stats.total} hint="Registered riders" icon={Users} accent="violet" />
        <KpiCard
          label="On delivery"
          value={stats.onRoad}
          hint={`${stats.activeDrops} active drop${stats.activeDrops === 1 ? "" : "s"}`}
          icon={Truck}
          accent="brand"
        />
        <KpiCard
          label="Available"
          value={stats.available}
          hint="Ready for assignment"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="Total delivered"
          value={stats.delivered}
          hint="All-time completions"
          icon={Package}
          accent="sky"
        />
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Search riders by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Assign riders from the <Link href="/admin/orders" className="font-semibold text-violet-700 hover:underline">Orders</Link> page when an order is ready to go out.
        </p>
      </div>

      {/* Riders */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Bike size={36} className="mx-auto text-stone-300" />
          <p className="mt-3 font-medium text-stone-600">
            {search ? "No riders match your search" : "No riders yet"}
          </p>
          <button type="button" onClick={() => setFormOpen(true)} className="btn-primary mt-4">
            <Plus size={16} /> Add first rider
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((r) => {
            const busy = r.activeOrders.length > 0;
            return (
              <article
                key={r.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                  busy ? "border-violet-200 ring-1 ring-violet-100" : "border-stone-200/80"
                }`}
              >
                <div className="flex items-center gap-4 border-b border-stone-100 p-4 sm:p-5">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${avatarGradient(r.id)}`}
                  >
                    {initials(r.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-stone-900">{r.name}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          busy
                            ? "bg-violet-100 text-violet-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {busy ? "On delivery" : "Available"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">{r.email}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                      <Phone size={12} /> {r.phone || "No phone"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{r.deliveredCount}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Delivered</p>
                    <p className="mt-1 text-xs text-stone-400">{r.totalAssigned} assigned</p>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <Package size={12} /> Active deliveries ({r.activeOrders.length})
                  </p>

                  {r.activeOrders.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 py-8 text-center">
                      <Truck size={24} className="mx-auto text-stone-300" />
                      <p className="mt-2 text-sm text-stone-500">No active drops</p>
                      <p className="mt-0.5 text-xs text-stone-400">Assign from Orders when ready</p>
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {r.activeOrders.map((o) => (
                        <li
                          key={o.id}
                          className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-stone-900">{o.orderNumber}</p>
                                <FulfillmentBadge type={o.fulfillmentType} />
                              </div>
                              <p className="mt-0.5 text-xs text-stone-500">
                                {formatWhen(o.createdAt)} · {pkr(o.total)}
                              </p>
                            </div>
                            <StatusBadge status={o.status} fulfillmentType={o.fulfillmentType} />
                          </div>
                          <p className="mt-2 flex items-start gap-1.5 text-xs text-stone-600">
                            <MapPin size={12} className="mt-0.5 shrink-0 text-violet-500" />
                            {o.deliveryAddress}
                          </p>
                          <p className="mt-1.5 text-xs font-medium text-stone-700">
                            {o.customerName} · {o.customerPhone}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formOpen && (
        <RiderFormSheet
          open={formOpen}
          form={form}
          setForm={setForm}
          saving={saving}
          error={formError}
          onClose={closeForm}
          onSubmit={onCreateRider}
        />
      )}
    </div>
  );
}
