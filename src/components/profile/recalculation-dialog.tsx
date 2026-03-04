"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecalculationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  deletionCount: number;
  isExecuting: boolean;
}

export function RecalculationDialog({
  open,
  onConfirm,
  onCancel,
  deletionCount,
  isExecuting,
}: RecalculationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recalcular obligaciones</DialogTitle>
          <DialogDescription>
            Estos cambios recalcularan tus obligaciones.{" "}
            <strong>{deletionCount}</strong> obligaciones seran eliminadas, las
            pagadas y vencidas se conservan. Continuar?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isExecuting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isExecuting}>
            {isExecuting ? "Recalculando..." : "Recalcular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
