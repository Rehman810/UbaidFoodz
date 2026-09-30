"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bike,
  ChefHat,
  Plus,
  Receipt,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/pagination";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ASSIGNABLE_ROLES, StaffRow, StaffTable } from "@/components/admin/StaffTable";

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

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState<"ok" | "err">("ok");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CHEF" as Role,
    autoGeneratePassword: true,
  });

  const stats = useMemo(
    () => ({
      total: staff.length,
      chefs: staff.filter((s) => s.role === "CHEF").length,
      riders: staff.filter((s) => s.role === "RIDER").length,
      active: staff.filter((s) => s.isActive).length,
    }),
    [staff]
  );

  const staffPagination = usePagination(staff, PAGE_SIZE.table);
  const showSkeleton = loading || refreshing;

  async function load(manual = false) {
    if (manual && staff.length > 0) setRefreshing(true);
    else setLoading(true);
    try {
      setStaff(await api<StaffRow[]>("/admin/staff"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load().catch(() => {
      setMsgTone("err");
      setMsg("Could not load staff.");
    });
  }, []);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setMsg("");
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
        }),
      });
      setForm({ name: "", email: "", phone: "", password: "", role: "CHEF", autoGeneratePassword: true });
      await load(true);
      setMsgTone("ok");
      setMsg(
        res.emailed
          ? "Staff account created. Login details were emailed."
          : "Staff account created. They can sign in at /login."
      );
    } catch (err) {
      setMsgTone("err");
      setMsg(err instanceof Error ? err.message : "Could not create staff.");
    }
  }

  async function patch(id: string, data: Partial<StaffRow>) {
    setBusyId(id);
    setMsg("");
    try {
      await api(`/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      await load(true);
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
    if (member.isActive && !window.confirm(`Deactivate ${member.name}? Their sessions will end.`)) return;
    patch(member.id, { isActive: !member.isActive });
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md">
              <UserCog size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Staff</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Create chefs, riders, and cashiers. Admin role stays on your account.
              </p>
            </div>
          </div>
          <RefreshButton busy={showSkeleton} onClick={() => load(true)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total staff" value={stats.total} icon={Users} accent="brand" />
        <KpiCard label="Chefs" value={stats.chefs} icon={ChefHat} accent="orange" />
        <KpiCard label="Riders" value={stats.riders} icon={Bike} accent="sky" />
        <KpiCard label="Active" value={stats.active} icon={ShieldCheck} accent="emerald" />
      </div>

      {msg && (
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

      <form onSubmit={createStaff} className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-gradient-to-r from-brand-50/80 to-orange-50/50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
            <Plus size={16} className="text-brand-600" />
            Add staff member
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Choose Chef, Rider, or Cashier — riders are created here only, not on the Riders page.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Name</span>
            <input className="input" placeholder="Chef Ali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Email</span>
            <input className="input" type="email" placeholder="chef@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</span>
            <input className="input" placeholder="0322-4455667" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Role</span>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          {!form.autoGeneratePassword && (
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Password</span>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
          )}
        </div>
        <div className="border-t border-stone-100 px-5 py-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 text-brand-600"
              checked={form.autoGeneratePassword}
              onChange={(e) => setForm({ ...form, autoGeneratePassword: e.target.checked, password: "" })}
            />
            Auto-generate a secure password and email login details to this person
          </label>
        </div>
        <div className="border-t border-stone-100 px-5 py-4">
          <button type="submit" className="btn-primary h-11 gap-2 px-5">
            <Plus size={16} />
            Create account
          </button>
        </div>
      </form>

      {showSkeleton ? (
        <div className="skeleton h-80 rounded-2xl" />
      ) : (
        <>
          <StaffTable
            staff={staffPagination.pageItems}
            currentUserId={user?.id}
            busyId={busyId}
            onRoleChange={(id, role) => patch(id, { role })}
            onToggleActive={toggleActive}
          />
          <Pagination
            page={staffPagination.page}
            totalPages={staffPagination.totalPages}
            totalItems={staffPagination.totalItems}
            rangeStart={staffPagination.rangeStart}
            rangeEnd={staffPagination.rangeEnd}
            onPageChange={staffPagination.setPage}
          />
        </>
      )}
    </div>
  );
}
