"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bike,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PublicStore } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
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
  { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
];

const SIDEBAR_KEY = "uff-admin-sidebar-collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [kitchenOpen, setKitchenOpen] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    api<PublicStore>("/settings/public")
      .then((data) => setKitchenOpen(data.isOpen))
      .catch(() => setKitchenOpen(null));
  }, [path]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.replace("/login?next=/admin");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffaf5] text-stone-400">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-ping rounded-full bg-brand-500" />
          Opening kitchen dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf5] lg:flex">
      <aside
        className={`lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col lg:transition-[width] lg:duration-300 ${
          collapsed ? "lg:w-[4.75rem]" : "lg:w-72"
        }`}
      >
        <div className="flex h-full flex-col border-b border-orange-100/80 bg-white shadow-sm lg:border-b-0 lg:border-r">
          <div className={`flex items-center gap-3 py-4 ${collapsed ? "lg:justify-center lg:px-2" : "px-4"}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md shadow-brand-500/20">
              <Flame size={18} />
            </span>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="font-display text-lg leading-tight text-stone-900">Kitchen OS</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">Ubaid Fast Foodz</p>
            </div>
          </div>

          <nav className={`flex gap-1 overflow-x-auto py-2 lg:flex-1 lg:flex-col lg:overflow-y-auto ${collapsed ? "px-2 lg:px-2" : "px-3"}`}>
            {NAV.map((n) => {
              const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.label}
                  className={`flex shrink-0 items-center rounded-xl text-sm font-semibold transition ${
                    collapsed ? "lg:justify-center lg:px-0 lg:py-3" : "gap-2.5 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <Icon size={18} className={active ? "text-brand-600" : ""} />
                  <span className={collapsed ? "lg:hidden" : ""}>{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={`hidden border-t border-orange-100/80 p-3 lg:block ${collapsed ? "px-2" : ""}`}>
            {!collapsed && (
              <div className="mb-2 px-1">
                <p className="truncate text-sm font-semibold text-stone-900">{user.name}</p>
                <p className="truncate text-xs text-stone-400">{user.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`mb-1 flex w-full items-center rounded-xl py-2 text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 ${
                collapsed ? "justify-center" : "gap-2 px-3"
              }`}
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
              <span className={collapsed ? "sr-only" : ""}>Collapse</span>
            </button>
            <button
              onClick={() => { logout(); router.push("/"); }}
              title="Sign out"
              className={`flex w-full items-center rounded-xl py-2 text-sm font-medium text-stone-500 hover:bg-rose-50 hover:text-rose-700 ${
                collapsed ? "justify-center" : "gap-2 px-3"
              }`}
            >
              <LogOut size={16} />
              <span className={collapsed ? "sr-only" : ""}>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[4.75rem]" : "lg:pl-72"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-orange-100/80 bg-[#fffaf5]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:border-brand-200 hover:text-brand-700 lg:grid"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <p className="text-sm font-bold text-stone-900">
              {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold sm:flex ${
                kitchenOpen === false
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  kitchenOpen === false ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              {kitchenOpen === false ? "Kitchen closed" : "Kitchen online"}
            </span>
            <Link
              href="/"
              className="hidden rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 sm:inline"
            >
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

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-orange-100 bg-white/95 backdrop-blur-md lg:hidden">
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
