import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface SerializedNotification {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string; // ISO string
  threshold: number;
  obligacionTributariaId: string;
}

// ─────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notificacion.count({
    where: { userId, leida: false },
  });
}

export async function getNotifications(userId: string, limit = 30) {
  return prisma.notificacion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      tipo: true,
      mensaje: true,
      leida: true,
      createdAt: true,
      threshold: true,
      obligacionTributariaId: true,
    },
  });
}
