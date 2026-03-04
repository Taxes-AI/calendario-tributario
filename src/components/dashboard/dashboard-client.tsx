"use client";

import { useState } from "react";
import { SummaryCards } from "./summary-cards";
import { CalendarGrid } from "./calendar-grid";
import { ObligationsTable } from "./obligations-table";
import { MarkPaidDialog } from "./mark-paid-dialog";
import type { SerializedObligation } from "@/lib/utils/obligation-helpers";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface DashboardClientProps {
  obligations: SerializedObligation[];
  todayIso: string;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function DashboardClient({
  obligations,
  todayIso,
}: DashboardClientProps) {
  // Shared filter state: summary card clicks drive table filtering
  const [activeFilter, setActiveFilter] = useState<{
    estado?: string;
  } | null>(null);

  // Shared mark-paid target: calendar popover and table both open the same dialog
  const [markPaidTarget, setMarkPaidTarget] = useState<{
    id: string;
    impuesto: string;
    periodo: string;
  } | null>(null);

  const handleMarkPaid = (obligation: {
    id: string;
    impuesto: string;
    periodo: string;
  }) => {
    setMarkPaidTarget(obligation);
  };

  return (
    <div className="space-y-6">
      <SummaryCards
        obligations={obligations}
        onFilterChange={setActiveFilter}
      />
      <CalendarGrid
        obligations={obligations}
        todayIso={todayIso}
        onMarkPaid={handleMarkPaid}
      />
      <ObligationsTable
        obligations={obligations}
        activeFilter={activeFilter}
      />
      <MarkPaidDialog
        open={markPaidTarget !== null}
        onClose={() => setMarkPaidTarget(null)}
        obligacionId={markPaidTarget?.id ?? ""}
        impuesto={markPaidTarget?.impuesto ?? ""}
        periodo={markPaidTarget?.periodo ?? ""}
      />
    </div>
  );
}
