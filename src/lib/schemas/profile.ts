import { z } from "zod";

/**
 * Unified profile edit schema. All fields required because
 * the profile form always submits the complete set of values.
 *
 * This is intentionally separate from the onboarding step schemas
 * which use partial validation per wizard step.
 */
export const profileSchema = z.object({
  tipoEmpresa: z.enum(["NATURAL", "JURIDICA"], {
    error: "Selecciona el tipo de empresa",
  }),
  regimen: z.enum(["ORDINARIO", "SIMPLE", "ESPECIAL"], {
    error: "Selecciona el regimen tributario",
  }),
  tamano: z.enum(["GRANDE", "MEDIANO", "PEQUENO", "MICRO"], {
    error: "Selecciona el tamano",
  }),
  nit: z
    .string()
    .min(6, "El NIT debe tener al menos 6 digitos")
    .max(10, "El NIT no puede tener mas de 10 digitos")
    .regex(/^\d+$/, "El NIT solo debe contener numeros"),
  ciiu: z.string().length(4, "Selecciona una actividad economica (CIIU)"),
  ciudad: z.string().min(1, "Selecciona una ciudad"),
  rangoIngresos: z.enum(
    ["RANGO_1", "RANGO_2", "RANGO_3", "RANGO_4", "RANGO_5"],
    { error: "Selecciona el rango de ingresos" },
  ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
