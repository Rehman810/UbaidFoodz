import { Navbar } from "@/components/Navbar";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-orange-100 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-stone-500 md:flex-row">
          <p className="font-display text-lg text-ink">Ubaid Fast Foodz</p>
          <p>Demo prototype · Cash on delivery across Karachi</p>
        </div>
      </footer>
    </div>
  );
}
