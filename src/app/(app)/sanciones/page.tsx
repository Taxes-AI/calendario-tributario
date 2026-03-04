import { headers } from "next/headers";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SancionesClient } from "@/components/sanciones/sanciones-client";

export const metadata: Metadata = {
  title: "Calculadora de Sanciones | Calendario Tributario",
};

export default async function SancionesPage({
  searchParams,
}: {
  searchParams: Promise<{ obligacion?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const preSelectedId = params.obligacion ?? null;

  // Fetch all obligations for the user's empresa
  const empresa = await prisma.empresa.findUnique({
    where: { userId: session!.user.id },
    include: {
      obligaciones: {
        select: {
          id: true,
          impuesto: true,
          periodo: true,
          fechaVencimiento: true,
          estado: true,
        },
        orderBy: { fechaVencimiento: "asc" },
      },
    },
  });

  // Serialize dates to ISO strings
  const obligations = (empresa?.obligaciones ?? []).map((o) => ({
    id: o.id,
    impuesto: o.impuesto,
    periodo: o.periodo,
    fechaVencimiento: o.fechaVencimiento.toISOString(),
    estado: o.estado,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Calculadora de Sanciones
      </h1>
      <SancionesClient
        obligations={obligations}
        preSelectedId={preSelectedId}
      />
    </div>
  );
}
