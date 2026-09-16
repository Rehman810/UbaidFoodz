"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, MapPin, Phone, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pkr } from "@/lib/format";
import { Order } from "@/lib/types";

export default function RiderPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "RIDER")) router.push("/login?next=/rider");
  }, [loading, user, router]);

  async function load() {
    setOrders(await api<Order[]>("/rider/orders"));
  }

  useEffect(() => {
    if (user?.role === "RIDER") load();
  }, [user]);

  async function act(id: string, action: "PICKED_UP" | "DELIVERED") {
    await api(`/rider/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ action }) });
    load();
  }

  if (loading || !user || user.role !== "RIDER") {
    return <div className="grid min-h-screen place-items-center">Loading runs…</div>;
  }

  const active = orders.filter((o) => o.status !== "DELIVERED");
  const done = orders.filter((o) => o.status === "DELIVERED");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#fffaf5] px-4 pb-10">
      <header className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Rider app</p>
          <h1 className="font-display text-3xl">Hey, {user.name.split(" ")[0]}</h1>
        </div>
        <button className="btn-ghost h-10 px-3 text-xs" onClick={() => { logout(); router.push("/"); }}>
          Sign out
        </button>
      </header>

      {active.length === 0 && (
        <div className="card mt-4 px-5 py-14 text-center">
          <Bike className="mx-auto mb-3 text-brand-600" />
          <p className="font-display text-2xl">No active drops</p>
          <p className="mt-1 text-sm text-stone-500">When kitchen assigns you a bag, it shows up here.</p>
        </div>
      )}

      <div className="space-y-4">
        {active.map((o) => (
          <article key={o.id} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{o.orderNumber}</p>
            <p className="font-display text-2xl">{pkr(o.total)}</p>
            <p className="mt-3 flex items-start gap-2 text-sm">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
              {o.deliveryAddress}
            </p>
            <a href={`tel:${o.customerPhone}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Phone size={16} /> {o.customerName} · {o.customerPhone}
            </a>
            <ul className="mt-3 text-sm text-stone-500">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}× {i.nameAtOrder}
                </li>
              ))}
            </ul>
            <button
              className="btn-ghost mt-4 h-14 w-full text-base"
              onClick={() => act(o.id, "PICKED_UP")}
            >
              Picked up
            </button>
            <button className="btn-primary mt-3 h-14 w-full text-base" onClick={() => act(o.id, "DELIVERED")}>
              <Check size={18} /> Delivered
            </button>
          </article>
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-stone-500">Completed</h2>
          <ul className="mt-2 space-y-2">
            {done.slice(0, 6).map((o) => (
              <li key={o.id} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                <span>{o.orderNumber}</span>
                <span className="text-emerald-600">Delivered</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
