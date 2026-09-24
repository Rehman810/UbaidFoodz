"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  Bike,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/tracking", label: "Live tracking", icon: Map },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/areas", label: "Areas", icon: MapPinned },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/riders", label: "Riders", icon: Bike },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/tracking", label: "Board", icon: Map },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.replace("/login?next=/admin");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-950 text-stone-400">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-ping rounded-full bg-brand-500" />
          Opening kitchen dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ef] lg:flex">
      {/* Sidebar */}
      <aside className="lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <div className="flex h-full flex-col border-b border-stone-800 bg-stone-950 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <Flame size={18} />
            </span>
            <div>
              <p className="font-display text-lg leading-tight text-white">Kitchen OS</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">Ubaid Fast Foodz</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-1 lg:flex-col lg:overflow-visible">
            {NAV.map((n) => {
              const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-900/30"
                      : "text-stone-400 hover:bg-stone-900 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden border-t border-stone-800 p-4 lg:block">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-stone-400">{user.email}</p>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-400 hover:bg-stone-900 hover:text-white"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200/80 bg-[#f4f2ef]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <p className="text-sm text-stone-500">
            {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Kitchen online
            </span>
            <Link href="/" className="hidden text-xs font-semibold text-brand-700 hover:underline sm:inline">
              View storefront →
            </Link>
            <button
              type="button"
              onClick={() => { logout(); router.replace("/login"); }}
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 lg:hidden"
            >
              <LogOut size={14} /> Out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8">{children}</main>

        {/* Mobile quick nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="grid grid-cols-4">
            {MOBILE_NAV.map((n) => {
              const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
                    active ? "text-brand-700" : "text-stone-400"
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </div>
  );
}
