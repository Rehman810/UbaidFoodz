"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react";
import { PromoBanner, PublicStore } from "@/lib/types";

const FALLBACK_SLIDES = [
  {
    id: "zinger",
    title: "Zinger special",
    imageUrl: "/carousel/carousel-zinger.png",
  },
  {
    id: "biryani",
    title: "Biryani night",
    imageUrl: "/carousel/carousel-biryani.png",
  },
  {
    id: "broast",
    title: "BBQ broast",
    imageUrl: "/carousel/carousel-broast.png",
  },
];

function slideImage(banner: PromoBanner | undefined, fallbackUrl: string) {
  const url = banner?.imageUrl ?? "";
  if (!url || url.includes("unsplash.com")) return fallbackUrl;
  return url;
}

export function HeroCarousel({ store }: { store: PublicStore | null }) {
  const slides = useMemo(() => {
    const banners = store?.banners?.filter((b) => b.isActive) ?? [];
    return FALLBACK_SLIDES.map((fallback, i) => {
      const banner = banners[i];
      return {
        id: banner?.id ?? fallback.id,
        title: banner?.title ?? fallback.title,
        imageUrl: slideImage(banner, fallback.imageUrl),
        linkUrl: banner?.linkUrl || "/menu",
        sortOrder: banner?.sortOrder ?? i + 1,
        isActive: true,
      } satisfies PromoBanner;
    });
  }, [store?.banners]);

  const [idx, setIdx] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5500);
    return () => clearInterval(t);
  }, [count]);

  const deliveryMin = store?.settings.deliveryEstimateMin ?? 45;

  return (
    <section className="relative w-full overflow-hidden bg-stone-950">
      {/* Background slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== idx}
        >
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/75 to-stone-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-stone-950/20" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-6xl items-center px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            {store?.isOpen ? "Kitchen open" : "Closed now"} · Karachi
          </div>

          <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
            Street food energy.
            <br />
            <span className="text-brand-400">Delivered hot.</span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-stone-300 sm:text-lg">
            Charcoal tikka, crispy zinger, dum biryani and midnight broast — order in under a minute.
            Cash on delivery.
          </p>

          {slides[idx]?.title && (
            <p className="mt-3 text-sm font-semibold text-brand-300">
              Tonight: {slides[idx].title}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#menu-start"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-bold text-white shadow-float transition hover:bg-brand-500"
            >
              See the menu <ArrowRight size={18} />
            </Link>
            <Link
              href="/menu"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Order now
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Clock, label: `${deliveryMin} min delivery` },
              { icon: Star, label: "4.8 rating" },
              { icon: Bike, label: "Live tracking" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-stone-200 backdrop-blur-sm"
              >
                <Icon size={14} className="text-brand-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      {count > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-7 bg-brand-500" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + count) % count)}
            className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-6 sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % count)}
            className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-6 sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </section>
  );
}
