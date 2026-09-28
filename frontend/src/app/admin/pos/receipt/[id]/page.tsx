"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChefHat, Printer, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { printReceipt, receiptPhone, ReceiptStore } from "@/lib/print-receipt";
import { Order } from "@/lib/types";
import { pkr } from "@/lib/format";

export default function PosReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<ReceiptStore | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ order: Order; store: ReceiptStore }>(`/pos/receipt/${id}`)
      .then((data) => {
        setOrder(data.order);
        setStore(data.store);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load receipt."));
  }, [id]);

  const opts = { cashier: user?.name };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-brand-700"
        >
          <ArrowLeft size={16} /> Back to POS
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => order && store && printReceipt(order, store, { ...opts, copies: "customer" })}
            disabled={!order}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
          >
            <Receipt size={14} /> Customer
          </button>
          <button
            type="button"
            onClick={() => order && store && printReceipt(order, store, { copies: "kitchen" })}
            disabled={!order}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
          >
            <ChefHat size={14} /> Kitchen
          </button>
          <button
            type="button"
            onClick={() => order && store && printReceipt(order, store, opts)}
            disabled={!order}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Printer size={14} /> Both
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {order && store && (
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{store.name}</p>
            <p className="text-xs text-stone-500">{store.address}</p>
            <p className="text-xs text-stone-500">Tel: {store.phone}</p>
          </div>
          <hr className="my-4 border-dashed border-stone-300" />
          <div className="text-center">
            <p className="text-2xl font-black tracking-wide text-stone-900">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-stone-500">
              {new Date(order.createdAt).toLocaleString("en-PK")}
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>
                  {i.quantity}× {i.nameAtOrder}
                  {i.optionsLabel ? <span className="block text-xs text-stone-500">{i.optionsLabel}</span> : null}
                </span>
                <span className="font-semibold">{pkr(Number(i.priceAtOrder) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4 border-dashed border-stone-300" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700">{pkr(order.total)}</span>
          </div>
          {receiptPhone(order.customerPhone) && (
            <p className="mt-2 text-xs text-stone-500">Phone: {receiptPhone(order.customerPhone)}</p>
          )}
        </article>
      )}
    </div>
  );
}
