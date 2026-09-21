"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bike, LogOut, Package, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

const TABS = [
  { href: "/rider", label: "Deliveries", icon: Package, match: (p: string) => p === "/rider" },
  { href: "/rider/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/rider/profile") },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "RIDER") {
      router.replace("/login?next=/rider");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#fffaf5] text-stone-500">
        Loading rider app…
      </div>
    );
  }

  if (!user || user.role !== "RIDER") {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#fffaf5] text-stone-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-[#fffaf5]">
      <header className="sticky top-0 z-30 border-b border-orange-100/80 bg-[#fffaf5]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
              <Bike size={18} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Rider</p>
              <p className="text-sm font-semibold text-stone-900">{user.name.split(" ")[0]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600"
          >
            <LogOut size={14} /> Out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((tab) => {
            const active = tab.match(path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold ${
                  active ? "text-violet-700" : "text-stone-400"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
