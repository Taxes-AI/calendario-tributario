/**
 * Shared field options for empresa profile fields.
 * Used by both onboarding wizard and profile editing form.
 *
 * Extracted from onboarding step components to avoid duplication.
 * CIIU codes remain in their own file (large dataset).
 */

export const TIPO_EMPRESA_OPTIONS = [
  {
    value: "NATURAL" as const,
    label: "Persona Natural",
    description:
      "Persona que ejerce actividades economicas a titulo personal",
  },
  {
    value: "JURIDICA" as const,
    label: "Persona Juridica",
    description:
      "Sociedad o entidad legalmente constituida (SAS, LTDA, SA, etc.)",
  },
] as const;

export const REGIMEN_OPTIONS = [
  {
    value: "ORDINARIO" as const,
    label: "Regimen Ordinario",
    description:
      "Facturas con IVA (19%). Aplica para la mayoria de empresas.",
  },
  {
    value: "SIMPLE" as const,
    label: "Regimen Simple de Tributacion (RST)",
    description:
      "Impuesto unificado. IVA e ICA integrados. Para empresas con ingresos menores a 100.000 UVT.",
  },
  {
    value: "ESPECIAL" as const,
    label: "Regimen Tributario Especial (RTE)",
    description:
      "Para entidades sin animo de lucro, fundaciones y cooperativas.",
  },
] as const;

export const TAMANO_OPTIONS = [
  {
    value: "GRANDE" as const,
    label: "Gran Contribuyente",
    description:
      "Designado por la DIAN. Obligaciones adicionales y plazos especiales.",
  },
  {
    value: "MEDIANO" as const,
    label: "Mediano",
    description: "Empresa mediana. Obligaciones tributarias estandar.",
  },
  {
    value: "PEQUENO" as const,
    label: "Pequeno",
    description: "Empresa pequena. Puede tener menos obligaciones.",
  },
  {
    value: "MICRO" as const,
    label: "Microempresa",
    description: "Microempresa. Requisitos simplificados.",
  },
] as const;

export const CIUDAD_OPTIONS = [
  { value: "BOGOTA", label: "Bogota D.C." },
  { value: "MEDELLIN", label: "Medellin" },
  { value: "CALI", label: "Cali" },
  { value: "BARRANQUILLA", label: "Barranquilla" },
  { value: "OTRO", label: "Otra ciudad" },
] as const;

export const INCOME_BRACKETS = [
  { value: "RANGO_1", uvtMin: 0, uvtMax: 3500, label: "Hasta 3.500 UVT" },
  {
    value: "RANGO_2",
    uvtMin: 3500,
    uvtMax: 10000,
    label: "3.500 - 10.000 UVT",
  },
  {
    value: "RANGO_3",
    uvtMin: 10000,
    uvtMax: 92000,
    label: "10.000 - 92.000 UVT",
  },
  {
    value: "RANGO_4",
    uvtMin: 92000,
    uvtMax: 300000,
    label: "92.000 - 300.000 UVT",
  },
  { value: "RANGO_5", uvtMin: 300000, uvtMax: 0, label: "> 300.000 UVT" },
] as const;
