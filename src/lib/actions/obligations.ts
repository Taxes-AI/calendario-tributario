"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
// Schema
// ─────────────────────────────────────────────────────

const markPaidSchema = z.object({
  obligacionId: z.string().min(1),
  fechaPago: z.string().datetime(), // ISO string from date picker
});

// ─────────────────────────────────────────────────────
// markAsPaid action
// ─────────────────────────────────────────────────────

export const markAsPaid = authedAction
  .schema(markPaidSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 1. Validate ownership
    const obligacion = await prisma.obligacionTributaria.findFirst({
      where: {
        id: parsedInput.obligacionId,
        empresa: { userId: ctx.userId },
      },
    });

    if (!obligacion) {
      throw new Error("Obligacion no encontrada");
    }

    // 2. Check if already paid
    if (obligacion.estado === "PAGADO") {
      throw new Error("Esta obligacion ya esta marcada como pagada");
    }

    // 3. Update to PAGADO with payment date
    await prisma.obligacionTributaria.update({
      where: { id: obligacion.id },
      data: {
        estado: "PAGADO",
        fechaPago: new Date(parsedInput.fechaPago),
      },
    });

    // 3.5 Auto-dismiss related notifications
    await prisma.notificacion.updateMany({
      where: {
        obligacionTributariaId: obligacion.id,
        leida: false,
      },
      data: { leida: true },
    });

    // 4. Refresh dashboard data
    revalidatePath("/dashboard");

    return { success: true };
  });
