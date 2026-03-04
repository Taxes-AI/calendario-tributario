import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnreadCount, getNotifications } from "@/lib/queries/notifications";
import { NavBar } from "./nav-bar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Onboarding gate: redirect to /onboarding if profile not complete
  const empresa = await prisma.empresa.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });

  if (!empresa?.onboardingComplete) {
    redirect("/onboarding");
  }

  // Fetch notification data for the nav bar
  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(session.user.id),
    getNotifications(session.user.id),
  ]);

  // Serialize dates to ISO strings for client component consumption
  const serializedNotifications = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={session.user.name}
        userEmail={session.user.email}
        unreadCount={unreadCount}
        notifications={serializedNotifications}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
