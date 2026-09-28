"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flame, Lock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Invalid reset link. Request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.replace("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-[#fffaf5] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/carousel/carousel-zinger.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-950/60 to-brand-900/40" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 shadow-lg">
              <Flame size={22} />
            </span>
            <div>
              <p className="font-display text-2xl leading-none">Ubaid Fast Foodz</p>
              <p className="mt-1 text-sm text-orange-100/80">Secure sign-in</p>
            </div>
          </div>

          <div className="max-w-md text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-300">Almost there</p>
            <h2 className="font-display mt-3 text-4xl leading-tight xl:text-5xl">
              Choose a new
              <br />
              <span className="text-brand-400">password.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Pick something strong you haven&apos;t used before. You&apos;ll be signed in on the next screen.
            </p>
          </div>

          <p className="text-xs text-stone-400">© Ubaid Fast Foodz · Karachi</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-10 lg:py-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-brand-700"
          >
            <ArrowLeft size={16} />
            Back to sign in
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
                  New password
                </div>
                <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">Set new password</h1>
                {!token && (
                  <p className="mt-2 text-sm text-red-600">
                    This link is invalid or expired.{" "}
                    <Link href="/forgot-password" className="font-semibold underline">
                      Request a new one
                    </Link>
                    .
                  </p>
                )}
              </div>

              {error && (
                <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    New password
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <Lock size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-stone-400"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Confirm password
                  </span>
                  <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                    <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
                      <Lock size={16} />
                    </span>
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-stone-400"
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  className="btn-primary h-12 w-full text-base shadow-float"
                  disabled={busy || !token}
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
