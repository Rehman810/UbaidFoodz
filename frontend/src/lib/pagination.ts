export const PAGE_SIZE = {
  grid: 12,
  table: 20,
  list: 10,
} as const;

export function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    totalItems,
    pageItems: items.slice(start, start + pageSize),
    rangeStart: totalItems === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, totalItems),
    pageSize,
  };
}
