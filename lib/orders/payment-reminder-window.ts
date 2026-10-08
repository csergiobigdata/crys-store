// Brasília não tem horário de verão desde 2019: é sempre UTC-3.
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Primeiro instante (UTC) do dia de hoje em Brasília. */
export function startOfTodayInBrasilia(now: Date): Date {
  const shifted = new Date(now.getTime() - BRASILIA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() + BRASILIA_OFFSET_MS);
}

/** Hora (0–23) de agora em Brasília. */
export function brasiliaHour(now: Date): number {
  return new Date(now.getTime() - BRASILIA_OFFSET_MS).getUTCHours();
}

/** Lembretes só saem em horário comercial (9h às 20h, Brasília). */
export const REMINDER_FIRST_HOUR = 9;
export const REMINDER_LAST_HOUR = 20;

export function isReminderHour(now: Date): boolean {
  const hour = brasiliaHour(now);
  return hour >= REMINDER_FIRST_HOUR && hour <= REMINDER_LAST_HOUR;
}
