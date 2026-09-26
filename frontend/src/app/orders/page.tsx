"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoreShell } from "@/components/StoreShell";
import { OrderTrackForm } from "@/components/OrderTrackForm";
import { StatusTrack } from "@/components/StatusTrack";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatWhen, pkr } from "@/lib/format";
import { FulfillmentBadge } from "@/components/FulfillmentBadge";
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
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 pb-28 sm:px-6 md:pb-16">
        <div className="space-y-2">
          <h1 className="font-display text-4xl">Orders</h1>
          <p className="text-sm text-stone-500">
            Track any order with your order number and phone. Sign in to see your full history.
          </p>
        </div>

        <OrderTrackForm />

        {loading && user && <div className="skeleton h-40 rounded-3xl" />}

        {user && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-stone-900">My orders</h2>
            {orders && orders.length === 0 && (
              <div className="card grid place-items-center px-6 py-16 text-center">
                <ClipboardList className="mb-3 text-brand-500" />
                <p className="font-display text-2xl">No orders yet</p>
                <p className="mt-1 text-sm text-stone-500">Your next biryani is one tap away.</p>
                <Link href="/menu" className="btn-primary mt-5">
                  Browse menu
                </Link>
              </div>
            )}
            <ul className="space-y-4">
              {orders?.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="card block p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{o.orderNumber}</p>
                        <FulfillmentBadge type={o.fulfillmentType} size="md" />
                      </div>
                      <p className="text-brand-700">{pkr(o.total)}</p>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{formatWhen(o.createdAt)}</p>
                    <div className="mt-5">
                      <StatusTrack status={o.status} fulfillmentType={o.fulfillmentType} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && !user && (
          <p className="text-center text-sm text-stone-500">
            Have an account?{" "}
            <Link href="/login?next=/orders" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>{" "}
            to save order history.
          </p>
        )}
      </div>
    </StoreShell>
  );
}
