"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoreShell } from "@/components/StoreShell";
import { StatusTrack } from "@/components/StatusTrack";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatWhen, pkr } from "@/lib/format";
import { Order } from "@/lib/types";
import { ClipboardList } from "lucide-react";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Order[]>("/orders/mine").then(setOrders).catch(() => setOrders([]));
  }, [user]);

  return (
    <StoreShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">My orders</h1>
        {loading && <div className="skeleton mt-6 h-40" />}
        {!loading && !user && (
          <p className="mt-4 text-sm text-stone-500">
            Guest orders are tracked from your confirmation page.{" "}
            <Link href="/menu" className="font-semibold text-brand-700">
              Order again
            </Link>
            , or{" "}
            <Link href="/login?next=/orders" className="font-semibold text-brand-700">
              sign in
            </Link>{" "}
            if you have an account.
          </p>
        )}
        {orders && orders.length === 0 && (
          <div className="card mt-8 grid place-items-center px-6 py-16 text-center">
            <ClipboardList className="mb-3 text-brand-500" />
            <p className="font-display text-2xl">No orders yet</p>
            <p className="mt-1 text-sm text-stone-500">Your next biryani is one tap away.</p>
            <Link href="/menu" className="btn-primary mt-5">
              Browse menu
            </Link>
          </div>
        )}
        <ul className="mt-6 space-y-4">
          {orders?.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card block p-5 transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-brand-700">{pkr(o.total)}</p>
                </div>
                <p className="mt-1 text-xs text-stone-500">{formatWhen(o.createdAt)}</p>
                <div className="mt-4">
                  <StatusTrack status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </StoreShell>
  );
}
