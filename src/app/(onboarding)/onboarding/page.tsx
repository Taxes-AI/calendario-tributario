import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  // Load existing empresa data (if user is resuming)
  const empresa = await prisma.empresa.findUnique({
    where: { userId: session.user.id },
  });

  const initialData = empresa
    ? {
        tipoEmpresa: empresa.tipoEmpresa ?? undefined,
        regimen: empresa.regimen ?? undefined,
        tamano: empresa.tamano ?? undefined,
        nit: empresa.nit ?? undefined,
        ciiu: empresa.ciiu ?? undefined,
        ciudad: empresa.ciudad ?? undefined,
        rangoIngresos: empresa.rangoIngresos ?? undefined,
      }
    : {};

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">
        Configura tu perfil tributario
      </h2>
      <p className="mb-8 text-muted-foreground">
        Completa la informacion de tu empresa para determinar tus obligaciones
        tributarias.
      </p>
      <OnboardingWizard
        initialData={initialData}
        initialStep={empresa?.onboardingStep ?? 0}
      />
    </div>
  );
}
