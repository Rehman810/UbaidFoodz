"use client";

import { useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { AdminStats } from "@/lib/admin-types";
import { STATUS_LABEL } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { StatCard } from "@/components/admin/StatCard";
import { TrendingUp, Wallet, ClipboardList, Users } from "lucide-react";

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#78716c"];

export default function AnalyticsPage() {
  const fetchStats = useCallback(() => api<AdminStats>("/admin/stats"), []);
  const { data: stats, loading } = usePoll(fetchStats, 30000);

  if (loading || !stats) return <div className="skeleton h-96" />;

  const statusData = Object.entries(stats.statusBreakdown).map(([status, count]) => ({
    name: STATUS_LABEL[status as keyof typeof STATUS_LABEL] || status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-stone-500">Revenue, categories, and order breakdown.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lifetime revenue" value={pkr(stats.totalRevenue)} icon={Wallet} />
        <StatCard label="Total orders" value={stats.totalOrders} icon={ClipboardList} accent="blue" />
        <StatCard label="Avg order (today)" value={pkr(stats.avgOrderValue)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Registered customers" value={stats.customerCount} icon={Users} accent="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Revenue by day</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => pkr(v)} />
                <Bar dataKey="revenue" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Orders by status</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Category performance</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => pkr(v)} />
                <Bar dataKey="revenue" fill="#c2410c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Best sellers</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-stone-400">
                <th className="pb-2">Item</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.topItems.map((item) => (
                <tr key={item.name} className="border-b border-stone-50">
                  <td className="py-2.5 font-medium">{item.name}</td>
                  <td className="py-2.5 text-stone-500">{item.qty}</td>
                  <td className="py-2.5 text-right font-semibold text-brand-700">{pkr(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
