"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface SelectableCardProps {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function SelectableCard({
  value,
  label,
  description,
  selected,
  onSelect,
}: SelectableCardProps) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onSelect(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(value);
        }
      }}
      className={cn(
        "cursor-pointer px-4 py-4 transition-all hover:shadow-md",
        selected
          ? "ring-2 ring-primary border-primary bg-primary/5"
          : "hover:border-muted-foreground/40"
      )}
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
