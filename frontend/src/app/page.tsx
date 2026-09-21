"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Clock, Flame, MapPin, Phone, ShieldCheck, Sparkles, Star } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { Marquee } from "@/components/home/Marquee";
import { HomeMenu } from "@/components/home/HomeMenu";
import { Reviews } from "@/components/home/Reviews";
import { Faq } from "@/components/home/Faq";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Reveal } from "@/components/home/Reveal";
import { DealCard } from "@/components/DealCard";
import { api } from "@/lib/api";
import { Deal } from "@/lib/types";

const ZONES = ["DHA & Clifton", "PECHS", "North Nazimabad", "Gulshan", "Bahria Town", "Malir Cantt", "Boat Basin", "Shahrah-e-Faisal"];

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    api<Deal[]>("/deals?active=true")
      .then(setDeals)
      .catch(() => setDeals([]));
  }, []);

  return (
    <StoreShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#fed7aa40,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#fdba7440,_transparent_50%)]" />
        <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.35]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-800 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
              </span>
              Kitchen open · Karachi
            </div>

            <h1 className="font-display text-[2.6rem] leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
              Street food energy.
              <br />
              <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                Delivered hot.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
              Ubaid Fast Foodz — charcoal tikka, crispy zinger, dum biryani and midnight broast.
              Order in under a minute. No card needed.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="#menu-start" className="btn-primary h-13 px-7 text-base shadow-float">
                See the menu <ArrowRight size={18} />
              </Link>
              <Link href="/menu" className="btn-ghost h-13 px-7 text-base">
                Order now
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:flex sm:gap-8">
              {[
                { icon: Clock, label: "30–45 min" },
                { icon: Star, label: "4.8 rating" },
                { icon: Bike, label: "Live tracking" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 px-2 py-3 text-center sm:flex-row sm:gap-2 sm:bg-transparent sm:p-0">
                  <Icon size={16} className="text-brand-600" />
                  <span className="text-xs font-semibold text-stone-600 sm:text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up animation-delay-200">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-300/40 blur-2xl animate-float" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-orange-200/50 blur-2xl animate-float animation-delay-400" />

            <div className="relative rotate-1 overflow-hidden rounded-[2rem] border-4 border-white shadow-float transition hover:rotate-0">
              <Image
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80"
                alt="Ubaid zinger burger"
                width={700}
                height={560}
                className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[440px]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-3 left-4 animate-float rounded-2xl bg-white px-4 py-3 shadow-float sm:left-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Bestseller</p>
              <p className="font-display text-lg">Zinger Burger</p>
              <p className="text-sm font-bold text-brand-700">Rs 790</p>
            </div>

            <div className="absolute -right-2 top-6 hidden animate-float animation-delay-300 rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-float sm:block">
              <p className="text-xs text-orange-100">Tonight</p>
              <p className="font-bold">+340 orders</p>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Deals */}
      {deals.length > 0 && (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="flex items-center gap-2 text-brand-600">
                <Sparkles size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.25em]">Tonight&apos;s deals</p>
              </div>
              <h2 className="font-display mt-2 text-3xl sm:text-4xl">Save on your bag</h2>
              <p className="mt-2 max-w-lg text-stone-600">Combo deals with everything included — add straight to your bag.</p>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal, i) => (
                <Reveal key={deal.id} delay={i * 80}>
                  <DealCard deal={deal} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live menu by category */}
      <HomeMenu />

      <HowItWorks />

      <Reviews />

      {/* Delivery + hours */}
      <section className="bg-brand-600 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="flex items-center gap-2 text-orange-100">
                <MapPin size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.25em]">Delivery zones</p>
              </div>
              <h2 className="font-display mt-2 text-4xl">We ride across Karachi</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <span key={z} className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                    {z}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur sm:p-8">
                <div className="flex items-center gap-2 text-orange-100">
                  <Clock size={18} />
                  <p className="text-xs font-bold uppercase tracking-widest">Opening hours</p>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <dt>Mon – Thu</dt>
                    <dd className="font-semibold">12pm – 1am</dd>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <dt>Fri – Sun</dt>
                    <dd className="font-semibold">12pm – 2am</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Kitchen phone</dt>
                    <dd className="flex items-center gap-1 font-semibold">
                      <Phone size={14} /> 0321-5556677
                    </dd>
                  </div>
                </dl>
                <Link
                  href="/menu"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white font-bold text-brand-800 sm:w-auto sm:px-8"
                >
                  Start your order
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Faq />

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-stone-950/75" />
        <div className="relative mx-auto max-w-2xl px-4 text-center text-white sm:px-6">
          <Reveal>
            <Flame className="mx-auto text-brand-400" size={36} />
            <h2 className="font-display mt-4 text-4xl sm:text-5xl">Craving something now?</h2>
            <p className="mt-3 text-orange-100">
              <ShieldCheck size={14} className="mr-1 inline" />
              Cash on delivery · No card needed
            </p>
            <Link href="/menu" className="btn-primary mt-8 h-14 px-10 text-base shadow-float">
              Order from Ubaid <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </StoreShell>
  );
}
