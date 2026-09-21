"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import { homeFor, resolveLoginRedirect, useAuth } from "@/lib/auth";

const DEMOS = [
  { role: "Admin", email: "admin@ubaidfastfoodz.com", password: "demo123" },
  { role: "Rider", email: "rider@ubaidfastfoodz.com", password: "demo123" },
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
    <div className="grid min-h-screen md:grid-cols-2">
      <div
        className="relative hidden bg-cover bg-center md:block"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-brand-900/30" />
        <div className="absolute bottom-10 left-10 text-white">
          <p className="flex items-center gap-2 font-display text-3xl">
            <Flame /> Ubaid Fast Foodz
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/80">Staff, riders and hungry Karachiites — one kitchen.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
          <h1 className="font-display text-4xl">Welcome back</h1>
          <p className="text-sm text-stone-500">Staff sign-in for admin and rider dashboards.</p>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          <button className="btn-primary h-12 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Demo credentials</p>
            {DEMOS.map((d) => (
              <button
                type="button"
                key={d.email}
                disabled={busy}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  signIn(d.email, d.password, true);
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3 text-left text-sm hover:border-brand-300 disabled:opacity-60"
              >
                <span className="font-semibold text-brand-800">{d.role}</span>
                <span className="text-stone-500">
                  {d.email} · {d.password}
                </span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
