"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export function StoreFooter() {
  const store = useStore();
  const settings = store?.settings;
  const phone = settings?.phone ?? "0321-5556677";
  const address = settings?.address ?? "Boat Basin, Clifton Block 5, Karachi";

  return (
    <footer className="border-t border-orange-100 bg-stone-950 text-stone-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-white">Ubaid Fast Foodz</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            Karachi&apos;s go-to for zinger, biryani and broast — fired fresh, delivered fast.
          </p>
          {(settings?.instagramUrl || settings?.facebookUrl) && (
            <div className="mt-4 flex gap-3 text-sm">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
              {settings.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  TikTok
                </a>
              )}
              {settings.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  YouTube
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/menu" className="hover:text-white">Full menu</Link></li>
            <li><Link href="/orders" className="hover:text-white">Track order</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/login" className="hover:text-white">Staff login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={`tel:${phone}`} className="hover:text-white">{phone}</a></li>
            <li>{address}</li>
            <li>Cash on delivery</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} Ubaid Fast Foodz
      </div>
    </footer>
  );
}
