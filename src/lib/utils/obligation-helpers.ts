import { isSameDay } from "date-fns";
import { daysUntilDeadline } from "@/lib/utils/dates";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export type ObligationStatus = "PENDIENTE" | "PROXIMO" | "VENCIDO" | "PAGADO";

export interface SerializedObligation {
  id: string;
  impuesto: string;
  periodo: string;
  fechaVencimiento: string; // ISO string
  estado: string;
  fechaPago: string | null; // ISO string or null
}

// ─────────────────────────────────────────────────────
// Status configuration (colors, labels, classes)
// ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  ObligationStatus,
  {
    label: string;
    dotColor: string;
    badgeClass: string;
    textClass: string;
    cardBg: string;
  }
> = {
  PENDIENTE: {
    label: "Pendiente",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    textClass: "text-blue-600",
    cardBg: "bg-blue-50",
  },
  PROXIMO: {
    label: "Proximo",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    textClass: "text-amber-600",
    cardBg: "bg-amber-50",
  },
  VENCIDO: {
    label: "Vencido",
    dotColor: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    textClass: "text-red-600",
    cardBg: "bg-red-50",
  },
  PAGADO: {
    label: "Pagado",
    dotColor: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    textClass: "text-green-600",
    cardBg: "bg-green-50",
  },
};

// ─────────────────────────────────────────────────────
// Status order for sorting (most urgent first)
// ─────────────────────────────────────────────────────

export const STATUS_ORDER: Record<ObligationStatus, number> = {
  VENCIDO: 0,
  PROXIMO: 1,
  PENDIENTE: 2,
  PAGADO: 3,
};

// ─────────────────────────────────────────────────────
// Compute display status (client-side, real-time)
// ─────────────────────────────────────────────────────

/**
 * Computes the display status for an obligation based on its DB status
 * and the current date. This ensures correct status colors even if
 * the Phase 5 cron hasn't run yet.
 */
export function computeDisplayStatus(
  dbStatus: string,
  fechaVencimiento: string
): ObligationStatus {
  if (dbStatus === "PAGADO") return "PAGADO";
  if (dbStatus === "VENCIDO") return "VENCIDO";

  const daysLeft = daysUntilDeadline(new Date(fechaVencimiento));

  if (daysLeft < 0) return "VENCIDO";
  if (daysLeft <= 7) return "PROXIMO";
  return "PENDIENTE";
}

// ─────────────────────────────────────────────────────
// Filter obligations for a specific day
// ─────────────────────────────────────────────────────

export function getObligationsForDay(
  obligations: SerializedObligation[],
  day: Date
): SerializedObligation[] {
  return obligations.filter((o) =>
    isSameDay(new Date(o.fechaVencimiento), day)
  );
}
