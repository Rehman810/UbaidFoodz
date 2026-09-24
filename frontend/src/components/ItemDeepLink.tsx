"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useItemModal } from "@/lib/item-modal";
import { MenuItem } from "@/lib/types";

function ItemDeepLinkInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const open = useItemModal((s) => s.open);
  const itemId = searchParams.get("item");
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!itemId || handled.current === itemId) return;
    handled.current = itemId;

    api<MenuItem[]>("/menu")
      .then((menu) => {
        const found = menu.find((m) => m.id === itemId);
        if (found) open(found);
      })
      .catch(() => null)
      .finally(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("item");
        const q = params.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      });
  }, [itemId, open, pathname, router, searchParams]);

  return null;
}

export function ItemDeepLink() {
  return (
    <Suspense fallback={null}>
      <ItemDeepLinkInner />
    </Suspense>
  );
}
