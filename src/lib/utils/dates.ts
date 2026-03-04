import { TZDate } from "@date-fns/tz";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { COLOMBIA_TZ } from "./constants";

/**
 * Returns the current date/time in Colombia timezone (America/Bogota, UTC-5).
 */
export function nowColombia(): TZDate {
  return new TZDate(new Date(), COLOMBIA_TZ);
}

/**
 * Converts any Date to Colombia timezone.
 */
export function toColombia(date: Date): TZDate {
  return new TZDate(date, COLOMBIA_TZ);
}

/**
 * Formats a date in Colombia timezone using Spanish locale.
 * Default format: "15 de marzo, 2026"
 */
export function formatDateColombia(
  date: Date,
  formatStr: string = "dd 'de' MMMM, yyyy"
): string {
  return format(new TZDate(date, COLOMBIA_TZ), formatStr, { locale: es });
}

/**
 * Calculates the number of days until a deadline from the current Colombia time.
 * Positive = days remaining, negative = days overdue.
 */
export function daysUntilDeadline(deadline: Date): number {
  const now = nowColombia();
  const deadlineCol = toColombia(deadline);
  return differenceInDays(deadlineCol, now);
}
