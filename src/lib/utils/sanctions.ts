// Art. 641 Estatuto Tributario Colombia -- Penalty calculations
import { UVT_2026 } from "./constants";
// import { daysUntilDeadline } from "./dates"; // TODO: May be used for future penalty calculation features
import { formatCOP } from "./currency";
import type { ObligationStatus } from "./obligation-helpers";

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────

export const SANCION_MINIMA_UVT = 10;
export const SANCION_MINIMA_2026 = SANCION_MINIMA_UVT * UVT_2026; // $523,740
export const TASA_EXTEMPORANEIDAD_641 = 0.05; // 5% per month
export const TOPE_EXTEMPORANEIDAD_641 = 1.0; // 100% cap
export const TASA_MORATORIO_APROX = 0.27; // ~27% annual (approximate, conservative)

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface PenaltyBreakdown {
  impuestoACargo: number;
  mesesExtemporaneidad: number;
  tasaMensual: number;
  subtotal: number;
  tope: number;
  minimoUVT: number;
  sancionBase: number;
  interesMoratorio: number;
  totalEstimado: number;
}

// ─────────────────────────────────────────────────────
// Art. 641 Penalty Calculator
// ─────────────────────────────────────────────────────

/**
 * Calculates late-filing penalty per Art. 641 of Colombia's Estatuto Tributario.
 *
 * Formula:
 * - Rate: 5% per month (any fraction counts as a full month)
 * - Cap: 100% of impuesto a cargo
 * - Floor: 10 UVT (minimum penalty always applies)
 * - Moratory interest: ~27% E.A. approximation (real rate varies monthly)
 */
export function calculatePenaltyArt641(
  impuestoACargo: number,
  diasExtemporaneidad: number,
): PenaltyBreakdown {
  const meses = Math.max(1, Math.ceil(diasExtemporaneidad / 30));
  const tasaMensual = TASA_EXTEMPORANEIDAD_641;
  const subtotal = impuestoACargo * tasaMensual * meses;
  const tope = impuestoACargo; // 100% cap
  const minimoUVT = SANCION_MINIMA_2026;

  let sancionBase: number;
  if (impuestoACargo > 0) {
    sancionBase = Math.max(Math.min(subtotal, tope), minimoUVT);
  } else {
    sancionBase = minimoUVT; // 10 UVT floor always applies
  }

  const interesMoratorio =
    impuestoACargo > 0
      ? Math.round(impuestoACargo * (TASA_MORATORIO_APROX / 365) * diasExtemporaneidad)
      : 0;

  const totalEstimado = Math.round(sancionBase + interesMoratorio);

  return {
    impuestoACargo,
    mesesExtemporaneidad: meses,
    tasaMensual,
    subtotal,
    tope,
    minimoUVT,
    sancionBase,
    interesMoratorio,
    totalEstimado,
  };
}

// ─────────────────────────────────────────────────────
// Inline Penalty Info (for table rows)
// ─────────────────────────────────────────────────────

/**
 * Returns inline penalty information for an obligation table row.
 * Shows minimum sanction amount for PROXIMO and VENCIDO statuses.
 * Returns null for PENDIENTE and PAGADO (no warning needed).
 */
export function getInlinePenaltyInfo(
  displayStatus: ObligationStatus,
  _fechaVencimiento: string,
): { text: string; showLink: boolean } | null {
  if (displayStatus === "PENDIENTE" || displayStatus === "PAGADO") {
    return null;
  }

  if (displayStatus === "PROXIMO") {
    return {
      text: `Sancion min. si vence: ${formatCOP(SANCION_MINIMA_2026)}`,
      showLink: true,
    };
  }

  if (displayStatus === "VENCIDO") {
    return {
      text: `Sancion est. min.: ${formatCOP(SANCION_MINIMA_2026)}`,
      showLink: true,
    };
  }

  return null;
}
