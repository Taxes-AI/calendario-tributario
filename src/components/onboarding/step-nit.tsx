"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepNitSchema, type StepNitData } from "@/lib/schemas/onboarding";
import { validateNit } from "@/lib/services/nit-validator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface StepNitProps {
  defaultValues: Partial<StepNitData>;
  onComplete: (data: StepNitData) => void;
  onBack: () => void;
}

export function StepNit({ defaultValues, onComplete, onBack }: StepNitProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StepNitData>({
    resolver: zodResolver(stepNitSchema),
    defaultValues: {
      nit: defaultValues.nit ?? "",
    },
  });

  const nitValue = watch("nit");
  const nitResult = nitValue ? validateNit(nitValue) : null;
  const isNitValid = nitResult?.valid ?? false;

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h3 className="font-medium">Numero de Identificacion Tributaria (NIT)</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa el NIT de tu empresa sin el digito de verificacion. Lo
          calcularemos automaticamente.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            {...register("nit")}
            placeholder="Ej: 860069804"
            inputMode="numeric"
            autoComplete="off"
            className="pr-10"
          />
          {nitValue && nitValue.length >= 6 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isNitValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
          )}
        </div>

        {errors.nit && (
          <p className="text-sm text-destructive">{errors.nit.message}</p>
        )}

        {/* Real-time DV preview */}
        {isNitValid && nitResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-medium">
                NIT: {nitResult.baseNumber} - DV: {nitResult.verificationDigit}
              </p>
              <p className="mt-1 text-sm">
                Tu ultimo digito es {nitResult.lastOneDigit}. Tus fechas de
                vencimiento se calcularan con base en este digito.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Atras
        </Button>
        <Button type="submit">Siguiente</Button>
      </div>
    </form>
  );
}
