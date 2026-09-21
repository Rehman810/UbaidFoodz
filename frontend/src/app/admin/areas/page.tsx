"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, MapPin, Plus, RefreshCw, Search, Truck, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { pkr } from "@/lib/format";
import { DeliveryArea } from "@/lib/types";

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftCharges, setDraftCharges] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCharge, setNewCharge] = useState("150");
  const [newDelivering, setNewDelivering] = useState(true);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    return api<DeliveryArea[]>("/delivery-areas/all").then((rows) => {
      setAreas(rows);
      setDraftCharges(
        Object.fromEntries(rows.map((a) => [a.id, String(Number(a.deliveryCharge))]))
      );
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return areas.filter((a) => {
      if (filter === "active" && !a.isDelivering) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q);
    });
  }, [areas, query, filter]);

  const activeCount = areas.filter((a) => a.isDelivering).length;

  async function patchArea(id: string, data: Partial<Pick<DeliveryArea, "isDelivering" | "deliveryCharge">>) {
    setSavingId(id);
    try {
      const updated = await api<DeliveryArea>(`/delivery-areas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setAreas((rows) => rows.map((r) => (r.id === id ? updated : r)));
      setDraftCharges((d) => ({ ...d, [id]: String(Number(updated.deliveryCharge)) }));
    } finally {
      setSavingId(null);
    }
  }

  async function saveCharge(id: string) {
    const raw = draftCharges[id];
    const charge = Number(raw);
    if (Number.isNaN(charge) || charge < 0) return;
    const current = areas.find((a) => a.id === id);
    if (current && Number(current.deliveryCharge) === charge) return;
    await patchArea(id, { deliveryCharge: charge });
  }

  async function onAddArea(e: FormEvent) {
    e.preventDefault();
    setAddError("");
    const name = newName.trim();
    if (!name) {
      setAddError("Area name is required.");
      return;
    }
    const charge = Number(newCharge);
    if (Number.isNaN(charge) || charge < 0) {
      setAddError("Enter a valid delivery charge.");
      return;
    }
    setAdding(true);
    try {
      const created = await api<DeliveryArea>("/delivery-areas", {
        method: "POST",
        body: JSON.stringify({
          name,
          deliveryCharge: charge,
          isDelivering: newDelivering,
        }),
      });
      setAreas((rows) => [...rows, created].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setDraftCharges((d) => ({ ...d, [created.id]: String(charge) }));
      setNewName("");
      setNewCharge("150");
      setNewDelivering(true);
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Could not add area.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Delivery zones</p>
          <h1 className="font-display text-3xl text-stone-900">Karachi areas</h1>
          <p className="mt-1 text-sm text-stone-500">
            {activeCount} of {areas.length} areas enabled for delivery
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowAdd((v) => !v)} className="btn-primary">
            <Plus size={15} /> Add area
          </button>
          <button type="button" onClick={() => load()} className="btn-ghost">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={onAddArea}
          className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-stone-900">Add delivery area</p>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setAddError("");
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-white text-stone-500"
            >
              <X size={15} />
            </button>
          </div>
          {addError && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Area name</label>
              <input
                className="input"
                placeholder="e.g. DHA Phase 8"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Delivery charge</label>
              <input
                type="number"
                min={0}
                step={10}
                className="input"
                value={newCharge}
                onChange={(e) => setNewCharge(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setNewDelivering((v) => !v)}
              className={`inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                newDelivering
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-200 bg-white text-stone-600"
              }`}
            >
              {newDelivering ? <Check size={14} /> : <Truck size={14} />}
              {newDelivering ? "On" : "Off"}
            </button>
            <button type="submit" disabled={adding} className="btn-primary h-[46px]">
              {adding ? "Adding…" : "Save area"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone-400"
            size={16}
            strokeWidth={2}
          />
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="Search area…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "all" ? "bg-stone-900 text-white" : "bg-white text-stone-600 shadow-card"}`}
        >
          All areas
        </button>
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === "active" ? "bg-brand-600 text-white" : "bg-white text-stone-600 shadow-card"}`}
        >
          Delivering only
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1fr_140px_120px] gap-4 border-b border-stone-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 md:grid">
          <span>Area</span>
          <span>Delivery charge</span>
          <span>Delivering</span>
        </div>
        <ul className="max-h-[calc(100vh-280px)] divide-y divide-stone-100 overflow-y-auto">
          {filtered.map((area) => (
            <li
              key={area.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_140px_120px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <MapPin size={16} />
                </span>
                <p className="truncate font-medium text-stone-900">{area.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={10}
                  className="input h-10 w-full py-2"
                  value={draftCharges[area.id] ?? ""}
                  onChange={(e) =>
                    setDraftCharges((d) => ({ ...d, [area.id]: e.target.value }))
                  }
                  onBlur={() => saveCharge(area.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveCharge(area.id)}
                />
                {savingId === area.id && <RefreshCw size={14} className="animate-spin text-stone-400" />}
              </div>
              <button
                type="button"
                disabled={savingId === area.id}
                onClick={() => patchArea(area.id, { isDelivering: !area.isDelivering })}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                  area.isDelivering
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {area.isDelivering ? <Check size={14} /> : <Truck size={14} />}
                {area.isDelivering ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-stone-500">No areas match your search.</p>
        )}
      </div>

      <p className="text-xs text-stone-500">
        Customers only see areas marked <strong>On</strong>. Charge shown is added to their order total ({pkr(150)}–{pkr(250)} typical).
      </p>
    </div>
  );
}
