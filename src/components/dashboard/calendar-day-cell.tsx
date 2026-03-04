"use client";

import { Check, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ObligationStatusBadge } from "@/components/dashboard/obligation-status-badge";
import {
  computeDisplayStatus,
  STATUS_CONFIG,
  type SerializedObligation,
} from "@/lib/utils/obligation-helpers";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface CalendarDayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  obligations: SerializedObligation[];
  onMarkPaid?: (obligation: {
    id: string;
    impuesto: string;
    periodo: string;
  }) => void;
}

// ─────────────────────────────────────────────────────
// Helper: format tax name for display
// ─────────────────────────────────────────────────────

function formatTaxName(impuesto: string): string {
  return impuesto
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

const MAX_DOTS = 4;

export function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday,
  obligations,
  onMarkPaid,
}: CalendarDayCellProps) {
  const dayNumber = day.getDate();
  const hasObligations = obligations.length > 0;

  // Build dots data
  const dots = obligations.slice(0, MAX_DOTS).map((o) => {
    const displayStatus = computeDisplayStatus(o.estado, o.fechaVencimiento);
    return {
      id: o.id,
      color: STATUS_CONFIG[displayStatus].dotColor,
    };
  });
  const overflow = obligations.length - MAX_DOTS;

  const cellContent = (
    <div
      className={cn(
        "relative flex min-h-[48px] flex-col p-1 sm:min-h-[80px] sm:p-2",
        "bg-white transition-colors",
        !isCurrentMonth && "bg-gray-50/50",
        hasObligations && "cursor-pointer hover:bg-gray-50",
        isToday && "ring-2 ring-blue-500 ring-inset rounded-md"
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "text-xs font-medium sm:text-sm",
          !isCurrentMonth && "text-gray-300",
          isCurrentMonth && "text-gray-700",
          isToday && "font-bold text-blue-600"
        )}
      >
        {dayNumber}
      </span>

      {/* Dots */}
      {hasObligations && (
        <div className="mt-auto flex flex-wrap items-center gap-0.5 pt-1">
          {dots.map((dot) => (
            <span
              key={dot.id}
              className={cn("h-2 w-2 rounded-full", dot.color)}
            />
          ))}
          {overflow > 0 && (
            <span className="text-[10px] font-medium text-gray-400">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // If no obligations, just render the plain cell
  if (!hasObligations) {
    return cellContent;
  }

  // With obligations, wrap in a Popover
  return (
    <Popover>
      <PopoverTrigger asChild>{cellContent}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        collisionPadding={8}
        className="w-72 p-0"
      >
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium text-gray-700">
            {day.toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {obligations.map((obligation, index) => {
            const displayStatus = computeDisplayStatus(
              obligation.estado,
              obligation.fechaVencimiento
            );
            const isPaid = displayStatus === "PAGADO";

            return (
              <div key={obligation.id}>
                {index > 0 && <Separator />}
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatTaxName(obligation.impuesto)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Periodo: {obligation.periodo}
                      </p>
                    </div>
                    <ObligationStatusBadge status={displayStatus} />
                  </div>

                  {/* Quick action */}
                  {isPaid ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Pagado</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkPaid?.({
                          id: obligation.id,
                          impuesto: obligation.impuesto,
                          periodo: obligation.periodo,
                        });
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Marcar pagado
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
