"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stepRegimenSchema,
  type StepRegimenData,
} from "@/lib/schemas/onboarding";
import { SelectableCard } from "./selectable-card";
import { Button } from "@/components/ui/button";
import { REGIMEN_OPTIONS, TAMANO_OPTIONS } from "@/lib/data/field-options";

interface StepRegimenProps {
  defaultValues: Partial<StepRegimenData>;
  onComplete: (data: StepRegimenData) => void;
  onBack: () => void;
}

export function StepRegimen({
  defaultValues,
  onComplete,
  onBack,
}: StepRegimenProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StepRegimenData>({
    resolver: zodResolver(stepRegimenSchema),
    defaultValues: {
      regimen: defaultValues.regimen,
      tamano: defaultValues.tamano,
    },
  });

  const selectedRegimen = watch("regimen");
  const selectedTamano = watch("tamano");

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-8">
      {/* Regimen section */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Regimen tributario</h3>
          <p className="text-sm text-muted-foreground">
            El regimen determina que impuestos aplican y como se calculan.
          </p>
        </div>

        <div className="grid gap-3">
          {REGIMEN_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={selectedRegimen === option.value}
              onSelect={(val) =>
                setValue("regimen", val as StepRegimenData["regimen"], {
                  shouldValidate: false,
                })
              }
            />
          ))}
        </div>

        {errors.regimen && (
          <p className="text-sm text-destructive">
            {errors.regimen.message}
          </p>
        )}
      </div>

      {/* Tamano section */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Tamano de la empresa</h3>
          <p className="text-sm text-muted-foreground">
            El tamano influye en plazos de presentacion y obligaciones
            adicionales.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TAMANO_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={selectedTamano === option.value}
              onSelect={(val) =>
                setValue("tamano", val as StepRegimenData["tamano"], {
                  shouldValidate: false,
                })
              }
            />
          ))}
        </div>

        {errors.tamano && (
          <p className="text-sm text-destructive">
            {errors.tamano.message}
          </p>
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
