"use client";

import { Badge } from "@/components/ui/badge";
import {
  STATUS_CONFIG,
  type ObligationStatus,
} from "@/lib/utils/obligation-helpers";

interface Props {
  status: ObligationStatus;
  className?: string;
}

export function ObligationStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`${config.badgeClass} ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}
