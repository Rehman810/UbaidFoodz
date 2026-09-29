"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Flame,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { StoreName } from "@/components/StoreName";
import { resolveLoginRedirect, useAuth } from "@/lib/auth";
import { DEFAULT_STORE_NAME, DEFAULT_STORE_TAGLINE } from "@/lib/branding";

const PERKS = [
  { icon: Clock3, text: "Track live order status" },
  { icon: MapPin, text: "Saved delivery details" },
  { icon: ShoppingBag, text: "One-tap reorder" },
];

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
      });
      router.replace(resolveLoginRedirect(user.role, next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="grid min-h-screen bg-[#fffaf5] lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/carousel/carousel-broast.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-950/60 to-brand-900/40" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 shadow-lg">
              <Flame size={22} />
            </span>
            <div>
              <p className="font-display text-2xl leading-none">{DEFAULT_STORE_NAME}</p>
              <p className="mt-1 text-sm text-orange-100/80">{DEFAULT_STORE_TAGLINE}</p>
            </div>
          </div>

          <div className="max-w-md text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-300">Your account</p>
            <h2 className="font-display mt-3 text-4xl leading-tight xl:text-5xl">
              Order faster.
              <br />
              <span className="text-brand-400">Track every bite.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Create a free account to save your details, see live order updates, and reorder your favourites in seconds.
            </p>
            <ul className="mt-8 space-y-3">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-stone-200">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon size={16} className="text-brand-300" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-stone-400">© {DEFAULT_STORE_NAME}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-10 lg:py-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            Back to menu
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Flame size={18} />
            </span>
            <StoreName className="font-display text-lg" fallback={DEFAULT_STORE_NAME} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-orange-100/80 bg-white p-6 shadow-[0_12px_40px_rgba(28,25,23,0.06)] sm:p-8">
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                  <ShieldCheck size={14} />
                  Free customer account
                </div>
                <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">Create account</h1>
                <p className="mt-2 text-sm text-stone-500">
                  Join in under a minute. We&apos;ll link past guest orders if you add your phone.
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
                    Full name
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <User size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Email
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <Mail size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Phone <span className="normal-case text-stone-400">(optional)</span>
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <Phone size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="0300 1234567"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Password
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <Lock size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </label>

                <button className="btn-primary h-12 w-full text-base shadow-float" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-stone-500">
                Already have an account?{" "}
                <Link href={loginHref} className="font-semibold text-brand-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
              {PERKS.map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm"
                >
                  <Icon size={13} className="text-brand-600" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
