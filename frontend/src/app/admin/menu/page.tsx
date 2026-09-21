"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  FolderPlus,
  ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { api, apiUpload, ApiError } from "@/lib/api";
import { pkr } from "@/lib/format";
import { enrichCategories } from "@/lib/category-meta";
import { CATEGORIES as DEFAULT_CATEGORIES, Category, Deal, MenuItem } from "@/lib/types";
import { MenuFormSheet, MenuFormData } from "@/components/admin/MenuFormSheet";
import { DealFormSheet, DealFormData } from "@/components/admin/DealFormSheet";
import { CategoryFormSheet, CategoryFormData } from "@/components/admin/CategoryFormSheet";

type Tab = "dishes" | "deals" | "categories";

const emptyDish: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  imageUrl: "",
  isAvailable: true,
};

const emptyDeal: DealFormData = {
  title: "",
  description: "",
  dealPrice: "",
  imageUrl: "",
  isActive: true,
  items: [{ menuItemId: "", quantity: 1 }],
};

const emptyCategory: CategoryFormData = {
  name: "",
  tagline: "",
  imageUrl: "",
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  Starters: { bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200" },
  "Main Course": { bg: "bg-brand-50", text: "text-brand-800", ring: "ring-brand-200" },
  Beverages: { bg: "bg-sky-50", text: "text-sky-800", ring: "ring-sky-200" },
  Desserts: { bg: "bg-violet-50", text: "text-violet-800", ring: "ring-violet-200" },
};

function DishImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-stone-100 text-stone-400">
        <ImageIcon size={22} />
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill className="object-cover" sizes="280px" onError={() => setBroken(true)} />
  );
}

export default function AdminMenu() {
  const [tab, setTab] = useState<Tab>("dishes");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [dishFormOpen, setDishFormOpen] = useState(false);
  const [dishForm, setDishForm] = useState<MenuFormData>(emptyDish);
  const [editingDish, setEditingDish] = useState<string | null>(null);

  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [dealForm, setDealForm] = useState<DealFormData>(emptyDeal);
  const [editingDeal, setEditingDeal] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategory);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const categoryNames = useMemo(
    () => (categories.length > 0 ? categories.map((c) => c.name) : [...DEFAULT_CATEGORIES]),
    [categories]
  );

  async function load() {
    setLoading(true);
    try {
      const [menu, dealList, cats] = await Promise.all([
        api<MenuItem[]>("/menu"),
        api<Deal[]>("/deals"),
        api<Category[]>("/categories").catch(() => []),
      ]);
      setItems(menu);
      setDeals(dealList);
      setCategories(enrichCategories(cats));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...items].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    if (catFilter !== "All") list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, catFilter, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      available: items.filter((i) => i.isAvailable).length,
      soldOut: items.filter((i) => !i.isAvailable).length,
      deals: deals.length,
      activeDeals: deals.filter((d) => d.isActive).length,
    }),
    [items, deals]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    for (const c of categoryNames) counts[c] = items.filter((i) => i.category === c).length;
    return counts;
  }, [items, categoryNames]);

  function closeDishForm() {
    setDishFormOpen(false);
    setDishForm(emptyDish);
    setEditingDish(null);
    setUploadError("");
  }

  function openAddDish() {
    setDishForm({ ...emptyDish, category: categoryNames[0] || "Main Course" });
    setEditingDish(null);
    setUploadError("");
    setDishFormOpen(true);
  }

  function closeDealForm() {
    setDealFormOpen(false);
    setDealForm(emptyDeal);
    setEditingDeal(null);
    setUploadError("");
  }

  function openAddDeal() {
    setDealForm({
      ...emptyDeal,
      items: [{ menuItemId: items[0]?.id || "", quantity: 1 }],
    });
    setEditingDeal(null);
    setDealFormOpen(true);
  }

  async function onDishSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...dishForm, price: Number(dishForm.price) };
      if (editingDish) await api(`/menu/${editingDish}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/menu", { method: "POST", body: JSON.stringify(body) });
      closeDishForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function onDealSubmit(e: FormEvent) {
    e.preventDefault();
    const validItems = dealForm.items.filter((i) => i.menuItemId);
    if (validItems.length === 0) {
      setUploadError("Add at least one menu item to the deal.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: dealForm.title,
        description: dealForm.description,
        dealPrice: Number(dealForm.dealPrice),
        imageUrl: dealForm.imageUrl,
        isActive: dealForm.isActive,
        items: validItems,
      };
      if (editingDeal) await api(`/deals/${editingDeal}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/deals", { method: "POST", body: JSON.stringify(body) });
      closeDealForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function onImagePick(e: ChangeEvent<HTMLInputElement>, target: "dish" | "deal") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const { url } = await apiUpload("/upload/image", file);
      if (target === "dish") setDishForm((f) => ({ ...f, imageUrl: url }));
      else setDealForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  function closeCategoryForm() {
    setCategoryFormOpen(false);
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
    setCategoryError("");
  }

  function openAddCategory() {
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
    setCategoryError("");
    setCategoryFormOpen(true);
  }

  function startEditCategory(cat: Category) {
    const enriched = enrichCategories([cat])[0];
    setEditingCategory(cat.id);
    setCategoryForm({
      name: enriched.name,
      tagline: enriched.tagline || "",
      imageUrl: enriched.imageUrl || "",
    });
    setCategoryError("");
    setCategoryFormOpen(true);
  }

  async function onCategorySubmit(e: FormEvent) {
    e.preventDefault();
    setCategoryError("");
    setSaving(true);
    try {
      const body = { ...categoryForm };
      if (editingCategory) {
        await api(`/categories/${editingCategory}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/categories", { method: "POST", body: JSON.stringify(body) });
      }
      closeCategoryForm();
      await load();
    } catch (err) {
      setCategoryError(err instanceof ApiError ? err.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  }

  async function onCategoryImagePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCategoryError("");
    setUploading(true);
    try {
      const { url } = await apiUpload("/upload/image", file);
      setCategoryForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setCategoryError(err instanceof ApiError ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete category");
    }
  }

  async function toggleDish(item: MenuItem) {
    await api(`/menu/${item.id}`, { method: "PUT", body: JSON.stringify({ isAvailable: !item.isAvailable }) });
    load();
  }

  async function removeDish(id: string) {
    if (!confirm("Delete this dish?")) return;
    await api(`/menu/${id}`, { method: "DELETE" });
    if (editingDish === id) closeDishForm();
    load();
  }

  async function toggleDeal(deal: Deal) {
    await api(`/deals/${deal.id}`, { method: "PUT", body: JSON.stringify({ isActive: !deal.isActive }) });
    load();
  }

  async function removeDeal(id: string) {
    if (!confirm("Delete this deal?")) return;
    await api(`/deals/${id}`, { method: "DELETE" });
    if (editingDeal === id) closeDealForm();
    load();
  }

  function startEditDish(item: MenuItem) {
    setEditingDish(item.id);
    setDishForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
    });
    setDishFormOpen(true);
  }

  function startEditDeal(deal: Deal) {
    setEditingDeal(deal.id);
    setDealForm({
      title: deal.title,
      description: deal.description,
      dealPrice: String(deal.dealPrice),
      imageUrl: deal.imageUrl,
      isActive: deal.isActive,
      items: deal.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    });
    setDealFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Menu management</h1>
              <p className="mt-0.5 text-sm text-stone-500">Dishes, deals, and categories</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-stone-100 px-4 py-2.5 text-center">
              <p className="text-[11px] text-stone-500">Dishes</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-violet-50 px-4 py-2.5 text-center ring-1 ring-violet-100">
              <p className="text-[11px] text-violet-600">Deals</p>
              <p className="text-lg font-bold text-violet-800">{stats.activeDeals}/{stats.deals}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
          {[
            { id: "dishes" as Tab, label: "Dishes", icon: UtensilsCrossed },
            { id: "deals" as Tab, label: "Deals", icon: Sparkles },
            { id: "categories" as Tab, label: "Categories", icon: Layers },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-600 ring-1 ring-stone-200 hover:bg-white"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {tab === "dishes" && (
              <button type="button" onClick={openAddDish} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                <Plus size={16} /> Add dish
              </button>
            )}
            {tab === "deals" && (
              <button type="button" onClick={openAddDeal} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                <Plus size={16} /> Add deal
              </button>
            )}
            {tab === "categories" && (
              <button type="button" onClick={openAddCategory} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                <Plus size={16} /> Add category
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DISHES TAB */}
      {tab === "dishes" && (
        <>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Search dishes…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto">
                {["All", ...categoryNames].map((c) => (
                  <button key={c} type="button" onClick={() => setCatFilter(c)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${catFilter === c ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-600 ring-1 ring-stone-200"}`}>
                    {c} ({categoryCounts[c] ?? 0})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => {
                const catStyle = CATEGORY_STYLE[item.category] || CATEGORY_STYLE["Main Course"];
                return (
                  <article key={item.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${editingDish === item.id ? "border-brand-400 ring-2 ring-brand-100" : "border-stone-200/80"}`}>
                    <div className="relative aspect-[4/3] bg-stone-100">
                      <DishImage src={item.imageUrl} alt={item.name} />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/55">
                          <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">Sold out</span>
                        </div>
                      )}
                      <span className={`absolute left-2 top-2 rounded-lg px-2 py-1 text-[10px] font-semibold ring-1 ${catStyle.bg} ${catStyle.text} ${catStyle.ring}`}>{item.category}</span>
                      <p className="absolute bottom-2 right-2 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-brand-700 shadow-sm">{pkr(item.price)}</p>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-semibold text-stone-900">{item.name}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-xs text-stone-500">{item.description}</p>}
                      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-stone-100 pt-3">
                        <button type="button" onClick={() => toggleDish(item)} className="rounded-lg bg-stone-100 py-2 text-[10px] font-semibold sm:text-xs">{item.isAvailable ? "Sold out" : "Enable"}</button>
                        <button type="button" onClick={() => startEditDish(item)} className="rounded-lg bg-stone-100 py-2 text-[10px] font-semibold sm:text-xs"><Pencil size={12} className="mx-auto" /></button>
                        <button type="button" onClick={() => removeDish(item.id)} className="rounded-lg py-2 text-red-600 hover:bg-red-50"><Trash2 size={12} className="mx-auto" /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* DEALS TAB */}
      {tab === "deals" && (
        loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
            <Sparkles size={36} className="mx-auto text-stone-300" />
            <p className="mt-3 font-medium text-stone-600">No deals yet</p>
            <button type="button" onClick={openAddDeal} className="btn-primary mt-4"><Plus size={16} /> Create first deal</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => {
              const regular = deal.items.reduce((s, i) => s + Number(i.menuItem.price) * i.quantity, 0);
              return (
                <article key={deal.id} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
                  <div className="relative aspect-[16/10] bg-violet-50">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-violet-300"><Sparkles size={32} /></div>
                    )}
                    {!deal.isActive && (
                      <span className="absolute left-2 top-2 rounded-full bg-stone-800 px-2.5 py-1 text-[10px] font-bold text-white">Hidden</span>
                    )}
                    <span className="absolute bottom-2 right-2 rounded-lg bg-violet-600 px-2.5 py-1 text-sm font-bold text-white">{pkr(deal.dealPrice)}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-900">{deal.title}</h3>
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2">{deal.description}</p>
                    <ul className="mt-2 space-y-0.5 text-xs text-stone-600">
                      {deal.items.map((i) => (
                        <li key={i.id}>{i.quantity}× {i.menuItem.name}</li>
                      ))}
                    </ul>
                    {regular > Number(deal.dealPrice) && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">Save {pkr(regular - Number(deal.dealPrice))}</p>
                    )}
                    <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                      <button type="button" onClick={() => toggleDeal(deal)} className="flex-1 rounded-lg bg-stone-100 py-2 text-xs font-semibold">{deal.isActive ? "Hide" : "Activate"}</button>
                      <button type="button" onClick={() => startEditDeal(deal)} className="flex-1 rounded-lg bg-stone-100 py-2 text-xs font-semibold">Edit</button>
                      <button type="button" onClick={() => removeDeal(deal.id)} className="rounded-lg px-3 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {/* CATEGORIES TAB */}
      {tab === "categories" && (
        loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
            <FolderPlus size={36} className="mx-auto text-stone-300" />
            <p className="mt-3 font-medium text-stone-600">No categories yet</p>
            <button type="button" onClick={openAddCategory} className="btn-primary mt-4"><Plus size={16} /> Create first category</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const display = enrichCategories([cat])[0];
              return (
              <article key={cat.id} className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
                <div className="relative aspect-[16/7] bg-stone-100">
                  {display.imageUrl ? (
                    <img src={display.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-300"><ImageIcon size={28} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-3">
                    {display.tagline && <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300">{display.tagline}</p>}
                    <p className="font-semibold text-white">{display.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="text-xs text-stone-500">{categoryCounts[cat.name] ?? 0} dishes</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => startEditCategory(cat)} className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold">Edit</button>
                    <button type="button" onClick={() => removeCategory(cat.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        )
      )}

      {dishFormOpen && (
        <MenuFormSheet
          open={dishFormOpen}
          editingId={editingDish}
          form={dishForm}
          setForm={setDishForm}
          categories={categoryNames}
          saving={saving}
          uploading={uploading}
          uploadError={uploadError}
          onClose={closeDishForm}
          onSubmit={onDishSubmit}
          onImagePick={(e) => onImagePick(e, "dish")}
        />
      )}

      {dealFormOpen && (
        <DealFormSheet
          open={dealFormOpen}
          editingId={editingDeal}
          form={dealForm}
          setForm={setDealForm}
          menuItems={items}
          saving={saving}
          uploading={uploading}
          uploadError={uploadError}
          onClose={closeDealForm}
          onSubmit={onDealSubmit}
          onImagePick={(e) => onImagePick(e, "deal")}
        />
      )}

      {categoryFormOpen && (
        <CategoryFormSheet
          open={categoryFormOpen}
          editingId={editingCategory}
          form={categoryForm}
          setForm={setCategoryForm}
          saving={saving}
          uploading={uploading}
          uploadError={categoryError}
          onClose={closeCategoryForm}
          onSubmit={onCategorySubmit}
          onImagePick={onCategoryImagePick}
        />
      )}
    </div>
  );
}
