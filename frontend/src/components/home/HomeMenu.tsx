"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { CATEGORIES, MenuItem } from "@/lib/types";
import { Reveal } from "./Reveal";

const CAT_META: Record<string, { img: string; tag: string }> = {
  Starters: {
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=80",
    tag: "Crispy beginnings",
  },
  "Main Course": {
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    tag: "The main event",
  },
  Beverages: {
    img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    tag: "Ice-cold sips",
  },
  Desserts: {
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
    tag: "Sweet finish",
  },
};

function slug(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, "-");
}

export function HomeMenu() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState("All");
  const add = useCart((s) => s.add);

  useEffect(() => {
    api<MenuItem[]>("/menu")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  const grouped = useMemo(() => {
    if (!items) return {};
    const map: Record<string, MenuItem[]> = {};
    for (const c of CATEGORIES) map[c] = [];
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  const scrollTo = (cat: string) => {
    setActive(cat);
    if (cat === "All") {
      document.getElementById("menu-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById(`cat-${slug(cat)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="menu-start" className="scroll-mt-24 bg-[#fffaf5] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Order from the pass</p>
              <h2 className="font-display mt-2 text-4xl text-ink sm:text-5xl">Our menu</h2>
              <p className="mt-2 max-w-lg text-stone-600">
                Fresh off the grill, straight to your door. Tap a category or scroll through everything.
              </p>
            </div>
            <Link href="/menu" className="btn-ghost shrink-0 self-start sm:self-auto">
              Full menu <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>

        <div className="sticky top-16 z-30 -mx-4 mt-8 border-b border-orange-100 bg-[#fffaf5]/95 px-4 py-3 backdrop-blur-md sm:top-[72px] sm:-mx-6 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => scrollTo(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  active === c
                    ? "bg-brand-600 text-white shadow-card scale-105"
                    : "bg-white text-stone-600 hover:bg-brand-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load menu — is the backend running? ({error})
          </p>
        )}

        {!items && !error && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-72" />
            ))}
          </div>
        )}

        {items && (
          <div className="mt-10 space-y-16 sm:space-y-20">
            {CATEGORIES.map((cat, ci) => {
              const list = grouped[cat] || [];
              if (!list.length) return null;
              const meta = CAT_META[cat];
              return (
                <div key={cat} id={`cat-${slug(cat)}`} className="scroll-mt-36">
                  <Reveal delay={ci * 80}>
                    <div className="relative mb-6 overflow-hidden rounded-3xl">
                      <div className="relative h-36 sm:h-44">
                        <Image src={meta.img} alt="" fill className="object-cover" sizes="100vw" />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/50 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
                          <p className="text-xs font-bold uppercase tracking-widest text-brand-300">{meta.tag}</p>
                          <h3 className="font-display text-3xl text-white sm:text-4xl">{cat}</h3>
                          <p className="mt-1 text-sm text-orange-100">{list.length} items</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item, ii) => (
                      <Reveal key={item.id} delay={ii * 60}>
                        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-orange-100/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-float">
                          <div className="relative h-40 overflow-hidden sm:h-44">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-110"
                              sizes="(max-width:640px) 100vw, 33vw"
                            />
                            {!item.isAvailable && (
                              <div className="absolute inset-0 grid place-items-center bg-stone-900/60 text-sm font-bold text-white">
                                Sold out tonight
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold leading-snug">{item.name}</h4>
                              <span className="shrink-0 font-bold text-brand-700">{pkr(item.price)}</span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-stone-500">{item.description}</p>
                            <button
                              disabled={!item.isAvailable}
                              onClick={() => add(item)}
                              className="btn-primary mt-4 w-full py-2.5 text-sm"
                            >
                              <Plus size={15} /> Add to bag
                            </button>
                          </div>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
