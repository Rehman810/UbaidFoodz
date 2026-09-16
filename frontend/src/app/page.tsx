"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Clock, Flame, MapPin, ShieldCheck, Star, UtensilsCrossed } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";

const HIGHLIGHTS = [
  {
    title: "Karachi Biryani",
    blurb: "Dum rice, tender chicken, that Sunday-lunch aroma.",
    img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Chicken Tikka",
    blurb: "Charcoal-grilled, served with naan and raita.",
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Molten Lava Cake",
    blurb: "Warm centre, vanilla scoop — close the night right.",
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  },
];

const STEPS = [
  { icon: UtensilsCrossed, title: "Pick your heat", text: "Burgers, biryani, broast, desserts — built for Karachi cravings." },
  { icon: Clock, title: "We fire the kitchen", text: "Orders hit the pass in minutes. Track Pending → Preparing → Out." },
  { icon: Bike, title: "Rider at your gate", text: "Cash on delivery. Estimated 30–45 minutes across the city." },
];

const ZONES = ["DHA & Clifton", "PECHS & Shahrah-e-Faisal", "North Nazimabad", "Gulshan & Bahria", "Malir Cantt", "I.I. Chundrigar"];

export default function HomePage() {
  return (
    <StoreShell>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden py-10 md:py-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-100/80 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              <Flame size={14} /> Karachi’s late-night favourite
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Heat, crunch &amp; charcoal — <span className="text-brand-600">delivered fast.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-stone-600">
              Burgers, biryani, broast and desserts from Ubaid Fast Foodz. Order in under a minute.
              Cash on delivery across the city.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/menu" className="btn-primary h-14 px-8 text-base">
                Order now <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn-ghost h-14 px-8 text-base">
                Staff login
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-8 text-sm">
              <span className="flex items-center gap-2 text-stone-600">
                <Clock size={16} className="text-brand-600" /> 30–45 min
              </span>
              <span className="flex items-center gap-2 text-stone-600">
                <Bike size={16} className="text-brand-600" /> Live tracking
              </span>
              <span className="flex items-center gap-2 text-stone-600">
                <Star size={16} className="text-brand-600" /> 4.8 demo score
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-brand-200 to-orange-100" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-float">
              <Image
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80"
                alt="Ubaid zinger burger"
                width={900}
                height={700}
                className="h-[min(62vh,560px)] w-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-4 left-6 rounded-2xl bg-white px-4 py-3 shadow-float">
              <p className="text-xs text-stone-500">Most loved</p>
              <p className="font-semibold">Ubaid Zinger Burger · Rs 790</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-orange-100/80 bg-white/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Tonight</p>
          <h2 className="font-display mt-2 text-4xl md:text-5xl">Kitchen highlights</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {HIGHLIGHTS.map((c) => (
              <Link key={c.title} href="/menu" className="group overflow-hidden rounded-3xl bg-white shadow-card">
                <div className="relative h-72">
                  <Image src={c.img} alt={c.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="font-display text-2xl">{c.title}</p>
                  <p className="mt-1 text-sm text-stone-500">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-4xl">From tap to table</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">0{i + 1}</p>
                <s.icon className="mt-4 text-brand-600" />
                <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-orange-100 bg-brand-600 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-orange-100">
              <ShieldCheck size={16} /> Cash on delivery
            </p>
            <h2 className="font-display mt-2 text-4xl md:text-5xl">Hungry now? The bag’s 40 minutes out.</h2>
          </div>
          <Link href="/menu" className="inline-flex h-14 items-center rounded-full bg-white px-8 font-semibold text-brand-800">
            Browse the full menu
          </Link>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-2 text-brand-700">
            <MapPin size={18} />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">We deliver</p>
          </div>
          <h2 className="font-display mt-2 text-4xl">Karachi zones in this demo</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {ZONES.map((z) => (
              <span key={z} className="rounded-full bg-white px-5 py-3 text-sm font-semibold shadow-card">
                {z}
              </span>
            ))}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
