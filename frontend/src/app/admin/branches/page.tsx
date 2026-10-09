"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, Plus, Star } from "lucide-react";
import { createBranch, fetchAdminBranches, updateBranch } from "@/modules/branches/api";
import type { Branch } from "@/modules/branches/types";
import { useBranch } from "@/modules/branches/BranchContext";
import { RefreshButton } from "@/components/admin/RefreshButton";

const emptyForm = { name: "", code: "", address: "", phone: "", isDefault: false };

export default function BranchesPage() {
  const { refresh: refreshContext } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await fetchAdminBranches();
      setBranches(data.branches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load branches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createBranch({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim(),
        phone: form.phone.trim(),
        isDefault: form.isDefault,
      });
      setForm(emptyForm);
      await load(true);
      await refreshContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create branch");
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(branch: Branch) {
    try {
      await updateBranch(branch.id, { isDefault: true });
      await load(true);
      await refreshContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update branch");
    }
  }

  async function toggleActive(branch: Branch) {
    try {
      await updateBranch(branch.id, { isActive: !branch.isActive });
      await load(true);
      await refreshContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update branch");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-stone-900 dark:text-stone-50">Branches</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Outlets for kitchen, POS, and orders. Use the header switcher to filter operations by branch.
          </p>
        </div>
        <RefreshButton busy={loading || refreshing} onClick={() => load(true)} />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-50">
          <Plus size={18} className="text-brand-600" /> Add branch
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Branch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Code (optional, e.g. gulberg)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="input sm:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default (online orders &amp; fallback POS)
          </label>
        </div>
        <button type="submit" disabled={saving} className="btn-primary mt-4">
          {saving ? "Saving…" : "Create branch"}
        </button>
      </form>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : (
        <ul className="grid gap-3">
          {branches.map((b) => (
            <li
              key={b.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-stone-900 ${
                b.isActive ? "border-stone-200/80 dark:border-stone-700" : "border-stone-200 opacity-60 dark:border-stone-700"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-900 dark:text-stone-50">
                      {b.name}
                      {b.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                          <Star size={10} /> Default
                        </span>
                      )}
                      {!b.isActive && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-500">Inactive</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Code: {b.code} · {b._count?.orders ?? 0} orders · {b._count?.members ?? 0} staff
                    </p>
                    {b.address && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{b.address}</p>}
                    {b.phone && <p className="text-sm text-stone-500">{b.phone}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!b.isDefault && b.isActive && (
                    <button type="button" className="btn-ghost text-xs" onClick={() => setDefault(b)}>
                      Make default
                    </button>
                  )}
                  <button type="button" className="btn-ghost text-xs" onClick={() => toggleActive(b)}>
                    {b.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
