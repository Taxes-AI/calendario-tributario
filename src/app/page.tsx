import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  ShieldCheck,
  Bell,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Calendario tributario",
    description:
      "Fechas de vencimiento personalizadas segun tu NIT y regimen fiscal.",
  },
  {
    icon: ShieldCheck,
    title: "Calculadora de sanciones",
    description:
      "Estima multas por extemporaneidad con base en el Estatuto Tributario.",
  },
  {
    icon: Bell,
    title: "Recordatorios automaticos",
    description:
      "Notificaciones por correo y en la app antes de cada vencimiento.",
  },
  {
    icon: BarChart3,
    title: "Panel de control",
    description:
      "Visualiza tus obligaciones, estados de pago y proximos vencimientos.",
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="text-xl font-bold tracking-tight">Contably</span>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesion</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tus obligaciones tributarias,{" "}
            <span className="text-primary">bajo control</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Contably te ayuda a gestionar impuestos, fechas de vencimiento y
            sanciones en un solo lugar. Disenado para contadores y empresas
            colombianas.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">Comenzar gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Todo lo que necesitas para cumplir a tiempo
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Contably. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
