// Prisma Seed Script - DIAN 2026 Reference Data
// Idempotent: deletes all 2026 data first, then recreates.
// Run with: npx prisma db seed

import { PrismaClient } from "../src/generated/prisma/client";
import { dianCalendar2026 } from "./data/dian-calendar-2026";
import { holidays2026 } from "./data/holidays-2026";
import { nitLookup2026 } from "./data/nit-lookup-2026";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DIAN 2026 seed...\n");

  // ─── 1. Clear existing 2026 data (idempotent reset) ───
  console.log("Clearing existing 2026 data...");
  await prisma.fechaVencimiento.deleteMany({ where: { anio: 2026 } });
  await prisma.calendarioTributario.deleteMany({ where: { anio: 2026 } });
  await prisma.festivoColombiano.deleteMany({ where: { anio: 2026 } });
  await prisma.configuracionSistema.deleteMany({
    where: { clave: { startsWith: "UVT_2026" } },
  });
  console.log("  Cleared.\n");

  // ─── 2. Seed CalendarioTributario (tax types) ───
  console.log("Seeding DIAN 2026 calendar...");
  const calendarMap = new Map<string, string>(); // impuesto -> id
  for (const cal of dianCalendar2026) {
    const created = await prisma.calendarioTributario.create({ data: cal });
    calendarMap.set(cal.impuesto, created.id);
  }
  console.log(`  Created ${calendarMap.size} tax calendar entries`);

  // ─── 3. Seed FechaVencimiento (NIT digit lookups) ───
  console.log("Seeding NIT digit lookup tables...");
  let nitCount = 0;
  for (const entry of nitLookup2026) {
    const calId = calendarMap.get(entry.impuesto);
    if (!calId) {
      console.warn(
        `  WARNING: No calendar entry for ${entry.impuesto}, skipping ${entry.periodo}/${entry.digitoNit}`
      );
      continue;
    }
    await prisma.fechaVencimiento.create({
      data: {
        calendarioTributarioId: calId,
        anio: entry.anio,
        periodo: entry.periodo,
        digitoNit: entry.digitoNit,
        fechaLimite: entry.fechaLimite,
      },
    });
    nitCount++;
  }
  console.log(`  Created ${nitCount} NIT deadline entries`);

  // ─── 4. Seed FestivoColombiano (holidays) ───
  console.log("Seeding Colombian holidays 2026...");
  for (const holiday of holidays2026) {
    await prisma.festivoColombiano.create({ data: holiday });
  }
  console.log(`  Created ${holidays2026.length} holidays`);

  // ─── 5. Seed ConfiguracionSistema (UVT) ───
  console.log("Seeding UVT 2026 configuration...");
  await prisma.configuracionSistema.create({
    data: {
      clave: "UVT_2026",
      anio: 2026,
      valor: "52374",
      descripcion:
        "Unidad de Valor Tributario 2026 (Resolucion DIAN 000238 de 2025)",
    },
  });
  console.log("  UVT 2026: $52,374");

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
