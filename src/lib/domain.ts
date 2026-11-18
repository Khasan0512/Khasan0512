import type { DealStage } from "@prisma/client";

export interface BoxBookingSlot {
  id: string;
  boxId: string | null;
  stage: DealStage;
  archivedAt: Date | null;
  startAt: Date | null;
  endAt: Date | null;
}

export interface CatalogServiceItem {
  id: string;
  name: string;
  basePrice: number;
}

export interface DealServiceSnapshot {
  serviceId: string;
  serviceNameSnapshot: string;
  priceAtOrder: number;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11 && normalized.startsWith("7")) {
    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  }
  return phone;
}

export function isBoxBlockingStage(stage: DealStage): boolean {
  return stage !== "CANCELED" && stage !== "COMPLETED";
}

export function findBoxScheduleConflict(
  candidate: {
    excludeDealId?: string;
    boxId: string;
    startAt: Date;
    endAt: Date;
  },
  existingBookings: BoxBookingSlot[]
): BoxBookingSlot | null {
  if (candidate.endAt <= candidate.startAt) {
    throw new Error("Время окончания должно быть позже времени начала");
  }

  for (const booking of existingBookings) {
    if (candidate.excludeDealId && booking.id === candidate.excludeDealId) {
      continue;
    }
    if (booking.archivedAt !== null) {
      continue;
    }
    if (!isBoxBlockingStage(booking.stage)) {
      continue;
    }
    if (booking.boxId !== candidate.boxId || !booking.startAt || !booking.endAt) {
      continue;
    }

    const overlaps =
      candidate.startAt < booking.endAt && candidate.endAt > booking.startAt;

    if (overlaps) {
      return booking;
    }
  }

  return null;
}

export function createDealServiceSnapshots(
  selectedServices: CatalogServiceItem[]
): {
  items: DealServiceSnapshot[];
  totalAmount: number;
} {
  const items: DealServiceSnapshot[] = selectedServices.map((service) => ({
    serviceId: service.id,
    serviceNameSnapshot: service.name,
    priceAtOrder: service.basePrice,
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.priceAtOrder, 0);

  return { items, totalAmount };
}
