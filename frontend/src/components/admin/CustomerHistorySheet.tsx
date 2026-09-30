"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, X } from "lucide-react";
import { AdminCustomer } from "@/lib/admin-types";
import { fetchCustomerOrders } from "@/lib/admin-customers";
import { formatWhen, pkr } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "./StatusBadge";

const CLOSE_MS = 340;

export function CustomerHistorySheet({
  customer,
  onClose,
}: {
  customer: AdminCustomer | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState<
    Awaited<ReturnType<typeof fetchCustomerOrders>>["orders"]
  >([]);

  const close = useCallback(() => {
    setClosing(true);
    setVisible(false);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (!customer) return;
    setPage(1);
    setClosing(false);
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [customer, close]);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    setError("");
    fetchCustomerOrders(customer.id, {
      limit: PAGE_SIZE.list,
      offset: (page - 1) * PAGE_SIZE.list,
    })
      .then((res) => {
        setOrders(res.orders);
        setTotal(res.total);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load orders.");
        setOrders([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [customer, page]);

  if (!customer) return null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE.list));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE.list + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE.list, total);

  const sheet = (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-hidden={closing}>
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className={`drawer-backdrop absolute inset-0 bg-stone-950/60 backdrop-blur-[4px] ${
          visible && !closing ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Order history for ${customer.name}`}
        className={`drawer-panel relative flex h-full w-full max-w-[520px] flex-col rounded-l-2xl bg-white shadow-[-12px_0_48px_rgba(0,0,0,0.2)] ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-1 shrink-0 rounded-tl-2xl bg-sky-500" />
        <header className="shrink-0 border-b border-stone-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Order history</p>
              <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-stone-900">
                <ClipboardList size={18} className="text-sky-600" />
                {customer.name}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {customer.orderCount} orders · {pkr(customer.totalSpent)} lifetime
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders`}
                    onClick={close}
                    className="block rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-stone-900">{order.orderNumber}</p>
                      <p className="font-bold text-brand-800">{pkr(order.total)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={order.status} fulfillmentType={order.fulfillmentType} />
                      <span className="text-xs text-stone-500">{formatWhen(order.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="shrink-0 border-t border-stone-100 px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPageChange={setPage}
            />
          </div>
        )}
      </aside>
    </div>
  );

  return createPortal(sheet, document.body);
}
