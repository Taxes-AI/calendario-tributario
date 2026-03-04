import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/utils/constants";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  // If user already completed onboarding, redirect to dashboard
  const empresa = await prisma.empresa.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });
  if (empresa?.onboardingComplete) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-4">
        <h1 className="text-lg font-semibold">{APP_NAME}</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
