"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Flame, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Marquee } from "@/components/home/Marquee";
import { useStore } from "@/lib/store";
import { HomeMenu } from "@/components/home/HomeMenu";
import { Reviews } from "@/components/home/Reviews";
import { Faq } from "@/components/home/Faq";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Reveal } from "@/components/home/Reveal";
import { DealCard } from "@/components/DealCard";
import { api } from "@/lib/api";
import { Deal, DeliveryArea } from "@/lib/types";

export default function HomePage() {
  const store = useStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    api<Deal[]>("/deals?active=true")
      .then(setDeals)
      .catch(() => setDeals([]));
    api<DeliveryArea[]>("/delivery-areas")
      .then((areas) => setZones(areas.map((a) => a.name)))
      .catch(() => setZones([]));
  }, []);

  return (
    <StoreShell>
      <HeroCarousel store={store} />

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
                {(zones.length ? zones.slice(0, 12) : ["Loading areas…"]).map((z) => (
                  <span key={z} className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                    {z}
                  </span>
                ))}
                {zones.length > 12 && (
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                    +{zones.length - 12} more
                  </span>
                )}
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
                    <dt>Daily</dt>
                    <dd className="font-semibold">{store?.hoursLabel ?? "7:00 PM – 2:30 AM"}</dd>
                  </div>
                  {store?.settings.freeDeliveryAbove != null && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt>Free delivery</dt>
                      <dd className="font-semibold">Above Rs {Number(store.settings.freeDeliveryAbove).toLocaleString("en-PK")}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Kitchen phone</dt>
                    <dd className="flex items-center gap-1 font-semibold">
                      <Phone size={14} /> {store?.settings.phone ?? "0321-5556677"}
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
