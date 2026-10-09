const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : cep;
}

const dateTimeSecondsFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** dd/mm/aaaa hh:mm:ss (24h), sempre em horário de Brasília. */
export function formatDateTimeSeconds(value: string | Date): string {
  const parts = dateTimeSecondsFormatter.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

/**
 * Data e hora (dd/mm/aaaa hh:mm) sempre em horário de Brasília. Sem o fuso
 * explícito, páginas renderizadas no servidor (que roda em UTC) mostrariam
 * horários 3 horas adiantados.
 */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value)).replace(", ", " ");
}

/** Data (dd/mm/aaaa) em horário de Brasília. */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

/** Telefone com DDD em dígitos -> "(11) 98649-3333". Outros formatos ficam como estão. */
export function formatPhone(phone: string | null | undefined): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
}
