"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bike, ChefHat, ClipboardList, UtensilsCrossed, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";

type Stats = {
  todayOrders: number;
  todayRevenue: number;
  pending: number;
  preparing: number;
  outForDelivery: number;
  menuCount: number;
  chart: { date: string; label: string; orders: number; revenue: number }[];
};

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/admin/stats").then(setStats);
  }, []);

  if (!stats) return <div className="skeleton min-h-[70vh]" />;

  const cards = [
    { label: "Today’s orders", value: stats.todayOrders, icon: ClipboardList },
    { label: "Today’s revenue", value: pkr(stats.todayRevenue), icon: Wallet },
    { label: "Pending", value: stats.pending, icon: ChefHat },
    { label: "On the road", value: stats.outForDelivery, icon: Bike },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <h1 className="font-display text-4xl">Good service, Ubaid</h1>
      <p className="mt-1 text-sm text-stone-500">Live kitchen snapshot for the client demo.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-6">
            <c.icon className="text-brand-600" size={18} />
            <p className="mt-6 font-display text-4xl">{c.value}</p>
            <p className="mt-1 text-sm text-stone-500">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 flex min-h-[420px] flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Orders · last 7 days</h2>
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <p className="flex items-center gap-1">
              <UtensilsCrossed size={12} /> {stats.menuCount} dishes live
            </p>
            <p>{stats.preparing} currently plating</p>
            <Link href="/admin/orders" className="font-semibold text-brand-700">
              Open orders →
            </Link>
          </div>
        </div>
        <div className="min-h-[320px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chart}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#ea580c" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
