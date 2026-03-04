"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  calculatePenaltyArt641,
  SANCION_MINIMA_2026,
  TASA_EXTEMPORANEIDAD_641,
} from "@/lib/utils/sanctions";
import { UVT_2026 } from "@/lib/utils/constants";
import { daysUntilDeadline, formatDateColombia } from "@/lib/utils/dates";
import { formatCOP } from "@/lib/utils/currency";
import type { ObligationStatus } from "@/lib/utils/obligation-helpers";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface PenaltyCalculatorProps {
  obligation: {
    id: string;
    impuesto: string;
    periodo: string;
    fechaVencimiento: string;
    estado: string;
  };
  displayStatus: ObligationStatus;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function PenaltyCalculator({
  obligation,
  displayStatus,
}: PenaltyCalculatorProps) {
  const [impuestoACargo, setImpuestoACargo] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");

  // Compute days of late filing
  const diasExtemporaneidad = useMemo(() => {
    const daysLeft = daysUntilDeadline(new Date(obligation.fechaVencimiento));
    if (displayStatus === "VENCIDO") {
      return Math.abs(daysLeft);
    }
    // For PROXIMO and PENDIENTE: hypothetical calculation (minimum 1 day)
    return 1;
  }, [obligation.fechaVencimiento, displayStatus]);

  // Calculate penalty breakdown reactively
  const breakdown = useMemo(() => {
    return calculatePenaltyArt641(impuestoACargo, diasExtemporaneidad);
  }, [impuestoACargo, diasExtemporaneidad]);

  const fechaFormatted = formatDateColombia(
    new Date(obligation.fechaVencimiento),
    "dd MMM yyyy"
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(raw);
    setImpuestoACargo(raw ? parseInt(raw, 10) : 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose de sancion</CardTitle>
        <CardDescription>
          {displayStatus === "VENCIDO" ? (
            <>
              Esta obligacion vencio hace{" "}
              <span className="font-semibold text-red-600">
                {diasExtemporaneidad} dias
              </span>{" "}
              ({fechaFormatted}). Sancion estimada:
            </>
          ) : displayStatus === "PROXIMO" ? (
            <>
              Esta obligacion vence el{" "}
              <span className="font-semibold text-amber-600">
                {fechaFormatted}
              </span>
              . Si no se presenta a tiempo, la sancion minima seria:
            </>
          ) : (
            <>
              Calculo hipotetico para esta obligacion (vence el {fechaFormatted}
              ).
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-0">
        {/* Step-by-step breakdown */}
        <div className="space-y-0 divide-y">
          {/* Step 1: Base - Impuesto a cargo */}
          <div className="flex items-start justify-between gap-4 py-4">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="impuesto-a-cargo" className="text-sm font-semibold">
                1. Base: Impuesto a cargo
              </Label>
              <p className="text-xs text-muted-foreground">
                Ingresa el impuesto a cargo (valor del impuesto a pagar)
              </p>
              <Input
                id="impuesto-a-cargo"
                type="text"
                inputMode="numeric"
                placeholder="$0"
                value={inputValue ? formatCOP(parseInt(inputValue, 10)) : ""}
                onChange={handleInputChange}
                className="max-w-[200px]"
              />
            </div>
            <div className="text-right font-mono text-sm pt-1">
              {formatCOP(impuestoACargo)}
            </div>
          </div>

          {/* Step 2: Tasa de extemporaneidad */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">
                2. Tasa de extemporaneidad
              </p>
              <p className="text-xs text-muted-foreground">
                5% por mes o fraccion de mes (Art. 641 ET)
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {(TASA_EXTEMPORANEIDAD_641 * 100).toFixed(0)}%
            </div>
          </div>

          {/* Step 3: Meses de extemporaneidad */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">
                3. Meses de extemporaneidad
              </p>
              <p className="text-xs text-muted-foreground">
                Math.ceil({diasExtemporaneidad} dias / 30)
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {breakdown.mesesExtemporaneidad} mes
              {breakdown.mesesExtemporaneidad > 1 ? "es" : ""}
            </div>
          </div>

          {/* Step 4: Subtotal */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">4. Subtotal</p>
              <p className="text-xs text-muted-foreground">
                {formatCOP(impuestoACargo)} x 5% x{" "}
                {breakdown.mesesExtemporaneidad} ={" "}
                {formatCOP(breakdown.subtotal)}
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {formatCOP(breakdown.subtotal)}
            </div>
          </div>

          {/* Step 5: Tope (100%) */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">5. Tope (100%)</p>
              <p className="text-xs text-muted-foreground">
                Maximo: {formatCOP(breakdown.tope)}
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {formatCOP(breakdown.tope)}
            </div>
          </div>

          {/* Step 6: Minimo (10 UVT) */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">6. Minimo (10 UVT)</p>
              <p className="text-xs text-muted-foreground">
                Piso: {formatCOP(SANCION_MINIMA_2026)} (UVT 2026 = $
                {UVT_2026.toLocaleString("es-CO")})
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {formatCOP(SANCION_MINIMA_2026)}
            </div>
          </div>

          <Separator />

          {/* Step 7: Sancion por extemporaneidad */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-bold">
                7. Sancion por extemporaneidad
              </p>
            </div>
            <div className="text-right font-mono text-sm font-bold">
              {formatCOP(breakdown.sancionBase)}
            </div>
          </div>

          {/* Step 8: Interes moratorio */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold">
                8. Interes moratorio (aprox.)
              </p>
              <p className="text-xs text-muted-foreground">
                Tasa aprox. ~27% E.A. -- tasa real varia mensualmente
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              {formatCOP(breakdown.interesMoratorio)}
            </div>
          </div>

          <Separator />

          {/* Step 9: Total estimado */}
          <div className="flex items-center justify-between py-5">
            <div>
              <p className="text-base font-bold">9. Total estimado</p>
            </div>
            <div className="text-right font-mono text-lg font-bold">
              {formatCOP(breakdown.totalEstimado)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
