"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useStore } from "@/lib/store";

export function ContactFab() {
  const store = useStore();
  if (!store) return null;

  const { phone, whatsapp } = store.settings;
  const wa = whatsapp.replace(/\D/g, "");
  const waMsg = encodeURIComponent("Hi! I'd like to order from Ubaid Fast Foodz.");

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <div className="flex items-center gap-1 rounded-full border border-stone-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-md">
        <a
          href={`tel:${phone}`}
          className="grid h-10 w-10 place-items-center rounded-full text-stone-700 transition hover:bg-stone-100"
          aria-label="Call restaurant"
        >
          <Phone size={18} />
        </a>
        <span className="h-5 w-px bg-stone-200" />
        <a
          href={`https://wa.me/${wa}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white transition hover:brightness-110"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle size={20} />
        </a>
      </div>
    </div>
  );
}
