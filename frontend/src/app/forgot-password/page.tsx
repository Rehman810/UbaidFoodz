"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
        <h1 className="font-display mt-6 text-3xl text-stone-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter your customer account email. We&apos;ll send a reset link if an account exists.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</span>
            <div className="relative mt-1.5">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="input pl-10"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {msg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</p>}
          <button type="submit" className="btn-primary h-12 w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </StoreShell>
  );
}
