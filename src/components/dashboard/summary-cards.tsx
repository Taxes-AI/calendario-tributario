"use client";

import { useMemo } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { isSameMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { nowColombia } from "@/lib/utils/dates";
import { formatDateColombia } from "@/lib/utils/dates";
import {
  computeDisplayStatus,
  type SerializedObligation,
} from "@/lib/utils/obligation-helpers";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface SummaryCardsProps {
  obligations: SerializedObligation[];
  onFilterChange?: (filter: { estado?: string } | null) => void;
}

// ─────────────────────────────────────────────────────
// Card data type
// ─────────────────────────────────────────────────────

interface CardData {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentClass: string;
  iconBgClass: string;
  filter: { estado?: string } | null;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function SummaryCards({ obligations, onFilterChange }: SummaryCardsProps) {
  const cards = useMemo(() => {
    const today = nowColombia();

    // 1. Este mes: count obligations with fechaVencimiento in current month
    const thisMonthCount = obligations.filter((o) =>
      isSameMonth(new Date(o.fechaVencimiento), today)
    ).length;

    // 2. Vencidas: count where computed status is VENCIDO
    const overdueCount = obligations.filter(
      (o) => computeDisplayStatus(o.estado, o.fechaVencimiento) === "VENCIDO"
    ).length;

    // 3. Proxima fecha: nearest upcoming obligation (PENDIENTE or PROXIMO, >= today)
    const upcoming = obligations
      .filter((o) => {
        const status = computeDisplayStatus(o.estado, o.fechaVencimiento);
        return status === "PENDIENTE" || status === "PROXIMO";
      })
      .filter((o) => new Date(o.fechaVencimiento) >= today)
      .sort(
        (a, b) =>
          new Date(a.fechaVencimiento).getTime() -
          new Date(b.fechaVencimiento).getTime()
      )[0];

    const nextDeadlineValue = upcoming
      ? formatDateColombia(new Date(upcoming.fechaVencimiento), "dd MMM")
      : "--";
    const nextDeadlineSubtitle = upcoming
      ? formatTaxNameShort(upcoming.impuesto)
      : "Sin proximas";

    // 4. Pagadas este mes: count where estado is PAGADO and fechaPago in current month
    const paidThisMonth = obligations.filter((o) => {
      if (o.estado !== "PAGADO" || !o.fechaPago) return false;
      return isSameMonth(new Date(o.fechaPago), today);
    }).length;

    return [
      {
        label: "Este mes",
        value: String(thisMonthCount),
        icon: <Calendar className="h-4 w-4" />,
        accentClass: "text-gray-900",
        iconBgClass: "bg-gray-100 text-gray-500",
        filter: null,
      },
      {
        label: "Vencidas",
        value: String(overdueCount),
        icon: <AlertTriangle className="h-4 w-4" />,
        accentClass: overdueCount > 0 ? "text-red-600" : "text-gray-900",
        iconBgClass:
          overdueCount > 0
            ? "bg-red-50 text-red-500"
            : "bg-gray-100 text-gray-500",
        filter: { estado: "VENCIDO" },
      },
      {
        label: "Proxima fecha",
        value: nextDeadlineValue,
        subtitle: nextDeadlineSubtitle,
        icon: <Clock className="h-4 w-4" />,
        accentClass: "text-gray-900",
        iconBgClass: "bg-amber-50 text-amber-500",
        filter: { estado: "PROXIMO" },
      },
      {
        label: "Pagadas este mes",
        value: String(paidThisMonth),
        icon: <CheckCircle className="h-4 w-4" />,
        accentClass: paidThisMonth > 0 ? "text-green-600" : "text-gray-900",
        iconBgClass:
          paidThisMonth > 0
            ? "bg-green-50 text-green-500"
            : "bg-gray-100 text-gray-500",
        filter: { estado: "PAGADO" },
      },
    ] satisfies CardData[];
  }, [obligations]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn(
            "cursor-pointer border bg-white transition-shadow hover:shadow-sm",
            onFilterChange && "hover:ring-1 hover:ring-gray-200"
          )}
          onClick={() => onFilterChange?.(card.filter)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  {card.label}
                </p>
                <p className={cn("text-2xl font-bold", card.accentClass)}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="truncate text-xs text-gray-400">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  card.iconBgClass
                )}
              >
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────

function formatTaxNameShort(impuesto: string): string {
  return impuesto
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
