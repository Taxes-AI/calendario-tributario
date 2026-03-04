import { headers } from "next/headers";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { nowColombia } from "@/lib/utils/dates";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata: Metadata = {
  title: "Panel de control | Contably",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const { obligations } = await getDashboardData(session!.user.id);
  const todayIso = nowColombia().toISOString();

  if (obligations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <EmptyState type="no-obligations" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
      <DashboardClient obligations={obligations} todayIso={todayIso} />
    </div>
  );
}
