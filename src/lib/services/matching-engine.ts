/**
 * Matching Engine: Tax Rule Evaluation, Obligation Generation, and Recalculation
 *
 * Core business logic that determines which DIAN tax obligations apply to
 * a business profile and generates obligation records with correct deadlines.
 *
 * Pure functions (no DB): evaluateCondition, matchTaxes
 * DB functions: generateObligaciones, recalculateObligaciones
 */

import { prisma } from "@/lib/prisma";
import { validateNit } from "./nit-validator";
import {
  TAX_RULES,
  type MatchCondition,
  type TaxRule,
  type EmpresaProfile,
} from "./matching-types";
import type { Empresa } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Pure functions (no DB calls)
// ---------------------------------------------------------------------------

/**
 * Evaluate a single match condition against an empresa profile.
 *
 * @param condition - The condition to evaluate (field, operator, value)
 * @param profile - The empresa profile to evaluate against
 * @returns true if the condition matches, false otherwise
 */
export function evaluateCondition(
  condition: MatchCondition,
  profile: EmpresaProfile,
): boolean {
  const actual = String(profile[condition.campo] ?? "");
  const expected = condition.valor;

  switch (condition.operador) {
    case "EQUALS":
      return actual === expected;
    case "NOT_EQUALS":
      return actual !== expected;
    case "IN":
      return expected.split(",").includes(actual);
    case "NOT_IN":
      return !expected.split(",").includes(actual);
    default:
      return false;
  }
}

/**
 * Determine which tax rules apply to a given empresa profile.
 * A rule matches when ALL its conditions evaluate to true (AND logic).
 *
 * @param profile - The empresa profile to match against
 * @returns Array of TaxRule objects whose conditions all match
 */
export function matchTaxes(profile: EmpresaProfile): TaxRule[] {
  return TAX_RULES.filter((rule) =>
    rule.condiciones.every((c) => evaluateCondition(c, profile)),
  );
}

// ---------------------------------------------------------------------------
// Shared helper for obligation building
// ---------------------------------------------------------------------------

/**
 * Extract EmpresaProfile from Prisma Empresa model.
 */
function toProfile(empresa: Empresa): EmpresaProfile {
  return {
    tipoEmpresa: empresa.tipoEmpresa ?? "",
    regimen: empresa.regimen ?? "",
    tamano: empresa.tamano ?? "",
    nit: empresa.nit ?? "",
    ciiu: empresa.ciiu ?? "",
    ciudad: empresa.ciudad ?? "",
    rangoIngresos: empresa.rangoIngresos ?? "",
  };
}

/**
 * Build obligation data for matched rules, optionally skipping existing
 * PAGADO/VENCIDO combos to preserve user history during recalculation.
 *
 * @returns Object with obligations array and count of preserved (skipped) records
 */
async function buildObligaciones(
  empresa: Empresa,
  skipKeys?: Set<string>,
): Promise<{
  obligations: Array<{
    empresaId: string;
    calendarioTributarioId: string;
    impuesto: string;
    periodo: string;
    fechaVencimiento: Date;
    estado: string;
  }>;
  preserved: number;
}> {
  const profile = toProfile(empresa);
  const matchedRules = matchTaxes(profile);
  const nitResult = validateNit(profile.nit);

  // Load all active calendarios for current year
  const calendarios = await prisma.calendarioTributario.findMany({
    where: { anio: 2026, activo: true },
  });

  const obligations: Array<{
    empresaId: string;
    calendarioTributarioId: string;
    impuesto: string;
    periodo: string;
    fechaVencimiento: Date;
    estado: string;
  }> = [];
  let preserved = 0;

  for (const rule of matchedRules) {
    const calendario = calendarios.find((c) => c.impuesto === rule.impuesto);
    if (!calendario) {
      console.warn(
        `No CalendarioTributario found for impuesto: ${rule.impuesto}`,
      );
      continue;
    }

    const digitoNit =
      rule.digitosNit === 1 ? nitResult.lastOneDigit : nitResult.lastTwoDigits;

    const fechas = await prisma.fechaVencimiento.findMany({
      where: {
        calendarioTributarioId: calendario.id,
        digitoNit,
      },
    });

    for (const fecha of fechas) {
      const key = `${calendario.impuesto}:${fecha.periodo}`;
      if (skipKeys?.has(key)) {
        preserved++;
        continue; // Skip -- user already paid this
      }

      obligations.push({
        empresaId: empresa.id,
        calendarioTributarioId: calendario.id,
        impuesto: calendario.impuesto,
        periodo: fecha.periodo,
        fechaVencimiento: fecha.fechaLimite,
        estado: "PENDIENTE",
      });
    }
  }

  return { obligations, preserved };
}

// ---------------------------------------------------------------------------
// DB functions
// ---------------------------------------------------------------------------

/**
 * Generate obligation records for an empresa based on its profile.
 * Matches tax rules against the profile and creates ObligacionTributaria
 * records for each matched tax + period + NIT-digit deadline.
 *
 * @param empresa - The Prisma Empresa record (must have completed onboarding)
 * @returns Number of obligation records created
 */
export async function generateObligaciones(empresa: Empresa): Promise<number> {
  const { obligations } = await buildObligaciones(empresa);

  if (obligations.length > 0) {
    await prisma.obligacionTributaria.createMany({ data: obligations });
  }

  return obligations.length;
}

/**
 * Recalculate obligations after a profile edit.
 * Deletes PENDIENTE/PROXIMO obligations, preserves PAGADO and VENCIDO,
 * re-runs matching, and skips creating new obligations that match
 * existing preserved records.
 *
 * @param empresa - The Prisma Empresa record with updated profile
 * @returns Counts of deleted, created, and preserved obligations
 */
export async function recalculateObligaciones(
  empresa: Empresa,
): Promise<{
  deleted: number;
  created: number;
  preserved: number;
}> {
  // 1. Find existing PAGADO and VENCIDO records to preserve
  const preservedRecords = await prisma.obligacionTributaria.findMany({
    where: {
      empresaId: empresa.id,
      estado: { in: ["PAGADO", "VENCIDO"] },
    },
    select: { impuesto: true, periodo: true },
  });
  const preserveKeys = new Set(
    preservedRecords.map((p) => `${p.impuesto}:${p.periodo}`),
  );

  // 2. Delete only PENDIENTE and PROXIMO obligations
  const deleteResult = await prisma.obligacionTributaria.deleteMany({
    where: {
      empresaId: empresa.id,
      estado: { in: ["PENDIENTE", "PROXIMO"] },
    },
  });

  // 3. Re-run matching engine, skipping PAGADO+VENCIDO duplicates
  const { obligations: newObligaciones, preserved } = await buildObligaciones(
    empresa,
    preserveKeys,
  );

  if (newObligaciones.length > 0) {
    await prisma.obligacionTributaria.createMany({ data: newObligaciones });
  }

  return {
    deleted: deleteResult.count,
    created: newObligaciones.length,
    preserved,
  };
}
