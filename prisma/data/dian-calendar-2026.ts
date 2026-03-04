// DIAN 2026 Tax Calendar - Major Tax Types
// Defines the CalendarioTributario entries for Colombia's major tax obligations.
// Each entry represents a tax type with its periodicity.
// The actual per-NIT-digit deadlines are in nit-lookup-2026.ts.

interface CalendarEntry {
  anio: number;
  impuesto: string;
  concepto: string;
  periodicidad: string; // MENSUAL, BIMESTRAL, CUATRIMESTRAL, ANUAL
  resolucionFuente: string | null;
  activo: boolean;
}

export const dianCalendar2026: CalendarEntry[] = [
  {
    anio: 2026,
    impuesto: "RENTA",
    concepto: "Declaracion de Renta y Complementarios - Personas Juridicas",
    periodicidad: "ANUAL",
    resolucionFuente: "Decreto 2229 de 2023 / Resolucion DIAN",
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "RENTA_PN",
    concepto: "Declaracion de Renta - Personas Naturales",
    periodicidad: "ANUAL",
    resolucionFuente: "Decreto 2229 de 2023 / Resolucion DIAN",
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "IVA_BIMESTRAL",
    concepto: "Declaracion de IVA Bimestral",
    periodicidad: "BIMESTRAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "IVA_CUATRIMESTRAL",
    concepto: "Declaracion de IVA Cuatrimestral",
    periodicidad: "CUATRIMESTRAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "RETENCION_FUENTE",
    concepto: "Declaracion Mensual de Retencion en la Fuente",
    periodicidad: "MENSUAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "ICA",
    concepto: "Declaracion de Industria y Comercio (Bogota)",
    periodicidad: "BIMESTRAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "GMF",
    concepto: "Gravamen a los Movimientos Financieros",
    periodicidad: "MENSUAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "ACTIVOS",
    concepto: "Impuesto al Patrimonio / Activos en el Exterior",
    periodicidad: "ANUAL",
    resolucionFuente: null,
    activo: true,
  },
  {
    anio: 2026,
    impuesto: "CONSUMO",
    concepto: "Impuesto Nacional al Consumo",
    periodicidad: "BIMESTRAL",
    resolucionFuente: null,
    activo: true,
  },
];
