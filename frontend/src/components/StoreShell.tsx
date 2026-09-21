import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { RoleRedirect } from "@/components/RoleRedirect";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleRedirect />
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-orange-100 bg-stone-950 text-stone-400">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-2xl text-white">Ubaid Fast Foodz</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed">
              Karachi&apos;s go-to for zinger, biryani and broast — fired fresh, delivered fast.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Quick links</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/menu" className="hover:text-white">Full menu</Link></li>
              <li><Link href="/orders" className="hover:text-white">Track order</Link></li>
              <li><Link href="/login" className="hover:text-white">Staff login</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>0321-5556677</li>
              <li>DHA Phase 6, Karachi</li>
              <li>Cash on delivery</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs">
          © {new Date().getFullYear()} Ubaid Fast Foodz · Demo prototype
        </div>
      </footer>
    </div>
  );
}
