import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/utils/constants";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <main className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Gestiona tus obligaciones tributarias DIAN. Nunca mas pierdas una fecha
          limite.
        </p>
        <p className="mt-2 text-base text-gray-500">
          Conoce tus impuestos, fechas de vencimiento y posibles sanciones en un
          solo lugar.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Crear cuenta</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Iniciar sesion</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
