// NIT Digit to Deadline Date Lookup Tables - 2026
// Maps each tax type + period + NIT last digit(s) to a specific deadline date.
// REPRESENTATIVE DATES -- Replace with official DIAN 2026 calendar when available
//
// Patterns based on typical DIAN calendar structure:
// - Retencion en la Fuente: 2nd week of following month, digits 1-5 earlier, 6-0 later
// - IVA Bimestral: 2nd-3rd week of month following the bimestre
// - IVA Cuatrimestral: 2nd-3rd week of month following the cuatrimestre
// - Renta PJ: April 2026 window (2 NIT digits)
// - Renta PN: August-October 2026 window (2 NIT digits)
// - ICA: Similar to IVA bimestral pattern
// - GMF: Monthly, similar to Retencion pattern
// - Activos: Annual, May window
// - Consumo: Bimestral pattern
//
// ALL dates use UTC midnight: new Date(Date.UTC(2026, month-1, day))

export interface NitLookupEntry {
  impuesto: string;     // References CalendarioTributario.impuesto
  anio: number;
  periodo: string;      // "202601" for January, "202602" for February, etc.
  digitoNit: string;    // "1", "2", ..., "0" for monthly; "01"-"00" for annual renta
  fechaLimite: Date;    // The deadline date
}

// ─── Helper ───
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

// ─── Retencion en la Fuente (MENSUAL) ───
// 12 periods x 10 digits = 120 entries
// Deadlines: 2nd week of following month
function generateRetencion(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  // Each month's deadlines fall in the following month
  // Base day offsets for digits 1-9,0: spread across ~2 weeks
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  for (let month = 1; month <= 12; month++) {
    const periodo = `2026${String(month).padStart(2, "0")}`;
    // Deadline month is the next month (or January of next year for December)
    const dlMonth = month === 12 ? 1 : month + 1;
    const dlYear = month === 12 ? 2027 : 2026;
    // Base start day: 9th of the following month
    const baseDay = 9;

    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 9, 10, 11, ..., 18
      entries.push({
        impuesto: "RETENCION_FUENTE",
        anio: 2026,
        periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(dlYear, dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── IVA Bimestral ───
// 6 periods (bimestres) x 10 digits = 60 entries
// Periods: Ene-Feb, Mar-Abr, May-Jun, Jul-Ago, Sep-Oct, Nov-Dic
// Deadlines: 2nd-3rd week of month following the bimestre
function generateIvaBimestral(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  // Bimestre periods and their deadline months
  const bimestres = [
    { periodo: "202601", dlMonth: 3, dlYear: 2026 },  // Jan-Feb -> March
    { periodo: "202603", dlMonth: 5, dlYear: 2026 },  // Mar-Apr -> May
    { periodo: "202605", dlMonth: 7, dlYear: 2026 },  // May-Jun -> July
    { periodo: "202607", dlMonth: 9, dlYear: 2026 },  // Jul-Aug -> September
    { periodo: "202609", dlMonth: 11, dlYear: 2026 }, // Sep-Oct -> November
    { periodo: "202611", dlMonth: 1, dlYear: 2027 },  // Nov-Dec -> January 2027
  ];

  for (const bim of bimestres) {
    const baseDay = 10;
    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 10, 11, 12, ..., 19
      entries.push({
        impuesto: "IVA_BIMESTRAL",
        anio: 2026,
        periodo: bim.periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(bim.dlYear, bim.dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── IVA Cuatrimestral ───
// 3 periods x 10 digits = 30 entries
// Periods: Ene-Abr, May-Ago, Sep-Dic
// Deadlines: 2nd-3rd week of month following the cuatrimestre
function generateIvaCuatrimestral(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const cuatrimestres = [
    { periodo: "202601", dlMonth: 5, dlYear: 2026 },  // Jan-Apr -> May
    { periodo: "202605", dlMonth: 9, dlYear: 2026 },  // May-Aug -> September
    { periodo: "202609", dlMonth: 1, dlYear: 2027 },  // Sep-Dec -> January 2027
  ];

  for (const cuat of cuatrimestres) {
    const baseDay = 12;
    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 12, 13, 14, ..., 21
      entries.push({
        impuesto: "IVA_CUATRIMESTRAL",
        anio: 2026,
        periodo: cuat.periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(cuat.dlYear, cuat.dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── Renta Personas Juridicas (ANUAL) ───
// Last 2 NIT digits: "01" through "00" (100 entries)
// Deadlines: April 2026 window (typically April 10-24)
function generateRentaPJ(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  // 2-digit groups: 01-05 -> Apr 10, 06-10 -> Apr 11, etc.
  // Spread 100 entries across April 10-24 (15 days, ~7 per day)
  for (let d = 1; d <= 100; d++) {
    const digitStr = d === 100 ? "00" : String(d).padStart(2, "0");
    // Group into days: 7 entries per day across April 10-24
    const dayOffset = Math.floor((d - 1) / 7);
    const day = 10 + dayOffset; // April 10 through April 24
    entries.push({
      impuesto: "RENTA",
      anio: 2026,
      periodo: "2026",
      digitoNit: digitStr,
      fechaLimite: utc(2026, 4, day),
    });
  }

  return entries;
}

// ─── Renta Personas Naturales (ANUAL) ───
// Last 2 NIT digits: "01" through "00" (100 entries)
// Deadlines: August-October 2026 window
function generateRentaPN(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  // Spread 100 entries across Aug 11 - Oct 21 (~72 days)
  // Approximately 2 entries per business day
  for (let d = 1; d <= 100; d++) {
    const digitStr = d === 100 ? "00" : String(d).padStart(2, "0");
    // Group: ~5 per day across Aug 11 - Sep 30 + Oct 1-21
    const dayOffset = Math.floor((d - 1) / 2);
    let month: number;
    let day: number;

    if (dayOffset < 21) {
      // August 11-31
      month = 8;
      day = 11 + dayOffset;
    } else if (dayOffset < 51) {
      // September 1-30
      month = 9;
      day = 1 + (dayOffset - 21);
    } else {
      // October 1-21
      month = 10;
      day = 1 + (dayOffset - 51);
    }

    entries.push({
      impuesto: "RENTA_PN",
      anio: 2026,
      periodo: "2026",
      digitoNit: digitStr,
      fechaLimite: utc(2026, month, day),
    });
  }

  return entries;
}

// ─── ICA Bogota (BIMESTRAL) ───
// 6 periods x 10 digits = 60 entries
// Similar pattern to IVA bimestral but with slightly different dates
function generateICA(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const bimestres = [
    { periodo: "202601", dlMonth: 3, dlYear: 2026 },
    { periodo: "202603", dlMonth: 5, dlYear: 2026 },
    { periodo: "202605", dlMonth: 7, dlYear: 2026 },
    { periodo: "202607", dlMonth: 9, dlYear: 2026 },
    { periodo: "202609", dlMonth: 11, dlYear: 2026 },
    { periodo: "202611", dlMonth: 1, dlYear: 2027 },
  ];

  for (const bim of bimestres) {
    const baseDay = 13; // Slightly offset from IVA bimestral
    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 13, 14, 15, ..., 22
      entries.push({
        impuesto: "ICA",
        anio: 2026,
        periodo: bim.periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(bim.dlYear, bim.dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── GMF (MENSUAL) ───
// 12 periods x 10 digits = 120 entries
// Similar to Retencion but with slightly different dates
function generateGMF(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  for (let month = 1; month <= 12; month++) {
    const periodo = `2026${String(month).padStart(2, "0")}`;
    const dlMonth = month === 12 ? 1 : month + 1;
    const dlYear = month === 12 ? 2027 : 2026;
    const baseDay = 11; // Slightly offset from Retencion

    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 11, 12, 13, ..., 20
      entries.push({
        impuesto: "GMF",
        anio: 2026,
        periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(dlYear, dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── Activos / Patrimonio (ANUAL) ───
// 10 digits x 1 period = 10 entries (uses single last digit)
// Deadlines: May 2026
function generateActivos(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const baseDay = 11;

  for (let i = 0; i < digitOrder.length; i++) {
    const day = baseDay + i; // May 11-20
    entries.push({
      impuesto: "ACTIVOS",
      anio: 2026,
      periodo: "2026",
      digitoNit: digitOrder[i],
      fechaLimite: utc(2026, 5, day),
    });
  }

  return entries;
}

// ─── Consumo (BIMESTRAL) ───
// 6 periods x 10 digits = 60 entries
// Same bimestral pattern as IVA
function generateConsumo(): NitLookupEntry[] {
  const entries: NitLookupEntry[] = [];
  const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const bimestres = [
    { periodo: "202601", dlMonth: 3, dlYear: 2026 },
    { periodo: "202603", dlMonth: 5, dlYear: 2026 },
    { periodo: "202605", dlMonth: 7, dlYear: 2026 },
    { periodo: "202607", dlMonth: 9, dlYear: 2026 },
    { periodo: "202609", dlMonth: 11, dlYear: 2026 },
    { periodo: "202611", dlMonth: 1, dlYear: 2027 },
  ];

  for (const bim of bimestres) {
    const baseDay = 10; // Same as IVA bimestral
    for (let i = 0; i < digitOrder.length; i++) {
      const day = baseDay + i; // 10, 11, 12, ..., 19
      entries.push({
        impuesto: "CONSUMO",
        anio: 2026,
        periodo: bim.periodo,
        digitoNit: digitOrder[i],
        fechaLimite: utc(bim.dlYear, bim.dlMonth, day),
      });
    }
  }

  return entries;
}

// ─── Combine all NIT lookup entries ───
export const nitLookup2026: NitLookupEntry[] = [
  ...generateRetencion(),       // 120 entries
  ...generateIvaBimestral(),    // 60 entries
  ...generateIvaCuatrimestral(),// 30 entries
  ...generateRentaPJ(),         // 100 entries
  ...generateRentaPN(),         // 100 entries
  ...generateICA(),             // 60 entries
  ...generateGMF(),             // 120 entries
  ...generateActivos(),         // 10 entries
  ...generateConsumo(),         // 60 entries
];
// Total: 660 entries
