"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ObligationStatusBadge } from "@/components/dashboard/obligation-status-badge";
import { PenaltyCalculator } from "@/components/sanciones/penalty-calculator";
import {
  computeDisplayStatus,
  type ObligationStatus,
} from "@/lib/utils/obligation-helpers";
import { formatDateColombia } from "@/lib/utils/dates";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface ObligationForSanciones {
  id: string;
  impuesto: string;
  periodo: string;
  fechaVencimiento: string;
  estado: string;
}

interface SancionesClientProps {
  obligations: ObligationForSanciones[];
  preSelectedId: string | null;
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

export function SancionesClient({
  obligations,
  preSelectedId,
}: SancionesClientProps) {
  // Filter to only PROXIMO and VENCIDO obligations
  const eligibleObligations = useMemo(() => {
    return obligations.filter((o) => {
      const status = computeDisplayStatus(o.estado, o.fechaVencimiento);
      return status === "PROXIMO" || status === "VENCIDO";
    });
  }, [obligations]);

  // Initialize selected obligation
  const initialId = useMemo(() => {
    if (preSelectedId) {
      const found = eligibleObligations.find((o) => o.id === preSelectedId);
      if (found) return found.id;
    }
    return eligibleObligations.length > 0 ? eligibleObligations[0].id : null;
  }, [preSelectedId, eligibleObligations]);

  const [selectedId, setSelectedId] = useState<string | null>(initialId);

  const selectedObligation = useMemo(() => {
    return eligibleObligations.find((o) => o.id === selectedId) ?? null;
  }, [selectedId, eligibleObligations]);

  const selectedDisplayStatus = useMemo(() => {
    if (!selectedObligation) return null;
    return computeDisplayStatus(
      selectedObligation.estado,
      selectedObligation.fechaVencimiento
    ) as ObligationStatus;
  }, [selectedObligation]);

  // Empty state: no PROXIMO or VENCIDO obligations
  if (eligibleObligations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sin obligaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No tienes obligaciones proximas o vencidas. Tu calendario
              tributario esta al dia.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Volver al panel de control</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Obligation selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Selecciona una obligacion</label>
        <Select
          value={selectedId ?? undefined}
          onValueChange={(v) => setSelectedId(v)}
        >
          <SelectTrigger className="w-full max-w-lg">
            <SelectValue placeholder="Selecciona una obligacion" />
          </SelectTrigger>
          <SelectContent>
            {eligibleObligations.map((o) => {
              const status = computeDisplayStatus(
                o.estado,
                o.fechaVencimiento
              ) as ObligationStatus;
              return (
                <SelectItem key={o.id} value={o.id}>
                  <span className="flex items-center gap-2">
                    {formatTaxName(o.impuesto)} - {o.periodo} (
                    {formatDateColombia(
                      new Date(o.fechaVencimiento),
                      "dd MMM yyyy"
                    )}
                    )
                    <ObligationStatusBadge status={status} />
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Penalty calculator */}
      {selectedObligation && selectedDisplayStatus && (
        <PenaltyCalculator
          obligation={selectedObligation}
          displayStatus={selectedDisplayStatus}
        />
      )}

      {/* Legal disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          Aviso legal
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          Este calculo es una estimacion basada en el Art. 641 del Estatuto
          Tributario. Las tasas de interes moratorio son aproximadas. Consulte
          con un contador publico para valores oficiales.
        </AlertDescription>
      </Alert>
    </div>
  );
}
