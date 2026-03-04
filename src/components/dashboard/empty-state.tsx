import { Calendar, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "month" | "no-obligations";
  className?: string;
}

export function EmptyState({ type, className }: EmptyStateProps) {
  if (type === "month") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
      >
        <Calendar className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-400">
          No tienes obligaciones para este mes
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className
      )}
    >
      <ClipboardList className="h-12 w-12 text-gray-300" />
      <h2 className="mt-4 text-lg font-semibold text-gray-700">
        Sin obligaciones tributarias
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        Completa tu perfil para ver tus obligaciones tributarias y fechas de
        vencimiento personalizadas.
      </p>
    </div>
  );
}
