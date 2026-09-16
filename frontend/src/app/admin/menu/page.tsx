"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
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

  async function load() {
    setItems(await api<MenuItem[]>("/menu"));
  }
  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      price: Number(form.price),
    };
    if (editing) await api(`/menu/${editing}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/menu", { method: "POST", body: JSON.stringify(body) });
    setForm(empty);
    setEditing(null);
    load();
  }

  async function toggle(item: MenuItem) {
    await api(`/menu/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this dish?")) return;
    await api(`/menu/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <form onSubmit={onSubmit} className="card h-fit space-y-3 p-5">
        <h2 className="font-display text-2xl">{editing ? "Edit dish" : "Add dish"}</h2>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Price (PKR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className="input" placeholder="Image URL (Unsplash)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
          Available
        </label>
        <button className="btn-primary w-full">{editing ? "Save changes" : "Add to menu"}</button>
        {editing && (
          <button type="button" className="btn-ghost w-full" onClick={() => { setEditing(null); setForm(empty); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="card flex gap-3 p-3">
            <div className="relative h-20 w-24 overflow-hidden rounded-2xl">
              <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-stone-500">
                {item.category} · {pkr(item.price)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-ghost h-8 px-3 text-xs" onClick={() => toggle(item)}>
                  {item.isAvailable ? "Mark sold out" : "Make available"}
                </button>
                <button
                  className="btn-ghost h-8 px-3 text-xs"
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
                <button className="h-8 px-3 text-xs text-red-600" onClick={() => remove(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
