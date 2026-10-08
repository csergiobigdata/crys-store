import { describe, expect, it } from "vitest";
import {
  brasiliaHour,
  isReminderHour,
  startOfTodayInBrasilia,
} from "./payment-reminder-window";

describe("startOfTodayInBrasilia", () => {
  it("meia-noite de Brasília = 03:00 UTC", () => {
    const start = startOfTodayInBrasilia(new Date("2026-10-08T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-10-08T03:00:00.000Z");
  });

  it("antes das 03:00 UTC ainda é o dia anterior em Brasília", () => {
    const start = startOfTodayInBrasilia(new Date("2026-10-08T01:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-07T03:00:00.000Z");
  });

  it("pedido de ontem à noite fica antes do início de hoje", () => {
    const now = new Date("2026-10-08T13:00:00Z"); // 10h em Brasília
    const orderLastNight = new Date("2026-10-08T01:45:00Z"); // 22h45 de ontem
    expect(orderLastNight < startOfTodayInBrasilia(now)).toBe(true);
    const orderThisMorning = new Date("2026-10-08T11:00:00Z"); // 8h de hoje
    expect(orderThisMorning < startOfTodayInBrasilia(now)).toBe(false);
  });
});

describe("isReminderHour", () => {
  it("só envia entre 9h e 20h de Brasília", () => {
    expect(brasiliaHour(new Date("2026-10-08T12:00:00Z"))).toBe(9);
    expect(isReminderHour(new Date("2026-10-08T11:59:00Z"))).toBe(false); // 8h59
    expect(isReminderHour(new Date("2026-10-08T12:00:00Z"))).toBe(true); // 9h
    expect(isReminderHour(new Date("2026-10-08T23:30:00Z"))).toBe(true); // 20h30
    expect(isReminderHour(new Date("2026-10-09T00:00:00Z"))).toBe(false); // 21h
  });
});
