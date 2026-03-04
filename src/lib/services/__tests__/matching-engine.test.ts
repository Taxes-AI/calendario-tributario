import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EmpresaProfile } from "../matching-types";

// Mock Prisma before importing the engine
vi.mock("@/lib/prisma", () => ({
  prisma: {
    calendarioTributario: { findMany: vi.fn() },
    fechaVencimiento: { findMany: vi.fn() },
    obligacionTributaria: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  evaluateCondition,
  matchTaxes,
  generateObligaciones,
  recalculateObligaciones,
} from "../matching-engine";

// ---------------------------------------------------------------------------
// Test profiles
// ---------------------------------------------------------------------------
const juridicaOrdinarioGrandeProfile: EmpresaProfile = {
  tipoEmpresa: "JURIDICA",
  regimen: "ORDINARIO",
  tamano: "GRANDE",
  nit: "860069804",
  ciiu: "6412",
  ciudad: "BOGOTA",
  rangoIngresos: "RANGO_5",
};

const naturalSimpleProfile: EmpresaProfile = {
  tipoEmpresa: "NATURAL",
  regimen: "SIMPLE",
  tamano: "MICRO",
  nit: "123456789",
  ciiu: "4711",
  ciudad: "BOGOTA",
  rangoIngresos: "RANGO_1",
};

const medellinProfile: EmpresaProfile = {
  tipoEmpresa: "JURIDICA",
  regimen: "ORDINARIO",
  tamano: "MEDIANO",
  nit: "900123456",
  ciiu: "6201",
  ciudad: "MEDELLIN",
  rangoIngresos: "RANGO_3",
};

// ---------------------------------------------------------------------------
// evaluateCondition tests -- pure function, no DB
// ---------------------------------------------------------------------------
describe("evaluateCondition", () => {
  const profile: EmpresaProfile = {
    tipoEmpresa: "JURIDICA",
    regimen: "ORDINARIO",
    tamano: "GRANDE",
    nit: "860069804",
    ciiu: "6412",
    ciudad: "BOGOTA",
    rangoIngresos: "RANGO_5",
  };

  it("EQUALS returns true when field matches value", () => {
    expect(
      evaluateCondition(
        { campo: "tipoEmpresa", operador: "EQUALS", valor: "JURIDICA" },
        profile,
      ),
    ).toBe(true);
  });

  it("EQUALS returns false when field does not match value", () => {
    expect(
      evaluateCondition(
        { campo: "tipoEmpresa", operador: "EQUALS", valor: "NATURAL" },
        profile,
      ),
    ).toBe(false);
  });

  it("NOT_EQUALS returns true when field differs from value", () => {
    expect(
      evaluateCondition(
        { campo: "regimen", operador: "NOT_EQUALS", valor: "SIMPLE" },
        profile,
      ),
    ).toBe(true);
  });

  it("NOT_EQUALS returns false when field equals value", () => {
    expect(
      evaluateCondition(
        { campo: "regimen", operador: "NOT_EQUALS", valor: "ORDINARIO" },
        profile,
      ),
    ).toBe(false);
  });

  it("IN returns true when field is in comma-separated list", () => {
    expect(
      evaluateCondition(
        { campo: "regimen", operador: "IN", valor: "ORDINARIO,ESPECIAL" },
        profile,
      ),
    ).toBe(true);
  });

  it("IN returns false when field is not in comma-separated list", () => {
    expect(
      evaluateCondition(
        { campo: "regimen", operador: "IN", valor: "SIMPLE,ESPECIAL" },
        profile,
      ),
    ).toBe(false);
  });

  it("NOT_IN returns true when field is not in comma-separated list", () => {
    expect(
      evaluateCondition(
        { campo: "tamano", operador: "NOT_IN", valor: "MEDIANO,PEQUENO" },
        profile,
      ),
    ).toBe(true);
  });

  it("NOT_IN returns false when field is in comma-separated list", () => {
    expect(
      evaluateCondition(
        { campo: "tamano", operador: "NOT_IN", valor: "GRANDE,MEDIANO" },
        profile,
      ),
    ).toBe(false);
  });

  it("returns false for unknown operator", () => {
    expect(
      evaluateCondition(
        {
          campo: "tipoEmpresa",
          operador: "LIKE" as never,
          valor: "JUR%",
        },
        profile,
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchTaxes tests -- pure function using TAX_RULES, no DB
// ---------------------------------------------------------------------------
describe("matchTaxes", () => {
  it("JURIDICA/ORDINARIO/GRANDE/RANGO_5/BOGOTA matches 7 taxes", () => {
    const matched = matchTaxes(juridicaOrdinarioGrandeProfile);
    const impuestos = matched.map((r) => r.impuesto);

    // Should match: RENTA, IVA_BIMESTRAL, RETENCION_FUENTE, ICA, GMF, ACTIVOS, CONSUMO
    expect(impuestos).toContain("RENTA");
    expect(impuestos).toContain("IVA_BIMESTRAL");
    expect(impuestos).toContain("RETENCION_FUENTE");
    expect(impuestos).toContain("ICA");
    expect(impuestos).toContain("GMF");
    expect(impuestos).toContain("ACTIVOS");
    expect(impuestos).toContain("CONSUMO");

    // Should NOT match
    expect(impuestos).not.toContain("RENTA_PN");
    expect(impuestos).not.toContain("IVA_CUATRIMESTRAL");

    expect(matched).toHaveLength(7);
  });

  it("NATURAL/SIMPLE excludes IVA and RETENCION", () => {
    const matched = matchTaxes(naturalSimpleProfile);
    const impuestos = matched.map((r) => r.impuesto);

    // SIMPLE regime: IVA_BIMESTRAL, IVA_CUATRIMESTRAL, RETENCION_FUENTE excluded
    expect(impuestos).not.toContain("IVA_BIMESTRAL");
    expect(impuestos).not.toContain("IVA_CUATRIMESTRAL");
    expect(impuestos).not.toContain("RETENCION_FUENTE");
    // NATURAL excludes RENTA (corporate)
    expect(impuestos).not.toContain("RENTA");
    // SIMPLE excludes RENTA_PN too (NOT_EQUALS SIMPLE)
    expect(impuestos).not.toContain("RENTA_PN");
    // SIMPLE excludes CONSUMO (IN ORDINARIO,ESPECIAL)
    expect(impuestos).not.toContain("CONSUMO");
    // SIMPLE excludes ACTIVOS (IN ORDINARIO,ESPECIAL)
    expect(impuestos).not.toContain("ACTIVOS");
  });

  it("MEDELLIN profile does NOT match ICA (only BOGOTA)", () => {
    const matched = matchTaxes(medellinProfile);
    const impuestos = matched.map((r) => r.impuesto);

    expect(impuestos).not.toContain("ICA");
  });

  it("MEDELLIN profile matches IVA_CUATRIMESTRAL for RANGO_3", () => {
    const matched = matchTaxes(medellinProfile);
    const impuestos = matched.map((r) => r.impuesto);

    expect(impuestos).toContain("IVA_CUATRIMESTRAL");
    // RANGO_3 is not in RANGO_4,RANGO_5 so no IVA_BIMESTRAL
    expect(impuestos).not.toContain("IVA_BIMESTRAL");
  });
});

// ---------------------------------------------------------------------------
// generateObligaciones tests -- requires Prisma mock
// ---------------------------------------------------------------------------
describe("generateObligaciones", () => {
  const mockEmpresa = {
    id: "emp-001",
    userId: "user-001",
    tipoEmpresa: "JURIDICA",
    regimen: "ORDINARIO",
    tamano: "GRANDE",
    nit: "860069804",
    ciiu: "6412",
    ciudad: "BOGOTA",
    rangoIngresos: "RANGO_5",
    digitoVerificacion: "2",
    razonSocial: "Test Corp",
    onboardingStep: 4,
    onboardingComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const makeCalendario = (impuesto: string, periodicidad: string) => ({
    id: `cal-${impuesto}`,
    anio: 2026,
    impuesto,
    concepto: impuesto,
    periodicidad,
    resolucionFuente: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const makeFecha = (
    calId: string,
    periodo: string,
    digitoNit: string,
    fecha: Date,
  ) => ({
    id: `fecha-${calId}-${periodo}-${digitoNit}`,
    calendarioTributarioId: calId,
    anio: 2026,
    periodo,
    digitoNit,
    fechaLimite: fecha,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates obligations for each matched tax and period", async () => {
    // NIT 860069804 -> lastOneDigit="4", lastTwoDigits="04"
    const calendarios = [
      makeCalendario("RENTA", "ANUAL"),
      makeCalendario("IVA_BIMESTRAL", "BIMESTRAL"),
      makeCalendario("RETENCION_FUENTE", "MENSUAL"),
    ];

    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue(
      calendarios,
    );

    // RENTA: annual, uses 2 digits ("04") -> 1 fecha
    vi.mocked(prisma.fechaVencimiento.findMany).mockImplementation(
      (args: unknown) => {
        const { where } = args as { where: { calendarioTributarioId: string; digitoNit: string } };
        if (where.calendarioTributarioId === "cal-RENTA") {
          return Promise.resolve([
            makeFecha("cal-RENTA", "2026", "04", new Date("2026-04-15")),
          ]);
        }
        if (where.calendarioTributarioId === "cal-IVA_BIMESTRAL") {
          // 6 bimonthly periods, uses 1 digit ("4")
          return Promise.resolve([
            makeFecha("cal-IVA_BIMESTRAL", "202601-02", "4", new Date("2026-03-10")),
            makeFecha("cal-IVA_BIMESTRAL", "202603-04", "4", new Date("2026-05-10")),
            makeFecha("cal-IVA_BIMESTRAL", "202605-06", "4", new Date("2026-07-10")),
            makeFecha("cal-IVA_BIMESTRAL", "202607-08", "4", new Date("2026-09-10")),
            makeFecha("cal-IVA_BIMESTRAL", "202609-10", "4", new Date("2026-11-10")),
            makeFecha("cal-IVA_BIMESTRAL", "202611-12", "4", new Date("2027-01-10")),
          ]);
        }
        if (where.calendarioTributarioId === "cal-RETENCION_FUENTE") {
          // 12 monthly periods, uses 1 digit ("4")
          return Promise.resolve(
            Array.from({ length: 12 }, (_, i) => {
              const month = String(i + 1).padStart(2, "0");
              return makeFecha(
                "cal-RETENCION_FUENTE",
                `2026${month}`,
                "4",
                new Date(`2026-${month}-15`),
              );
            }),
          );
        }
        return Promise.resolve([]);
      },
    );

    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 19,
    });

    const count = await generateObligaciones(mockEmpresa as never);

    // 1 RENTA + 6 IVA_BIMESTRAL + 12 RETENCION_FUENTE = 19
    expect(count).toBe(19);
    expect(prisma.obligacionTributaria.createMany).toHaveBeenCalledOnce();

    const createCall = vi.mocked(prisma.obligacionTributaria.createMany).mock
      .calls[0][0];
    const data = (createCall as { data: unknown[] }).data;
    expect(data).toHaveLength(19);

    // Verify all obligations reference the correct empresa
    for (const ob of data as Array<{ empresaId: string }>) {
      expect(ob.empresaId).toBe("emp-001");
    }
  });

  it("uses 1-digit NIT lookup for monthly taxes, 2-digit for annual", async () => {
    const calendarios = [
      makeCalendario("RENTA", "ANUAL"),
      makeCalendario("IVA_BIMESTRAL", "BIMESTRAL"),
    ];

    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue(
      calendarios,
    );
    vi.mocked(prisma.fechaVencimiento.findMany).mockResolvedValue([]);
    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 0,
    });

    await generateObligaciones(mockEmpresa as never);

    const calls = vi.mocked(prisma.fechaVencimiento.findMany).mock.calls;

    // Find the call for RENTA (annual, digitosNit=2) -- should use "04"
    const rentaCall = calls.find(
      (c) => (c[0] as { where: { calendarioTributarioId: string } }).where.calendarioTributarioId === "cal-RENTA",
    );
    expect(
      (rentaCall![0] as { where: { digitoNit: string } }).where.digitoNit,
    ).toBe("04");

    // Find the call for IVA_BIMESTRAL (bimonthly, digitosNit=1) -- should use "4"
    const ivaCall = calls.find(
      (c) => (c[0] as { where: { calendarioTributarioId: string } }).where.calendarioTributarioId === "cal-IVA_BIMESTRAL",
    );
    expect(
      (ivaCall![0] as { where: { digitoNit: string } }).where.digitoNit,
    ).toBe("4");
  });

  it("returns 0 and does not call createMany when no calendarios match", async () => {
    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue([]);
    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 0,
    });

    const count = await generateObligaciones(mockEmpresa as never);

    expect(count).toBe(0);
    expect(prisma.obligacionTributaria.createMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// recalculateObligaciones tests -- requires Prisma mock
// ---------------------------------------------------------------------------
describe("recalculateObligaciones", () => {
  const mockEmpresa = {
    id: "emp-002",
    userId: "user-002",
    tipoEmpresa: "JURIDICA",
    regimen: "ORDINARIO",
    tamano: "GRANDE",
    nit: "860069804",
    ciiu: "6412",
    ciudad: "BOGOTA",
    rangoIngresos: "RANGO_5",
    digitoVerificacion: "2",
    razonSocial: "Test Corp",
    onboardingStep: 4,
    onboardingComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const makeCalendario = (impuesto: string, periodicidad: string) => ({
    id: `cal-${impuesto}`,
    anio: 2026,
    impuesto,
    concepto: impuesto,
    periodicidad,
    resolucionFuente: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const makeFecha = (
    calId: string,
    periodo: string,
    digitoNit: string,
    fecha: Date,
  ) => ({
    id: `fecha-${calId}-${periodo}-${digitoNit}`,
    calendarioTributarioId: calId,
    anio: 2026,
    periodo,
    digitoNit,
    fechaLimite: fecha,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only PENDIENTE and PROXIMO obligations", async () => {
    vi.mocked(prisma.obligacionTributaria.findMany).mockResolvedValue([]);
    vi.mocked(prisma.obligacionTributaria.deleteMany).mockResolvedValue({
      count: 5,
    });
    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue([]);
    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 0,
    });

    await recalculateObligaciones(mockEmpresa as never);

    expect(prisma.obligacionTributaria.deleteMany).toHaveBeenCalledWith({
      where: {
        empresaId: "emp-002",
        estado: { in: ["PENDIENTE", "PROXIMO"] },
      },
    });
  });

  it("preserves PAGADO records and skips duplicates", async () => {
    // Existing PAGADO record for RENTA 2026
    vi.mocked(prisma.obligacionTributaria.findMany).mockResolvedValue([
      {
        id: "ob-paid",
        empresaId: "emp-002",
        calendarioTributarioId: "cal-RENTA",
        impuesto: "RENTA",
        periodo: "2026",
        fechaVencimiento: new Date("2026-04-15"),
        estado: "PAGADO",
        fechaPago: new Date("2026-04-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(prisma.obligacionTributaria.deleteMany).mockResolvedValue({
      count: 3,
    });

    const calendarios = [makeCalendario("RENTA", "ANUAL")];
    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue(
      calendarios,
    );

    // RENTA deadline for digitoNit="04"
    vi.mocked(prisma.fechaVencimiento.findMany).mockResolvedValue([
      makeFecha("cal-RENTA", "2026", "04", new Date("2026-04-15")),
    ]);

    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 0,
    });

    const result = await recalculateObligaciones(mockEmpresa as never);

    // RENTA:2026 is PAGADO so should be preserved (not recreated)
    expect(result.preserved).toBe(1);
    expect(result.deleted).toBe(3);
    expect(result.created).toBe(0);

    // createMany should not be called since there are 0 new obligations
    expect(prisma.obligacionTributaria.createMany).not.toHaveBeenCalled();
  });

  it("creates new obligations for non-PAGADO tax+period combos", async () => {
    // No PAGADO records
    vi.mocked(prisma.obligacionTributaria.findMany).mockResolvedValue([]);
    vi.mocked(prisma.obligacionTributaria.deleteMany).mockResolvedValue({
      count: 0,
    });

    const calendarios = [makeCalendario("RENTA", "ANUAL")];
    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue(
      calendarios,
    );

    vi.mocked(prisma.fechaVencimiento.findMany).mockResolvedValue([
      makeFecha("cal-RENTA", "2026", "04", new Date("2026-04-15")),
    ]);

    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 1,
    });

    const result = await recalculateObligaciones(mockEmpresa as never);

    expect(result.created).toBe(1);
    expect(result.preserved).toBe(0);
    expect(prisma.obligacionTributaria.createMany).toHaveBeenCalledOnce();
  });

  it("returns correct counts for mixed PAGADO and new obligations", async () => {
    // 1 PAGADO for IVA_BIMESTRAL 202601-02
    vi.mocked(prisma.obligacionTributaria.findMany).mockResolvedValue([
      {
        id: "ob-paid-iva",
        empresaId: "emp-002",
        calendarioTributarioId: "cal-IVA_BIMESTRAL",
        impuesto: "IVA_BIMESTRAL",
        periodo: "202601-02",
        fechaVencimiento: new Date("2026-03-10"),
        estado: "PAGADO",
        fechaPago: new Date("2026-03-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(prisma.obligacionTributaria.deleteMany).mockResolvedValue({
      count: 5,
    });

    const calendarios = [makeCalendario("IVA_BIMESTRAL", "BIMESTRAL")];
    vi.mocked(prisma.calendarioTributario.findMany).mockResolvedValue(
      calendarios,
    );

    // 3 bimonthly periods available, 1 overlaps with PAGADO
    vi.mocked(prisma.fechaVencimiento.findMany).mockResolvedValue([
      makeFecha("cal-IVA_BIMESTRAL", "202601-02", "4", new Date("2026-03-10")),
      makeFecha("cal-IVA_BIMESTRAL", "202603-04", "4", new Date("2026-05-10")),
      makeFecha("cal-IVA_BIMESTRAL", "202605-06", "4", new Date("2026-07-10")),
    ]);

    vi.mocked(prisma.obligacionTributaria.createMany).mockResolvedValue({
      count: 2,
    });

    const result = await recalculateObligaciones(mockEmpresa as never);

    expect(result.deleted).toBe(5);
    expect(result.preserved).toBe(1); // 202601-02 was PAGADO
    expect(result.created).toBe(2); // 202603-04 and 202605-06
  });
});
