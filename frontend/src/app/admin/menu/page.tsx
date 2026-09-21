"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { CATEGORIES, MenuItem } from "@/lib/types";

const empty = {
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  imageUrl: "",
  isAvailable: true,
};

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  async function load() {
    setItems(await api<MenuItem[]>("/menu"));
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (catFilter !== "All") list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return list;
  }, [items, catFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((i) => i.isAvailable).length,
    soldOut: items.filter((i) => !i.isAvailable).length,
  }), [items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = { ...form, price: Number(form.price) };
    if (editing) await api(`/menu/${editing}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/menu", { method: "POST", body: JSON.stringify(body) });
    setForm(empty);
    setEditing(null);
    load();
  }

  async function toggle(item: MenuItem) {
    await api(`/menu/${item.id}`, { method: "PUT", body: JSON.stringify({ isAvailable: !item.isAvailable }) });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this dish?")) return;
    await api(`/menu/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Menu management</h1>
          <p className="mt-1 text-sm text-stone-500">
            {stats.total} dishes · {stats.available} available · {stats.soldOut} sold out
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <form onSubmit={onSubmit} className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <Plus size={18} className="text-brand-600" />
            {editing ? "Edit dish" : "Add new dish"}
          </h2>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <textarea className="input min-h-20" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input" placeholder="Price (PKR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
              Available on menu
            </label>
            <button className="btn-primary w-full">{editing ? "Save changes" : "Add dish"}</button>
            {editing && (
              <button type="button" className="btn-ghost w-full" onClick={() => { setEditing(null); setForm(empty); }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400"
                placeholder="Search dishes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                    catFilter === c ? "bg-brand-600 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <article key={item.id} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 grid place-items-center bg-stone-900/60 text-[10px] font-bold text-white">
                      OUT
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-xs text-stone-500">{item.category} · {pkr(item.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-bold hover:bg-stone-50" onClick={() => toggle(item)}>
                      {item.isAvailable ? "Sold out" : "Enable"}
                    </button>
                    <button
                      className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-bold hover:bg-stone-50"
                      onClick={() => {
                        setEditing(item.id);
                        setForm({
                          name: item.name,
                          description: item.description,
                          price: String(item.price),
                          category: item.category,
                          imageUrl: item.imageUrl,
                          isAvailable: item.isAvailable,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50" onClick={() => remove(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
