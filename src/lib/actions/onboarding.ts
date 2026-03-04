"use server";

import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateObligaciones } from "@/lib/services/matching-engine";
import {
  stepEmpresaSchema,
  stepRegimenSchema,
  stepNitSchema,
  stepActividadSchema,
} from "@/lib/schemas/onboarding";
import { validateNit } from "@/lib/services/nit-validator";

// ─────────────────────────────────────────────────────
// Authenticated action client
// ─────────────────────────────────────────────────────

const actionClient = createSafeActionClient();

const authedAction = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("No autenticado");
  return next({ ctx: { userId: session.user.id } });
});

// ─────────────────────────────────────────────────────
// Helper: get current onboarding step
// ─────────────────────────────────────────────────────

async function getCurrentStep(userId: string): Promise<number> {
  const empresa = await prisma.empresa.findUnique({
    where: { userId },
    select: { onboardingStep: true },
  });
  return empresa?.onboardingStep ?? 0;
}

// ─────────────────────────────────────────────────────
// Step 1: Save empresa type
// ─────────────────────────────────────────────────────

export const saveStepEmpresa = authedAction
  .schema(stepEmpresaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const currentStep = await getCurrentStep(ctx.userId);

    await prisma.empresa.upsert({
      where: { userId: ctx.userId },
      create: {
        userId: ctx.userId,
        tipoEmpresa: parsedInput.tipoEmpresa,
        onboardingStep: 1,
      },
      update: {
        tipoEmpresa: parsedInput.tipoEmpresa,
        onboardingStep: Math.max(currentStep, 1),
      },
    });

    return { success: true };
  });

// ─────────────────────────────────────────────────────
// Step 2: Save regimen and tamano
// ─────────────────────────────────────────────────────

export const saveStepRegimen = authedAction
  .schema(stepRegimenSchema)
  .action(async ({ parsedInput, ctx }) => {
    const currentStep = await getCurrentStep(ctx.userId);

    await prisma.empresa.upsert({
      where: { userId: ctx.userId },
      create: {
        userId: ctx.userId,
        regimen: parsedInput.regimen,
        tamano: parsedInput.tamano,
        onboardingStep: 2,
      },
      update: {
        regimen: parsedInput.regimen,
        tamano: parsedInput.tamano,
        onboardingStep: Math.max(currentStep, 2),
      },
    });

    return { success: true };
  });

// ─────────────────────────────────────────────────────
// Step 3: Save NIT with computed DV
// ─────────────────────────────────────────────────────

export const saveStepNit = authedAction
  .schema(stepNitSchema)
  .action(async ({ parsedInput, ctx }) => {
    const currentStep = await getCurrentStep(ctx.userId);
    const nitResult = validateNit(parsedInput.nit);

    await prisma.empresa.upsert({
      where: { userId: ctx.userId },
      create: {
        userId: ctx.userId,
        nit: nitResult.baseNumber,
        digitoVerificacion: String(nitResult.verificationDigit),
        onboardingStep: 3,
      },
      update: {
        nit: nitResult.baseNumber,
        digitoVerificacion: String(nitResult.verificationDigit),
        onboardingStep: Math.max(currentStep, 3),
      },
    });

    return { success: true };
  });

// ─────────────────────────────────────────────────────
// Step 4: Save actividad economica, ciudad, ingresos
// ─────────────────────────────────────────────────────

export const saveStepActividad = authedAction
  .schema(stepActividadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const currentStep = await getCurrentStep(ctx.userId);

    await prisma.empresa.upsert({
      where: { userId: ctx.userId },
      create: {
        userId: ctx.userId,
        ciiu: parsedInput.ciiu,
        ciudad: parsedInput.ciudad,
        rangoIngresos: parsedInput.rangoIngresos,
        onboardingStep: 4,
      },
      update: {
        ciiu: parsedInput.ciiu,
        ciudad: parsedInput.ciudad,
        rangoIngresos: parsedInput.rangoIngresos,
        onboardingStep: Math.max(currentStep, 4),
      },
    });

    return { success: true };
  });

// ─────────────────────────────────────────────────────
// Complete onboarding (triggers matching engine)
// ─────────────────────────────────────────────────────

export const completeOnboarding = authedAction.action(
  async ({ ctx }) => {
    const empresa = await prisma.empresa.findUnique({
      where: { userId: ctx.userId },
    });

    if (!empresa) {
      throw new Error("No se encontro la empresa. Completa todos los pasos.");
    }

    // Verify all required fields are present
    const requiredFields = [
      "tipoEmpresa",
      "regimen",
      "tamano",
      "nit",
      "ciiu",
      "ciudad",
      "rangoIngresos",
    ] as const;

    for (const field of requiredFields) {
      if (!empresa[field]) {
        throw new Error(
          `Falta el campo ${field}. Completa todos los pasos del formulario.`,
        );
      }
    }

    // Mark onboarding as complete
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: { onboardingComplete: true },
    });

    // Reload empresa with updated data for matching engine
    const updatedEmpresa = await prisma.empresa.findUniqueOrThrow({
      where: { id: empresa.id },
    });

    // Generate tax obligations via matching engine
    const count = await generateObligaciones(updatedEmpresa);

    return { success: true, obligacionesGeneradas: count };
  },
);

