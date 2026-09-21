"use client";

import { useCallback } from "react";
import { Mail, Phone, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { pkr, formatWhen } from "@/lib/format";
import { AdminCustomer } from "@/lib/admin-types";
import { usePoll } from "@/hooks/usePoll";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function CustomersPage() {
  const load = useCallback(() => api<AdminCustomer[]>("/admin/customers"), []);
  const { data: customers, loading } = usePoll(load, 30000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-stone-500">{customers?.length ?? 0} registered customers</p>
      </div>

      {loading && <div className="skeleton h-40" />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customers?.map((c) => (
          <article key={c.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-stone-900">{c.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                  <Mail size={12} /> {c.email}
                </p>
                {c.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                    <Phone size={12} /> {c.phone}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                {c.orderCount} orders
              </span>
            </div>
            <dl className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Total spent</dt>
                <dd className="font-bold text-brand-700">{pkr(c.totalSpent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Joined</dt>
                <dd>{formatWhen(c.createdAt)}</dd>
              </div>
            </dl>
            {c.lastOrder && (
              <div className="mt-3 rounded-xl bg-stone-50 p-3">
                <p className="flex items-center gap-1 text-xs font-medium text-stone-500">
                  <ShoppingBag size={12} /> Last order
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <StatusBadge status={c.lastOrder.status} />
                  <span className="text-sm font-bold">{pkr(c.lastOrder.total)}</span>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
