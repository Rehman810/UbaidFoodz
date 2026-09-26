"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bike,
  ChefHat,
  Flame,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";
import { formatWhen } from "@/lib/format";

type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
};

const ASSIGNABLE_ROLES: { value: Role; label: string; icon: typeof ChefHat }[] = [
  { value: "CHEF", label: "Chef", icon: ChefHat },
  { value: "RIDER", label: "Rider", icon: Bike },
];

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-violet-50 text-violet-800 ring-violet-100",
  CHEF: "bg-orange-50 text-orange-800 ring-orange-100",
  RIDER: "bg-sky-50 text-sky-800 ring-sky-100",
  CUSTOMER: "bg-stone-50 text-stone-600 ring-stone-100",
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-brand-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
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
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
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

  async function load() {
    setLoading(true);
    try {
      setStaff(await api<Staff[]>("/admin/staff"));
    } finally {
      setLoading(false);
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
      await load();
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

  async function patch(id: string, data: Partial<Staff>) {
    setBusyId(id);
    setMsg("");
    try {
      await api(`/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      await load();
      setMsgTone("ok");
      setMsg("Staff updated.");
    } catch (err) {
      setMsgTone("err");
      setMsg(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md shadow-brand-500/20">
            <UserCog size={22} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-stone-900">Staff</h1>
            <p className="mt-1 text-sm text-stone-500">
              Chefs and riders who sign in to Kitchen OS. Admin role is locked to your account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
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

      <form
        onSubmit={createStaff}
        className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
      >
        <div className="border-b border-stone-100 bg-gradient-to-r from-brand-50/80 to-orange-50/50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
            <Plus size={16} className="text-brand-600" />
            Add staff member
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Create chef or rider accounts only.</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Name</span>
            <input className="input" placeholder="Chef Ali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Email</span>
            <input className="input" type="email" placeholder="chef@ubaidfastfoodz.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {staff.map((s) => {
            const isSelf = s.id === user?.id;
            const isAdmin = s.role === "ADMIN";
            const RoleIcon = s.role === "CHEF" ? ChefHat : s.role === "RIDER" ? Bike : Shield;
            return (
              <article
                key={s.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  s.isActive ? "border-stone-200/80" : "border-stone-200/60 opacity-75"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-sm ${avatarGradient(s.id)}`}
                  >
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-stone-900">{s.name}</h2>
                      {isSelf && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-stone-500">{s.email}</p>
                    {s.phone && <p className="text-xs text-stone-400">{s.phone}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${ROLE_STYLES[s.role]}`}>
                    <RoleIcon size={12} />
                    {s.role === "ADMIN" ? "Admin" : s.role === "CHEF" ? "Chef" : "Rider"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
                      <Shield size={13} />
                      Owner account · role locked
                    </span>
                  ) : (
                    <select
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700"
                      value={s.role}
                      disabled={busyId === s.id}
                      onChange={(e) => patch(s.id, { role: e.target.value as Role })}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    disabled={busyId === s.id || (isSelf && s.isActive)}
                    onClick={() => patch(s.id, { isActive: !s.isActive })}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      s.isActive
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200"
                    }`}
                  >
                    {s.isActive ? "Active" : "Disabled"}
                  </button>

                  {s.role === "ADMIN" && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.totpEnabled ? "text-emerald-700" : "text-stone-400"}`}>
                      {s.totpEnabled ? <ShieldCheck size={13} /> : <Shield size={13} />}
                      2FA {s.totpEnabled ? "on" : "off"}
                    </span>
                  )}

                  <span className="ml-auto text-[11px] text-stone-400">
                    Joined {formatWhen(s.createdAt)}
                  </span>
                </div>

                {s.role === "CHEF" && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                    <Flame size={12} className="text-brand-500" />
                    Kitchen board access only
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
