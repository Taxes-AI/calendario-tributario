"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stepEmpresaSchema,
  type StepEmpresaData,
} from "@/lib/schemas/onboarding";
import { SelectableCard } from "./selectable-card";
import { Button } from "@/components/ui/button";
import { TIPO_EMPRESA_OPTIONS } from "@/lib/data/field-options";

interface StepEmpresaProps {
  defaultValues: Partial<StepEmpresaData>;
  onComplete: (data: StepEmpresaData) => void;
}

export function StepEmpresa({ defaultValues, onComplete }: StepEmpresaProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StepEmpresaData>({
    resolver: zodResolver(stepEmpresaSchema),
    defaultValues: {
      tipoEmpresa: defaultValues.tipoEmpresa,
    },
  });

  const selectedTipo = watch("tipoEmpresa");

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Selecciona como esta registrada tu empresa ante la DIAN.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {TIPO_EMPRESA_OPTIONS.map((option) => (
          <SelectableCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedTipo === option.value}
            onSelect={(val) =>
              setValue("tipoEmpresa", val as StepEmpresaData["tipoEmpresa"], {
                shouldValidate: false,
              })
            }
          />
        ))}
      </div>

      {errors.tipoEmpresa && (
        <p className="text-sm text-destructive">
          {errors.tipoEmpresa.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit">Siguiente</Button>
      </div>
    </form>
  );
}
