"use server";

import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/schemas/profile";
import { recalculateObligaciones } from "@/lib/services/matching-engine";
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
// getProfileData: fetch empresa + obligation stats
// ─────────────────────────────────────────────────────

export const getProfileData = authedAction.action(async ({ ctx }) => {
  const empresa = await prisma.empresa.findUnique({
    where: { userId: ctx.userId },
    select: {
      id: true,
      tipoEmpresa: true,
      regimen: true,
      tamano: true,
      nit: true,
      digitoVerificacion: true,
      ciiu: true,
      ciudad: true,
      rangoIngresos: true,
    },
  });

  if (!empresa) {
    throw new Error("No se encontro la empresa.");
  }

  // Count obligations by status
  const statusCounts = await prisma.obligacionTributaria.groupBy({
    by: ["estado"],
    where: { empresaId: empresa.id },
    _count: { estado: true },
  });

  const stats = {
    total: 0,
    pagadas: 0,
    vencidas: 0,
    pendientes: 0,
    proximas: 0,
  };

  for (const group of statusCounts) {
    const count = group._count.estado;
    stats.total += count;
    switch (group.estado) {
      case "PAGADO":
        stats.pagadas = count;
        break;
      case "VENCIDO":
        stats.vencidas = count;
        break;
      case "PENDIENTE":
        stats.pendientes = count;
        break;
      case "PROXIMO":
        stats.proximas = count;
        break;
    }
  }

  return { empresa, stats };
});

// ─────────────────────────────────────────────────────
// updateProfile: save changes + recalculate obligations
// ─────────────────────────────────────────────────────

export const updateProfile = authedAction
  .schema(profileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const empresa = await prisma.empresa.findUnique({
      where: { userId: ctx.userId },
    });

    if (!empresa) {
      throw new Error("No se encontro la empresa.");
    }

    // Build update data, computing DV if NIT changed
    const updateData: Record<string, unknown> = {
      tipoEmpresa: parsedInput.tipoEmpresa,
      regimen: parsedInput.regimen,
      tamano: parsedInput.tamano,
      ciiu: parsedInput.ciiu,
      ciudad: parsedInput.ciudad,
      rangoIngresos: parsedInput.rangoIngresos,
    };

    // Always compute DV from NIT (covers both changed and unchanged cases)
    const nitResult = validateNit(parsedInput.nit);
    updateData.nit = nitResult.baseNumber;
    updateData.digitoVerificacion = String(nitResult.verificationDigit);

    // Update empresa
    const updatedEmpresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: updateData,
    });

    // Recalculate obligations
    const result = await recalculateObligaciones(updatedEmpresa);

    // Revalidate pages that show obligation data
    revalidatePath("/dashboard");
    revalidatePath("/perfil");

    return {
      success: true,
      deleted: result.deleted,
      created: result.created,
      preserved: result.preserved,
    };
  });
