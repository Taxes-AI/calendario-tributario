import { prisma } from "@/lib/prisma";
import { daysUntilDeadline } from "@/lib/utils/dates";

export async function transitionStatuses(): Promise<{ toProximo: number; toVencido: number }> {
  // Find all non-PAGADO, non-final obligations
  const obligations = await prisma.obligacionTributaria.findMany({
    where: { estado: { in: ["PENDIENTE", "PROXIMO"] } },
  });

  let toProximo = 0;
  let toVencido = 0;

  for (const ob of obligations) {
    const days = daysUntilDeadline(ob.fechaVencimiento);
    let newEstado: string | null = null;

    // PROXIMO -> VENCIDO: day AFTER the deadline (days < 0, strictly negative)
    // On the due date itself (days === 0), status stays PROXIMO
    if (days < 0 && ob.estado === "PROXIMO") {
      newEstado = "VENCIDO";
      toVencido++;
    }
    // PENDIENTE -> PROXIMO: 7 days or fewer before deadline
    else if (days >= 0 && days <= 7 && ob.estado === "PENDIENTE") {
      newEstado = "PROXIMO";
      toProximo++;
    }
    // Edge case: PENDIENTE that went directly past deadline (cron missed or first run)
    else if (days < 0 && ob.estado === "PENDIENTE") {
      newEstado = "VENCIDO";
      toVencido++;
    }

    if (newEstado) {
      await prisma.obligacionTributaria.update({
        where: { id: ob.id },
        data: { estado: newEstado },
      });
    }
  }

  return { toProximo, toVencido };
}
