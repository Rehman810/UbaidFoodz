"use client";

import { Mail, Phone, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function RiderProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-stone-900">Your profile</h1>
        <p className="mt-1 text-sm text-stone-500">Account used to receive delivery assignments.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-stone-100 p-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
            {user.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{user.name}</p>
            <p className="text-xs font-medium text-violet-600">Delivery rider</p>
          </div>
        </div>
        <ul className="divide-y divide-stone-100 p-2">
          <li className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm">
            <Mail size={16} className="shrink-0 text-stone-400" />
            <span className="min-w-0 truncate text-stone-700">{user.email}</span>
          </li>
          <li className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm">
            <Phone size={16} className="shrink-0 text-stone-400" />
            <span className="text-stone-700">{user.phone || "No phone on file"}</span>
          </li>
          <li className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm">
            <User size={16} className="shrink-0 text-stone-400" />
            <span className="text-stone-700">Rider account</span>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-4 text-sm text-stone-500">
        New deliveries appear on the <strong className="text-stone-700">Deliveries</strong> tab when the kitchen assigns you an order from the admin panel.
      </div>
    </div>
  );
}
