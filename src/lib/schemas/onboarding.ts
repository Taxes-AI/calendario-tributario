import { z } from "zod";

/**
 * Zod validation schemas for the 4-step onboarding wizard.
 * All error messages are in Spanish per project localization requirements.
 *
 * Step 1: Tipo de empresa (NATURAL / JURIDICA)
 * Step 2: Regimen tributario + Tamano
 * Step 3: NIT (base number only)
 * Step 4: Actividad economica (CIIU), Ciudad, Rango de ingresos
 */

// ─────────────────────────────────────────────────────
// Step 1: Tipo de empresa
// ─────────────────────────────────────────────────────

export const stepEmpresaSchema = z.object({
  tipoEmpresa: z.enum(["NATURAL", "JURIDICA"], {
    error: "Selecciona el tipo de empresa",
  }),
});

export type StepEmpresaData = z.infer<typeof stepEmpresaSchema>;

// ─────────────────────────────────────────────────────
// Step 2: Regimen tributario y tamano
// ─────────────────────────────────────────────────────

export const stepRegimenSchema = z.object({
  regimen: z.enum(["ORDINARIO", "SIMPLE", "ESPECIAL"], {
    error: "Selecciona el regimen tributario",
  }),
  tamano: z.enum(["GRANDE", "MEDIANO", "PEQUENO", "MICRO"], {
    error: "Selecciona el tamano de la empresa",
  }),
});

export type StepRegimenData = z.infer<typeof stepRegimenSchema>;

// ─────────────────────────────────────────────────────
// Step 3: NIT
// ─────────────────────────────────────────────────────

export const stepNitSchema = z.object({
  nit: z
    .string()
    .min(6, "El NIT debe tener al menos 6 digitos")
    .max(10, "El NIT no puede tener mas de 10 digitos")
    .regex(/^\d+$/, "El NIT solo debe contener numeros"),
});

export type StepNitData = z.infer<typeof stepNitSchema>;

// ─────────────────────────────────────────────────────
// Step 4: Actividad economica, ciudad e ingresos
// ─────────────────────────────────────────────────────

export const stepActividadSchema = z.object({
  ciiu: z.string().length(4, "Selecciona una actividad economica (CIIU)"),
  ciudad: z.string().min(1, "Selecciona una ciudad"),
  rangoIngresos: z.enum(
    ["RANGO_1", "RANGO_2", "RANGO_3", "RANGO_4", "RANGO_5"],
    {
      error: "Selecciona el rango de ingresos",
    }
  ),
});

export type StepActividadData = z.infer<typeof stepActividadSchema>;
