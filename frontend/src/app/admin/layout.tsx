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
  Receipt,
  Settings,
  UserCog,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Role } from "@/lib/types";
import { PoweredBy } from "@/components/PoweredBy";
import { StoreLogo } from "@/components/StoreLogo";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PRODUCT_NAME, storeDisplayName } from "@/lib/branding";
import { useStore } from "@/lib/store";
import { PublicStore } from "@/lib/types";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
      { href: "/admin/pos", label: "POS", icon: Receipt },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/tracking", label: "Live tracking", icon: Map },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
      { href: "/admin/areas", label: "Areas", icon: MapPinned },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/riders", label: "Riders", icon: Bike },
      { href: "/admin/staff", label: "Staff", icon: UserCog },
    ],
  },
  {
    title: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const MOBILE_NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
  { href: "/admin/pos", label: "POS", icon: Receipt },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const SIDEBAR_KEY = "uff-admin-sidebar-collapsed";

function navSectionsForRole(role: Role): NavSection[] {
  if (role === "CHEF") {
    return [
      {
        title: "Operations",
        items: [{ href: "/admin/kitchen", label: "Kitchen", icon: Flame }],
      },
    ];
  }
  if (role === "CASHIER") {
    return [
      {
        title: "Operations",
        items: [
          { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
          { href: "/admin/pos", label: "POS", icon: Receipt },
          { href: "/admin/orders", label: "Orders", icon: ClipboardList },
        ],
      },
      {
        title: "People",
        items: [{ href: "/admin/customers", label: "Customers", icon: Users }],
      },
    ];
  }
  return NAV_SECTIONS;
}

const MOBILE_FOR_ROLE: Record<Role, typeof MOBILE_NAV> = {
  ADMIN: MOBILE_NAV,
  CHEF: [{ href: "/admin/kitchen", label: "Kitchen", icon: Flame }],
  CASHIER: [
    { href: "/admin/pos", label: "POS", icon: Receipt },
    { href: "/admin/kitchen", label: "Kitchen", icon: Flame },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/customers", label: "Customers", icon: Users },
  ],
  RIDER: MOBILE_NAV,
  CUSTOMER: MOBILE_NAV,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, logoutEverywhere } = useAuth();
  const store = useStore();
  const storeName = storeDisplayName(store?.settings);
  const router = useRouter();
  const path = usePathname();
  const [kitchenOpen, setKitchenOpen] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    function load() {
      api<PublicStore>("/settings/public")
        .then((data) => setKitchenOpen(data.isOpen))
        .catch(() => setKitchenOpen(null));
    }
    load();
    window.addEventListener("store-refresh", load);
    return () => window.removeEventListener("store-refresh", load);
  }, [path]);

  const isStaffLogin = path === "/admin/login";

  useEffect(() => {
    if (loading || isStaffLogin) return;
    if (!user) {
      router.replace("/admin/login?next=/admin");
      return;
    }
    if (user.role === "CHEF" && !path.startsWith("/admin/kitchen")) {
      router.replace("/admin/kitchen");
      return;
    }
    if (user.role === "CASHIER") {
      const allowedPath = ["/admin/pos", "/admin/kitchen", "/admin/orders", "/admin/customers"].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
      );
      if (!allowedPath) router.replace("/admin/pos");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/login?next=/admin");
    }
  }, [user, loading, router, path, isStaffLogin]);

  if (isStaffLogin) return <>{children}</>;

  const allowed =
    user?.role === "ADMIN" || user?.role === "CHEF" || user?.role === "CASHIER";

  if (loading || !user || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffaf5] text-stone-400">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-ping rounded-full bg-brand-500" />
          Opening staff dashboard…
        </div>
      </div>
    );
  }

  const sidebarSections = navSectionsForRole(user.role);
  const mobileNav = MOBILE_FOR_ROLE[user.role];
  const isPos = path.startsWith("/admin/pos");
  const isKitchen = path.startsWith("/admin/kitchen");

  return (
    <div className="min-h-screen bg-[#fffaf5] lg:flex">
      <aside
        className={`${isPos ? "hidden lg:flex" : ""} lg:fixed lg:inset-y-0 lg:z-30 lg:flex-col lg:transition-[width] lg:duration-300 ${
          collapsed ? "lg:w-[4.75rem]" : "lg:w-72"
        }`}
      >
        <div className="flex h-full flex-col border-b border-orange-100/80 bg-white shadow-sm lg:border-b-0 lg:border-r">
          <div className={`flex items-center gap-3 py-4 ${collapsed ? "lg:justify-center lg:px-2" : "px-4"}`}>
            <StoreLogo
              logoUrl={store?.settings.logoUrl}
              size="md"
              fallbackClassName="bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md shadow-brand-500/20"
            />
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="font-display text-lg leading-tight text-stone-900">{storeName || PRODUCT_NAME}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">{PRODUCT_NAME}</p>
            </div>
          </div>

          <nav className={`flex gap-1 overflow-x-auto py-2 lg:flex-1 lg:flex-col lg:gap-0 lg:overflow-y-auto ${collapsed ? "px-2 lg:px-2" : "px-3"}`}>
            {sidebarSections.map((section, sectionIdx) => (
              <div
                key={section.title}
                className={`flex shrink-0 gap-1 lg:mb-3 lg:w-full lg:flex-col lg:last:mb-0 ${
                  sectionIdx > 0 ? "lg:border-t lg:border-orange-100/80 lg:pt-3" : ""
                }`}
              >
                <p
                  className={`mb-1.5 hidden px-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 lg:block ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {section.title}
                </p>
                {section.items.map((n) => {
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
              </div>
            ))}
          </nav>

          <div className={`relative hidden border-t border-orange-100/80 p-3 lg:block ${collapsed ? "px-2" : ""}`}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex w-full items-center rounded-xl px-2 py-2 text-left hover:bg-stone-50 ${collapsed ? "justify-center" : "gap-2"}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-900">{user.name}</span>
                  <span className="block truncate text-xs text-stone-400">{user.email}</span>
                </span>
              )}
            </button>
            {menuOpen && (
              <div role="menu" className="absolute bottom-16 left-3 z-40 w-52 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                >
                  <LogOut size={14} /> Sign out
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  onClick={() => { setMenuOpen(false); void logoutEverywhere().then(() => router.push("/")); }}
                >
                  Sign out everywhere
                </button>
              </div>
            )}
            <div className={collapsed ? "mt-2 text-center" : "mt-3 border-t border-orange-100/80 pt-3 px-1"}>
              <PoweredBy
                variant={collapsed ? "minimal" : "inline"}
                className="[&_a]:text-brand-600 [&_a:hover]:text-brand-800"
              />
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden lg:h-dvh lg:max-h-dvh ${
          collapsed ? "lg:pl-[4.75rem]" : "lg:pl-72"
        }`}
      >
        <header
          className={`sticky top-0 z-20 flex items-center justify-between border-b border-orange-100/80 bg-[#fffaf5]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 ${
            isPos ? "hidden lg:flex" : ""
          }`}
        >
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
              <span className="mr-2">{storeName}</span>
              <span className="font-medium text-stone-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
              </span>
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
              {kitchenOpen === false ? "Kitchen offline" : "Kitchen online"}
            </span>
            <Link
              href="/"
              className="hidden rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 sm:inline"
            >
              View storefront →
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 lg:hidden"
                aria-label="Account menu"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-stone-200 bg-white p-1 shadow-lg lg:hidden">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    onClick={() => { setMenuOpen(false); logout(); router.push("/"); }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    onClick={() => { setMenuOpen(false); void logoutEverywhere().then(() => router.push("/")); }}
                  >
                    Sign out everywhere
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main
          className={
            isPos
              ? "flex min-h-0 flex-1 flex-col overflow-y-auto p-0 lg:p-8 lg:pb-8"
              : isKitchen
                ? "flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8"
                : "flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8"
          }
        >
          {children}
        </main>

        <nav
          className={`fixed bottom-0 left-0 right-0 z-30 border-t border-orange-100 bg-white/95 backdrop-blur-md lg:hidden ${
            isPos ? "hidden" : ""
          }`}
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
            {mobileNav.map((n) => {
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
