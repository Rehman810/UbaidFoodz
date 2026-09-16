"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Flame, LayoutDashboard, ClipboardList, UtensilsCrossed, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.push("/login?next=/admin");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <div className="grid min-h-screen place-items-center text-stone-500">Opening kitchen…</div>;
  }

  return (
    <div className="min-h-screen bg-[#fff7ed] md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-orange-100 bg-white md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-600 text-white">
            <Flame size={16} />
          </span>
          <div>
            <p className="font-display text-lg leading-tight">Kitchen</p>
            <p className="text-[11px] text-stone-500">Ubaid Fast Foodz</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {NAV.map((n) => {
            const active = path === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold ${
                  active ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-brand-50"
                }`}
              >
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="mt-auto flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-stone-500"
          >
            <LogOut size={16} /> Sign out
          </button>
        </nav>
      </aside>
      <div className="min-h-[calc(100vh-1px)] p-4 md:p-8">{children}</div>
    </div>
  );
}
