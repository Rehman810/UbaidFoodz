"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { createPublicReservation, fetchAvailability } from "@/modules/dine-in/api";
import { storeDisplayName } from "@/lib/branding";
import { api } from "@/lib/api";
import { fetchPublicBranches } from "@/lib/storefront-branches";
import type { StorefrontBranch } from "@/lib/storefront-branches";

function emailOk(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function phoneOk(v: string) {
  const d = v.replace(/\D/g, "");
  return /^03\d{9}$/.test(d) || /^923\d{9}$/.test(d);
}

export default function BookTablePage() {
  const [branches, setBranches] = useState<StorefrontBranch[]>([]);
  const [storeName, setStoreName] = useState("Restaurant");
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState("2");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ email: string; branchName: string; startsAt: string } | null>(null);

  const idempotencyKey = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `book-${Date.now()}`;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [pub, s] = await Promise.all([
          fetchPublicBranches().catch(() => ({ branches: [] as StorefrontBranch[], defaultBranchId: "" })),
          api<{ settings?: { storeName?: string } }>("/settings/public").catch(() => null),
        ]);
        setBranches(pub.branches);
        const pick = pub.branches.find((b) => b.id === pub.defaultBranchId) ?? pub.branches[0];
        if (pick) setBranchId(pick.id);
        setStoreName(storeDisplayName(s?.settings));
        const today = new Date();
        setDate(today.toISOString().slice(0, 10));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!branchId || !date) return;
    void fetchAvailability(branchId, date, Number(party) || 2)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]));
  }, [branchId, date, party]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!emailOk(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!phoneOk(phone)) {
      setError("Enter a valid Pakistan mobile number (03XXXXXXXXX).");
      return;
    }
    if (!slot) {
      setError("Choose an available time slot.");
      return;
    }
    setBusy(true);
    try {
      const res = await createPublicReservation({
        branchId,
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        partySize: Number(party) || 2,
        startsAt: slot,
        notes: notes.trim() || undefined,
        idempotencyKey,
        website: honeypot,
      });
      const branchName = branches.find((b) => b.id === branchId)?.name ?? "Branch";
      setDone({
        email: email.trim(),
        branchName,
        startsAt: res.reservation.startsAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book table");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf5] to-white px-4 py-12 dark:from-stone-950 dark:to-stone-900">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <Sparkles className="mx-auto text-brand-600" size={28} />
          <h1 className="mt-2 font-display text-3xl font-bold text-stone-900 dark:text-stone-50">Book a table</h1>
          <p className="mt-2 text-sm text-stone-500">{storeName}</p>
          <p className="mt-1 text-xs text-stone-400">No payment required — request only until the manager confirms.</p>
        </div>

        {done ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Request received</p>
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
              Confirmation will be sent to <strong>{done.email}</strong> after the manager approves.
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {done.branchName} · {new Date(done.startsAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <input type="text" className="hidden" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            <label className="block text-sm">
              <span className="font-semibold">Branch</span>
              <select className="input mt-1" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="input" type="email" placeholder="Email (required)" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" placeholder="Mobile 03XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <input className="input" placeholder="Party size" value={party} onChange={(e) => setParty(e.target.value)} />
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <label className="block text-sm">
              <span className="font-semibold flex items-center gap-1"><Calendar size={14} /> Time</span>
              <select className="input mt-1" value={slot} onChange={(e) => setSlot(e.target.value)} required>
                <option value="">Pick a slot</option>
                {slots.map((s) => (
                  <option key={s} value={s}>{new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</option>
                ))}
              </select>
            </label>
            <textarea className="input min-h-[72px]" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Sending…" : "Request booking"}
            </button>
            <p className="flex items-start gap-2 text-[11px] text-stone-500">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              Your seat is not held until you receive a confirmation email from the restaurant.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
