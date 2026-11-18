import { describe, expect, it } from "vitest";
import {
  createDealServiceSnapshots,
  findBoxScheduleConflict,
  normalizePhone,
  type BoxBookingSlot,
} from "../domain";

describe("CRM БлескАвто — Бизнес-правила Модуля 1", () => {
  it("нормализует разные форматы российских номеров к единому виду 7999...", () => {
    expect(normalizePhone("+7 (999) 123-45-67")).toBe("79991234567");
    expect(normalizePhone("8-999-123-45-67")).toBe("79991234567");
    expect(normalizePhone("9991234567")).toBe("79991234567");
  });

  it("блокирует пересекающуюся запись в тот же бокс, но разрешает запись встык", () => {
    const existing: BoxBookingSlot[] = [
      {
        id: "deal-bmw",
        boxId: "box-1",
        stage: "SCHEDULED",
        archivedAt: null,
        startAt: new Date("2026-11-19T10:00:00Z"),
        endAt: new Date("2026-11-19T14:00:00Z"),
      },
    ];

    const overlapping = findBoxScheduleConflict(
      {
        boxId: "box-1",
        startAt: new Date("2026-11-19T12:00:00Z"),
        endAt: new Date("2026-11-19T16:00:00Z"),
      },
      existing
    );
    expect(overlapping?.id).toBe("deal-bmw");

    const backToBack = findBoxScheduleConflict(
      {
        boxId: "box-1",
        startAt: new Date("2026-11-19T14:00:00Z"),
        endAt: new Date("2026-11-19T18:00:00Z"),
      },
      existing
    );
    expect(backToBack).toBeNull();
  });

  it("НЕ блокирует бокс, если старая запись была отменена (этап CANCELED)", () => {
    const canceledBooking: BoxBookingSlot[] = [
      {
        id: "deal-canceled",
        boxId: "box-1",
        stage: "CANCELED",
        archivedAt: null,
        startAt: new Date("2026-11-19T10:00:00Z"),
        endAt: new Date("2026-11-19T14:00:00Z"),
      },
    ];

    const conflict = findBoxScheduleConflict(
      {
        boxId: "box-1",
        startAt: new Date("2026-11-19T11:00:00Z"),
        endAt: new Date("2026-11-19T13:00:00Z"),
      },
      canceledBooking
    );
    expect(conflict).toBeNull();
  });

  it("фиксирует цену услуги на момент заказа (priceAtOrder), не меняя прошлые сделки", () => {
    const catalogBefore = [
      { id: "srv-polish", name: "Полировка кузова", basePrice: 15000 },
    ];

    const orderSnapshot = createDealServiceSnapshots(catalogBefore);
    expect(orderSnapshot.totalAmount).toBe(15000);
    expect(orderSnapshot.items[0].priceAtOrder).toBe(15000);

    // Владелец поднял цену в прайс-листе до 18 000 ₽
    catalogBefore[0].basePrice = 18000;

    // Снимок в старой сделке остаётся 15 000 ₽
    expect(orderSnapshot.items[0].priceAtOrder).toBe(15000);
    expect(orderSnapshot.totalAmount).toBe(15000);
  });
});
