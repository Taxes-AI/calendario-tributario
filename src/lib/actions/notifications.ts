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
// markNotificationAsRead
// ─────────────────────────────────────────────────────

export const markNotificationAsRead = authedAction
  .schema(z.object({ notificationId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    await prisma.notificacion.updateMany({
      where: {
        id: parsedInput.notificationId,
        userId: ctx.userId,
      },
      data: { leida: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  });

// ─────────────────────────────────────────────────────
// markAllNotificationsAsRead
// ─────────────────────────────────────────────────────

export const markAllNotificationsAsRead = authedAction
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    await prisma.notificacion.updateMany({
      where: {
        userId: ctx.userId,
        leida: false,
      },
      data: { leida: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  });
