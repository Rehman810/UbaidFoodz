"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cartCount, useCart } from "@/lib/cart";

export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const items = useCart((s) => s.items);
  const bounce = useCart((s) => s.bounce);
  const count = cartCount(items);

  const links = [
    { href: "/", label: "Home", match: (p: string) => p === "/" },
    { href: "/menu", label: "Menu", match: (p: string) => p.startsWith("/menu") },
    ...(user?.role === "CUSTOMER"
      ? [{ href: "/orders", label: "My orders", match: (p: string) => p.startsWith("/orders") }]
      : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Kitchen", match: (p: string) => p.startsWith("/admin") }] : []),
    ...(user?.role === "RIDER" ? [{ href: "/rider", label: "Deliveries", match: (p: string) => p.startsWith("/rider") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-[#fffaf5]/95 backdrop-blur-xl">
      <div className="mx-auto grid h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 justify-self-start">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Flame size={18} strokeWidth={2.2} />
          </span>
          <span className="truncate text-[15px] font-extrabold tracking-tight text-ink sm:text-base">
            Ubaid Fast Foodz
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.match(path);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold leading-none ${
                  active ? "bg-brand-50 text-brand-800" : "text-stone-600 hover:bg-white hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <Link
            href="/menu"
            className="inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold text-stone-600 md:hidden"
          >
            Menu
          </Link>
          <button
            onClick={() => useCart.getState().setDrawer(true)}
            className={`relative grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-ink transition ${
              bounce ? "scale-105" : ""
            }`}
            aria-label="Open cart"
          >
            <ShoppingBag size={18} strokeWidth={2} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white">
                {count}
              </span>
            )}
          </button>
          {user ? (
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold leading-none text-ink"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold leading-none text-white hover:bg-brand-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
