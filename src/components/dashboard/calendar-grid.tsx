"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDayCell } from "@/components/dashboard/calendar-day-cell";
import {
  getObligationsForDay,
  type SerializedObligation,
} from "@/lib/utils/obligation-helpers";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface CalendarGridProps {
  obligations: SerializedObligation[];
  todayIso: string; // Colombia "today" ISO string from server
  onMarkPaid?: (obligation: {
    id: string;
    impuesto: string;
    periodo: string;
  }) => void;
}

// ─────────────────────────────────────────────────────
// Day-of-week headers (Monday-start, Colombian/ISO standard)
// ─────────────────────────────────────────────────────

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function CalendarGrid({
  obligations,
  todayIso,
  onMarkPaid,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(todayIso), [todayIso]);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));

  // Generate all days to display in the calendar grid
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Check if current month has any obligations
  const monthHasObligations = useMemo(() => {
    return obligations.some((o) =>
      isSameMonth(new Date(o.fechaVencimiento), currentMonth)
    );
  }, [obligations, currentMonth]);

  // Navigation handlers
  const goToPreviousMonth = () =>
    setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(startOfMonth(today));

  // Format month label in Spanish (capitalize first letter)
  const monthLabel = useMemo(() => {
    const formatted = format(currentMonth, "MMMM yyyy", { locale: es });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentMonth]);

  return (
    <div className="rounded-lg border bg-white">
      {/* Header: navigation bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={goToPreviousMonth}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
            {monthLabel}
          </h2>
          <Button
            variant="outline"
            size="xs"
            onClick={goToToday}
            className="text-xs"
          >
            Hoy
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={goToNextMonth}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {WEEKDAY_HEADERS.map((header) => (
          <div
            key={header}
            className="py-2 text-center text-xs font-medium text-gray-500"
          >
            {header}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="grid grid-cols-7 bg-border gap-px">
        {days.map((day) => {
          const dayObligations = getObligationsForDay(obligations, day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);

          return (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              obligations={dayObligations}
              onMarkPaid={onMarkPaid}
            />
          );
        })}
      </div>

      {/* No obligations message for current month */}
      {!monthHasObligations && (
        <div className="border-t px-4 py-6 text-center">
          <p className="text-sm text-gray-400">
            No tienes obligaciones para este mes
          </p>
        </div>
      )}
    </div>
  );
}
