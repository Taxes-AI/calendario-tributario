import { headers } from "next/headers";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Perfil de empresa | Contably",
};

export default async function PerfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const empresa = await prisma.empresa.findUnique({
    where: { userId: session!.user.id },
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
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Perfil de empresa
        </h1>
        <p className="text-muted-foreground">
          No se encontro la empresa. Completa el proceso de registro.
        </p>
      </div>
    );
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Perfil de empresa</h1>
      <ProfileForm empresa={empresa} stats={stats} />
    </div>
  );
}
