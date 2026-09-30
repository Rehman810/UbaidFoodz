import { useEffect, useMemo, useState } from "react";
import { paginateSlice } from "@/lib/pagination";

export function usePagination<T>(items: T[], pageSize: number, resetKey?: string | number) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const result = useMemo(() => paginateSlice(items, page, pageSize), [items, page, pageSize]);

  useEffect(() => {
    if (page > result.totalPages) setPage(result.totalPages);
  }, [page, result.totalPages]);

  return { ...result, setPage };
}
