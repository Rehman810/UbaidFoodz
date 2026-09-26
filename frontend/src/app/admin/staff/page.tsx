"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw, Shield, UserCog } from "lucide-react";
import { api } from "@/lib/api";
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

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "CHEF", label: "Chef" },
  { value: "RIDER", label: "Rider" },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "demo123",
    role: "CHEF" as Role,
  });

  async function load() {
    setLoading(true);
    try {
      setStaff(await api<Staff[]>("/admin/staff"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setMsg("Could not load staff."));
  }, []);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/admin/staff", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", phone: "", password: "demo123", role: "CHEF" });
      await load();
      setMsg("Staff account created.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not create staff.");
    }
  }

  async function patch(id: string, data: Partial<Staff> & { password?: string }) {
    setMsg("");
    try {
      await api(`/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <UserCog size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Staff</h1>
            <p className="mt-0.5 text-sm text-stone-500">Admins, chefs, and riders who can sign in to Kitchen OS.</p>
          </div>
        </div>
      </div>

      {msg && (
        <p className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">{msg}</p>
      )}

      <form onSubmit={createStaff} className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-stone-800">Add staff</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input className="input" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary mt-4 h-10">
          <Plus size={16} /> Create account
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <p className="text-sm font-semibold text-stone-800">{staff.length} people</p>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {loading ? (
          <div className="skeleton m-4 h-40 rounded-xl" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">2FA</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-900">{s.name}</p>
                      <p className="text-xs text-stone-500">{s.email}</p>
                      {s.phone && <p className="text-xs text-stone-400">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-semibold"
                        value={s.role}
                        onChange={(e) => patch(s.id, { role: e.target.value as Role })}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => patch(s.id, { isActive: !s.isActive })}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          s.isActive ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {s.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {s.role === "ADMIN" && s.totpEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <Shield size={12} /> On
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">{formatWhen(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
