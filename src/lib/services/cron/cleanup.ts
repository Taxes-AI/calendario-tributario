import { prisma } from "@/lib/prisma";

export async function cleanupOldNotifications(): Promise<{ deleted: number }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notificacion.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  return { deleted: result.count };
}
