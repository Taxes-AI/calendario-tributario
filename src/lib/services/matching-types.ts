/**
 * Type definitions and tax rule configuration for the matching engine.
 *
 * The matching engine evaluates each TaxRule's conditions against the
 * user's EmpresaProfile. If all conditions match, the tax obligation
 * applies and the engine generates ObligacionTributaria records using
 * the NIT digit(s) specified by digitosNit for FechaVencimiento lookup.
 *
 * CRITICAL: impuesto values MUST exactly match the strings seeded in
 * Phase 1 (CalendarioTributario.impuesto). See prisma/data/dian-calendar-2026.ts.
 */

/**
 * Represents the user's business profile fields used for tax rule evaluation.
 * Maps to the Empresa Prisma model fields populated during onboarding.
 */
export type EmpresaProfile = {
  tipoEmpresa: string;
  regimen: string;
  tamano: string;
  nit: string;
  ciiu: string;
  ciudad: string;
  rangoIngresos: string;
};

/**
 * A single condition in a tax rule.
 * All conditions in a rule must match (AND logic) for the rule to apply.
 */
export interface MatchCondition {
  /** Field on the EmpresaProfile to evaluate */
  campo: keyof EmpresaProfile;
  /** Comparison operator */
  operador: "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN";
  /** Value(s) to compare against. For IN/NOT_IN, comma-separated list. */
  valor: string;
}

/**
 * A tax rule that determines whether a specific tax obligation applies
 * to a given business profile.
 */
export interface TaxRule {
  /** Tax type -- must match CalendarioTributario.impuesto exactly */
  impuesto: string;
  /** Conditions that must ALL be true for this tax to apply (AND logic) */
  condiciones: MatchCondition[];
  /**
   * How many NIT digits to use for FechaVencimiento lookup:
   * - 1: last digit of NIT base number (e.g., "4" from "860069804")
   * - 2: last two digits of NIT base number (e.g., "04" from "860069804")
   */
  digitosNit: 1 | 2;
}

/**
 * Tax rules for all 9 DIAN obligation types seeded in Phase 1.
 *
 * Each rule's impuesto value matches exactly with CalendarioTributario.impuesto.
 * The matching engine evaluates all rules against the user's EmpresaProfile
 * and generates ObligacionTributaria records for each matching rule.
 *
 * Key exclusions:
 * - SIMPLE regime: excluded from IVA_BIMESTRAL, IVA_CUATRIMESTRAL, RETENCION_FUENTE
 *   (SIMPLE regime has its own unified tax, these don't apply)
 * - RENTA vs RENTA_PN: mutually exclusive based on tipoEmpresa (JURIDICA vs NATURAL)
 */
export const TAX_RULES: TaxRule[] = [
  // 1. RENTA: Corporate income tax -- juridica entities on ordinario/especial regime
  {
    impuesto: "RENTA",
    condiciones: [
      { campo: "tipoEmpresa", operador: "EQUALS", valor: "JURIDICA" },
      { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
    ],
    digitosNit: 2,
  },

  // 2. RENTA_PN: Personal income tax -- natural persons NOT on simple regime
  {
    impuesto: "RENTA_PN",
    condiciones: [
      { campo: "tipoEmpresa", operador: "EQUALS", valor: "NATURAL" },
      { campo: "regimen", operador: "NOT_EQUALS", valor: "SIMPLE" },
    ],
    digitosNit: 2,
  },

  // 3. IVA_BIMESTRAL: Bimonthly VAT -- ordinario/especial with higher income
  {
    impuesto: "IVA_BIMESTRAL",
    condiciones: [
      { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
      { campo: "rangoIngresos", operador: "IN", valor: "RANGO_4,RANGO_5" },
    ],
    digitosNit: 1,
  },

  // 4. IVA_CUATRIMESTRAL: Quarterly VAT -- ordinario/especial with lower income
  {
    impuesto: "IVA_CUATRIMESTRAL",
    condiciones: [
      { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
      {
        campo: "rangoIngresos",
        operador: "IN",
        valor: "RANGO_1,RANGO_2,RANGO_3",
      },
    ],
    digitosNit: 1,
  },

  // 5. RETENCION_FUENTE: Withholding tax -- non-simple regime, large/medium businesses
  {
    impuesto: "RETENCION_FUENTE",
    condiciones: [
      { campo: "regimen", operador: "NOT_EQUALS", valor: "SIMPLE" },
      { campo: "tamano", operador: "IN", valor: "GRANDE,MEDIANO" },
    ],
    digitosNit: 1,
  },

  // 6. ICA: Industry and commerce tax -- Bogota only (v1 scope)
  {
    impuesto: "ICA",
    condiciones: [
      { campo: "ciudad", operador: "EQUALS", valor: "BOGOTA" },
    ],
    digitosNit: 1,
  },

  // 7. GMF: Financial transactions tax (4x1000) -- large businesses only
  {
    impuesto: "GMF",
    condiciones: [
      { campo: "tamano", operador: "EQUALS", valor: "GRANDE" },
    ],
    digitosNit: 1,
  },

  // 8. ACTIVOS: Net worth tax -- juridica entities on ordinario/especial with high income
  {
    impuesto: "ACTIVOS",
    condiciones: [
      { campo: "tipoEmpresa", operador: "EQUALS", valor: "JURIDICA" },
      { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
      { campo: "rangoIngresos", operador: "IN", valor: "RANGO_5" },
    ],
    digitosNit: 1,
  },

  // 9. CONSUMO: Consumption tax -- ordinario/especial regime (simplified for v1 scope;
  //    in reality applies to restaurant/telecom CIIU codes, but broadly applied here)
  {
    impuesto: "CONSUMO",
    condiciones: [
      { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
    ],
    digitosNit: 1,
  },
];
