import type { SeatType } from "@/modules/dine-in/api";

export function seatTypeLabel(t: SeatType | null | undefined) {
  if (!t) return "Any seating";
  const map: Record<SeatType, string> = {
    TABLE: "Table",
    TAKHT: "Takht",
    BOOTH: "Booth",
    HIGH_TOP: "High top",
    OUTDOOR: "Outdoor",
  };
  return map[t];
}
