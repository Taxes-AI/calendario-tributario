"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { markAsPaid } from "@/lib/actions/obligations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface MarkPaidDialogProps {
  open: boolean;
  onClose: () => void;
  obligacionId: string;
  impuesto: string;
  periodo: string;
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

export function MarkPaidDialog({
  open,
  onClose,
  obligacionId,
  impuesto,
  periodo,
}: MarkPaidDialogProps) {
  // Default to today in YYYY-MM-DD format
  const [fechaPago, setFechaPago] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const { execute, isExecuting } = useAction(markAsPaid, {
    onSuccess: () => {
      toast.success("Obligacion marcada como pagada");
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.error.serverError ?? "Error al marcar como pagada"
      );
    },
  });

  const handleConfirm = () => {
    execute({
      obligacionId,
      fechaPago: new Date(fechaPago).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como pagada</DialogTitle>
          <DialogDescription>
            {formatTaxName(impuesto)} - Periodo {periodo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label
            htmlFor="fecha-pago"
            className="text-sm font-medium text-gray-700"
          >
            Fecha de pago
          </label>
          <input
            id="fecha-pago"
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExecuting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isExecuting}>
            {isExecuting ? "Guardando..." : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
