import { prisma } from "@/lib/prisma";
import { daysUntilDeadline, formatDateColombia } from "@/lib/utils/dates";

const THRESHOLDS = [15, 7, 3, 1] as const;

interface NotificationResult {
  created: number;
  skipped: number;
  overdueCreated: number;
}

async function createNotificationIfNew(
  obligacionTributariaId: string,
  userId: string,
  threshold: number,
  mensaje: string,
  tipo: "RECORDATORIO" | "VENCIDA"
): Promise<boolean> {
  try {
    await prisma.notificacion.create({
      data: {
        userId,
        obligacionTributariaId,
        threshold,
        tipo,
        mensaje,
        leida: false,
      },
    });
    return true;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return false; // Already exists -- idempotent skip
    }
    throw error;
  }
}

export async function createNotifications(): Promise<NotificationResult> {
  let created = 0;
  let skipped = 0;
  let overdueCreated = 0;

  // Get all active obligations (non-PAGADO) with their empresa's userId
  const obligations = await prisma.obligacionTributaria.findMany({
    where: { estado: { in: ["PENDIENTE", "PROXIMO", "VENCIDO"] } },
    include: { empresa: { select: { userId: true } } },
  });

  for (const ob of obligations) {
    const days = daysUntilDeadline(ob.fechaVencimiento);
    const fechaStr = formatDateColombia(ob.fechaVencimiento, "d 'de' MMMM");

    // Check each threshold for pre-deadline reminders
    for (const threshold of THRESHOLDS) {
      // Only create notification if we're at or past this threshold but not yet past the deadline
      if (days >= 0 && days <= threshold) {
        const mensaje = `${ob.impuesto} — vence en ${days} dia${days !== 1 ? "s" : ""} (${fechaStr})`;
        const wasCreated = await createNotificationIfNew(
          ob.id,
          ob.empresa.userId,
          threshold,
          mensaje,
          "RECORDATORIO"
        );
        if (wasCreated) created++;
        else skipped++;
      }
    }

    // Create overdue notification when status is VENCIDO (threshold = 0)
    if (ob.estado === "VENCIDO" && days < 0) {
      const mensaje = `${ob.impuesto} esta vencida desde el ${fechaStr}`;
      const wasCreated = await createNotificationIfNew(
        ob.id,
        ob.empresa.userId,
        0, // 0 = overdue threshold
        mensaje,
        "VENCIDA"
      );
      if (wasCreated) overdueCreated++;
      else skipped++;
    }
  }

  return { created, skipped, overdueCreated };
}
