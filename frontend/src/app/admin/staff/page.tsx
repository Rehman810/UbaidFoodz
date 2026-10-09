"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Bike,
  ChefHat,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fetchStaffPage } from "@/lib/admin-staff";
import { PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ConfirmSheet } from "@/components/admin/ConfirmSheet";
import { StaffRow, StaffTable } from "@/components/admin/StaffTable";
import { StaffFormData, StaffFormSheet } from "@/components/admin/StaffFormSheet";
import { usePoll } from "@/hooks/usePoll";
import { AdminScopeBanner } from "@/components/admin/AdminScopeBanner";
import { useBranch } from "@/modules/branches/BranchContext";

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: "brand" | "orange" | "sky" | "emerald";
}) {
  const styles = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${styles[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function defaultBranchIds(selection: string, branches: { id: string; isDefault?: boolean }[]) {
  if (selection !== "all") return [selection];
  const pick = branches.find((b) => b.isDefault) ?? branches[0];
  return pick ? [pick.id] : [];
}

export default function StaffPage() {
  const { user } = useAuth();
  const { selection, branches } = useBranch();
  const branchOptions = branches.map((b) => ({ id: b.id, name: b.name, address: b.address }));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState<"ok" | "err">("ok");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffRow | null>(null);
  const emptyForm: StaffFormData = {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CHEF",
    autoGeneratePassword: true,
    branchIds: [],
  };
  const [form, setForm] = useState<StaffFormData>(emptyForm);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const load = useCallback(
    () =>
      fetchStaffPage({
        limit: PAGE_SIZE.table,
        offset: (page - 1) * PAGE_SIZE.table,
        search,
      }),
    [page, search]
  );

  const { data, loading, refreshing, error, refresh } = usePoll(load, 30000);
  const showSkeleton = loading && !data;

  function closeForm() {
    setFormOpen(false);
    setForm(emptyForm);
  }

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const res = await api<{ emailed?: boolean }>("/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          autoGeneratePassword: form.autoGeneratePassword,
          password: form.autoGeneratePassword ? undefined : form.password.trim() || undefined,
          branchIds: form.branchIds,
        }),
      });
      closeForm();
      refresh();
      setMsgTone("ok");
      setMsg(
        res.emailed
          ? "Staff account created. Login details were emailed."
          : "Staff account created. They can sign in at /login."
      );
    } catch (err) {
      setMsgTone("err");
      setMsg(err instanceof Error ? err.message : "Could not create staff.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, data: Partial<StaffRow> & { branchIds?: string[] }) {
    setBusyId(id);
    setMsg("");
    try {
      await api(`/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      refresh();
      setMsgTone("ok");
      setMsg("Staff updated.");
    } catch (err) {
      setMsgTone("err");
      setMsg(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  function toggleActive(member: StaffRow) {
    if (member.isActive) {
      setDeactivateTarget(member);
      return;
    }
    patch(member.id, { isActive: true });
  }

  const staff = data?.staff ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats ?? { total: 0, chefs: 0, riders: 0, active: 0 };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE.table));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE.table + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE.table, total);

  return (
    <div className="w-full space-y-6">
      <AdminScopeBanner variant="branch" />
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md">
              <UserCog size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Staff</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Create chefs, riders, and cashiers. Assign branches in the table or when adding staff.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <RefreshButton busy={loading || refreshing} onClick={refresh} />
            <button
              type="button"
              onClick={() => {
                setForm({ ...emptyForm, branchIds: defaultBranchIds(selection, branches) });
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              <Plus size={16} /> Add staff
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total staff" value={stats.total} icon={Users} accent="brand" />
        <KpiCard label="Chefs" value={stats.chefs} icon={ChefHat} accent="orange" />
        <KpiCard label="Riders" value={stats.riders} icon={Bike} accent="sky" />
        <KpiCard label="Active" value={stats.active} icon={ShieldCheck} accent="emerald" />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {msg && !(formOpen && msgTone === "err") && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            msgTone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="Search staff by name, email or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {showSkeleton ? (
        <div className="skeleton h-80 rounded-2xl" />
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Users size={36} className="mx-auto text-stone-300" />
          <p className="mt-3 font-medium text-stone-600">
            {search ? "No staff match your search" : "No staff yet"}
          </p>
          {!search && (
            <button type="button" onClick={() => setFormOpen(true)} className="btn-primary mt-4">
              Add first staff member
            </button>
          )}
        </div>
      ) : (
        <>
          <StaffTable
            staff={staff}
            branches={branchOptions}
            currentUserId={user?.id}
            busyId={busyId}
            onToggleActive={toggleActive}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </>
      )}

      {formOpen && (
        <StaffFormSheet
          open={formOpen}
          form={form}
          setForm={setForm}
          branches={branchOptions}
          saving={saving}
          error={msgTone === "err" ? msg : ""}
          onClose={closeForm}
          onSubmit={createStaff}
        />
      )}

      <ConfirmSheet
        open={Boolean(deactivateTarget)}
        title={`Deactivate ${deactivateTarget?.name ?? "staff"}?`}
        message="Their active sessions will end and they will not be able to sign in until reactivated."
        confirmLabel="Deactivate"
        danger
        saving={busyId === deactivateTarget?.id}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (!deactivateTarget) return;
          patch(deactivateTarget.id, { isActive: false }).finally(() => setDeactivateTarget(null));
        }}
      />
    </div>
  );
}
