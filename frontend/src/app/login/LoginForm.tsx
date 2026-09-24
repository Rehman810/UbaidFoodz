"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bike, Flame, Lock, Mail, ShieldCheck, UserCog } from "lucide-react";
import { homeFor, resolveLoginRedirect, useAuth } from "@/lib/auth";

const DEMOS = [
  {
    role: "Admin",
    email: "admin@ubaidfastfoodz.com",
    password: "demo123",
    icon: UserCog,
    hint: "Orders, menu & store settings",
  },
  {
    role: "Rider",
    email: "rider@ubaidfastfoodz.com",
    password: "demo123",
    icon: Bike,
    hint: "Live deliveries & route updates",
  },
];

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState(DEMOS[0].email);
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(asEmail: string, asPassword: string, ignoreNext = false) {
    setBusy(true);
    setError("");
    try {
      const user = await login(asEmail, asPassword);
      const dest = ignoreNext ? homeFor(user.role) : resolveLoginRedirect(user.role, next);
      router.replace(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  return (
    <div className="grid min-h-screen bg-[#fffaf5] lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/carousel/carousel-zinger.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/90 via-stone-950/55 to-brand-900/35" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 shadow-lg">
              <Flame size={22} />
            </span>
            <div>
              <p className="font-display text-2xl leading-none">Ubaid Fast Foodz</p>
              <p className="mt-1 text-sm text-orange-100/80">Kitchen operations portal</p>
            </div>
          </div>

          <div className="max-w-md text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-300">Staff access</p>
            <h2 className="font-display mt-3 text-4xl leading-tight xl:text-5xl">
              Run the kitchen.
              <br />
              <span className="text-brand-400">Deliver hot.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Sign in to manage orders, update the menu, and keep riders moving across Karachi.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Live orders", "Menu control", "Rider dispatch"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-stone-200 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-stone-400">© Ubaid Fast Foodz · Karachi</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-10 lg:py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            Back to menu
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Flame size={18} />
            </span>
            <span className="font-display text-lg">Ubaid</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-orange-100/80 bg-white p-6 shadow-[0_12px_40px_rgba(28,25,23,0.06)] sm:p-8">
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                  <ShieldCheck size={14} />
                  Secure staff login
                </div>
                <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">Welcome back</h1>
                <p className="mt-2 text-sm text-stone-500">
                  Admin and rider dashboards — not for customer checkout.
                </p>
              </div>

              {error && (
                <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Email
                  </span>
                  <span className="relative block">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      className="input pl-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@ubaidfastfoodz.com"
                      required
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Password
                  </span>
                  <span className="relative block">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      className="input pl-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                    />
                  </span>
                </label>

                <button className="btn-primary h-12 w-full text-base shadow-float" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                Quick demo access
              </p>
              <div className="space-y-2">
                {DEMOS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      type="button"
                      key={d.email}
                      disabled={busy}
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.password);
                        signIn(d.email, d.password, true);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md disabled:opacity-60"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-stone-900">{d.role}</span>
                        <span className="block truncate text-xs text-stone-500">{d.hint}</span>
                      </span>
                      <span className="hidden text-[11px] font-medium text-stone-400 sm:block">{d.password}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
