"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bike,
  ChefHat,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/pagination";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { StaffRow, StaffTable } from "@/components/admin/StaffTable";
import { StaffFormData, StaffFormSheet } from "@/components/admin/StaffFormSheet";

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
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyForm: StaffFormData = {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CHEF",
    autoGeneratePassword: true,
  };
  const [form, setForm] = useState<StaffFormData>(emptyForm);

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
        }),
      });
      closeForm();
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
    } finally {
      setSaving(false);
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
    <div className="w-full space-y-6">
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
          <div className="flex flex-wrap gap-2">
            <RefreshButton busy={showSkeleton} onClick={() => load(true)} />
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
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

      {formOpen && (
        <StaffFormSheet
          open={formOpen}
          form={form}
          setForm={setForm}
          saving={saving}
          error={msgTone === "err" ? msg : ""}
          onClose={closeForm}
          onSubmit={createStaff}
        />
      )}
    </div>
  );
}
