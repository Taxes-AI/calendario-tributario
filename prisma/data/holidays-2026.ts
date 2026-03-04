// Colombian Holidays for 2026
// Implements Meeus/Jones/Butcher Computus algorithm for Easter calculation
// Ley Emiliani (Ley 51 de 1983) adjustments for movable holidays
// ALL dates use UTC midnight to avoid timezone issues in MongoDB storage

/**
 * Meeus/Jones/Butcher Computus algorithm
 * Calculates the date of Easter Sunday for a given year.
 * Reference: Jean Meeus, "Astronomical Algorithms" (1991)
 */
export function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Ley Emiliani (Ley 51 de 1983): Moves certain holidays to the following Monday.
 * If the date is already a Monday, it stays. Otherwise, advance to next Monday.
 */
export function nextMonday(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  if (dayOfWeek === 1) return date; // Already Monday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + daysUntilMonday
  ));
}

/**
 * Helper: add days to a UTC date
 */
function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + days
  ));
}

/**
 * Helper: create a UTC date at midnight
 */
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

interface HolidayEntry {
  anio: number;
  fecha: Date;
  nombre: string;
  tipo: "FIJO" | "EMILIANI";
}

/**
 * Generate all 18 Colombian holidays for a given year.
 */
export function colombianHolidays(year: number): HolidayEntry[] {
  const easter = easterDate(year);

  const holidays: HolidayEntry[] = [
    // ─── Fixed holidays (never move) ───
    { anio: year, fecha: utc(year, 1, 1), nombre: "Ano Nuevo", tipo: "FIJO" },
    { anio: year, fecha: utc(year, 5, 1), nombre: "Dia del Trabajo", tipo: "FIJO" },
    { anio: year, fecha: utc(year, 7, 20), nombre: "Dia de la Independencia", tipo: "FIJO" },
    { anio: year, fecha: utc(year, 8, 7), nombre: "Batalla de Boyaca", tipo: "FIJO" },
    { anio: year, fecha: utc(year, 12, 8), nombre: "Inmaculada Concepcion", tipo: "FIJO" },
    { anio: year, fecha: utc(year, 12, 25), nombre: "Navidad", tipo: "FIJO" },

    // ─── Easter-dependent fixed holidays (always Thursday/Friday) ───
    { anio: year, fecha: addDays(easter, -3), nombre: "Jueves Santo", tipo: "FIJO" },
    { anio: year, fecha: addDays(easter, -2), nombre: "Viernes Santo", tipo: "FIJO" },

    // ─── Ley Emiliani holidays (move to following Monday) ───
    { anio: year, fecha: nextMonday(utc(year, 1, 6)), nombre: "Reyes Magos", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 3, 19)), nombre: "San Jose", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 6, 29)), nombre: "San Pedro y San Pablo", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 8, 15)), nombre: "Asuncion de la Virgen", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 10, 12)), nombre: "Dia de la Raza", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 11, 1)), nombre: "Todos los Santos", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(utc(year, 11, 11)), nombre: "Independencia de Cartagena", tipo: "EMILIANI" },

    // ─── Easter-dependent Ley Emiliani holidays ───
    { anio: year, fecha: nextMonday(addDays(easter, 43)), nombre: "Ascension del Senor", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(addDays(easter, 64)), nombre: "Corpus Christi", tipo: "EMILIANI" },
    { anio: year, fecha: nextMonday(addDays(easter, 71)), nombre: "Sagrado Corazon", tipo: "EMILIANI" },
  ];

  return holidays;
}

// Export the 2026 holidays array
export const holidays2026: HolidayEntry[] = colombianHolidays(2026);

// ─── Self-test when run directly ───
if (typeof process !== "undefined" && process.argv[1]?.includes("holidays-2026")) {
  const easter = easterDate(2026);
  const easterMonth = easter.getUTCMonth() + 1;
  const easterDay = easter.getUTCDate();

  // Verify Easter 2026 is April 5
  if (easterMonth !== 4 || easterDay !== 5) {
    console.error(`ASSERTION FAILED: Easter 2026 should be April 5, got ${easterMonth}/${easterDay}`);
    process.exit(1);
  }
  console.log(`Easter 2026: April ${easterDay} (correct)`);

  // Verify 18 holidays
  if (holidays2026.length !== 18) {
    console.error(`ASSERTION FAILED: Expected 18 holidays, got ${holidays2026.length}`);
    process.exit(1);
  }
  console.log(`${holidays2026.length} holidays (correct)`);

  // Print all holidays
  for (const h of holidays2026) {
    const d = h.fecha;
    console.log(`  ${d.toISOString().slice(0, 10)} - ${h.nombre} (${h.tipo})`);
  }
}
