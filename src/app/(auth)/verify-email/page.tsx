import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verificar correo | Calendario Tributario",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">
            Error de verificacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            El enlace de verificacion ha expirado o no es valido. Por favor
            solicita un nuevo enlace de verificacion.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/signup">Volver a registrarse</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Correo verificado</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Tu correo ha sido verificado exitosamente. Ya puedes iniciar sesion en
          tu cuenta.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/login">Iniciar sesion</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
