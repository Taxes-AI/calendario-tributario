import { prisma } from "@/lib/prisma";
import type { SerializedObligation } from "@/lib/utils/obligation-helpers";

// ─────────────────────────────────────────────────────
// Dashboard data fetching (Server Component query)
// ─────────────────────────────────────────────────────

interface DashboardData {
  obligations: SerializedObligation[];
  empresaId: string | null;
}

/**
 * Fetches all obligations for a user's empresa, serialized for client components.
 * Called from the dashboard Server Component -- NOT a server action.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const empresa = await prisma.empresa.findUnique({
    where: { userId },
    include: {
      obligaciones: {
        orderBy: { fechaVencimiento: "asc" },
      },
    },
  });

  if (!empresa || empresa.obligaciones.length === 0) {
    return { obligations: [], empresaId: empresa?.id ?? null };
  }

  const obligations: SerializedObligation[] = empresa.obligaciones.map((o) => ({
    id: o.id,
    impuesto: o.impuesto,
    periodo: o.periodo,
    fechaVencimiento: o.fechaVencimiento.toISOString(),
    estado: o.estado,
    fechaPago: o.fechaPago ? o.fechaPago.toISOString() : null,
  }));

  return { obligations, empresaId: empresa.id };
}
