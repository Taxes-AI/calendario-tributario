"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stepActividadSchema,
  type StepActividadData,
} from "@/lib/schemas/onboarding";
import { CIIU_CODES } from "@/lib/data/ciiu-codes";
import { UVT_2026 } from "@/lib/utils/constants";
import { formatCOP } from "@/lib/utils/currency";
import { SelectableCard } from "./selectable-card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CIUDAD_OPTIONS, INCOME_BRACKETS } from "@/lib/data/field-options";

interface StepActividadProps {
  defaultValues: Partial<StepActividadData>;
  onComplete: (data: StepActividadData) => void;
  onBack: () => void;
}

function formatBracketDescription(
  uvtMin: number,
  uvtMax: number,
): string {
  const copMin = formatCOP(uvtMin * UVT_2026);
  if (uvtMax === 0) {
    return `> ${copMin}`;
  }
  const copMax = formatCOP(uvtMax * UVT_2026);
  if (uvtMin === 0) {
    return `$0 - ${copMax}`;
  }
  return `${copMin} - ${copMax}`;
}

export function StepActividad({
  defaultValues,
  onComplete,
  onBack,
}: StepActividadProps) {
  const [ciiuOpen, setCiiuOpen] = useState(false);
  const [ciiuSearch, setCiiuSearch] = useState("");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StepActividadData>({
    resolver: zodResolver(stepActividadSchema),
    defaultValues: {
      ciiu: defaultValues.ciiu ?? "",
      ciudad: defaultValues.ciudad ?? "",
      rangoIngresos: defaultValues.rangoIngresos,
    },
  });

  const selectedCiiu = watch("ciiu");
  const selectedCiudad = watch("ciudad");
  const selectedRangoIngresos = watch("rangoIngresos");

  // Find the selected CIIU code for display
  const selectedCiiuCode = CIIU_CODES.find((c) => c.code === selectedCiiu);

  // Filter CIIU codes based on search
  const filteredCiiu = useMemo(() => {
    if (!ciiuSearch) return CIIU_CODES.slice(0, 50);
    const search = ciiuSearch.toLowerCase();
    return CIIU_CODES.filter(
      (c) =>
        c.code.includes(search) ||
        c.description.toLowerCase().includes(search),
    ).slice(0, 50);
  }, [ciiuSearch]);

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-8">
      {/* CIIU Search Combobox */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Actividad economica (CIIU)</h3>
          <p className="text-sm text-muted-foreground">
            Busca por codigo o descripcion de la actividad economica.
          </p>
        </div>

        <Popover open={ciiuOpen} onOpenChange={setCiiuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={ciiuOpen}
              className="w-full justify-between font-normal"
            >
              {selectedCiiuCode
                ? `${selectedCiiuCode.code} -- ${selectedCiiuCode.description}`
                : "Seleccionar actividad economica..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por codigo o descripcion..."
                value={ciiuSearch}
                onValueChange={setCiiuSearch}
              />
              <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                <CommandGroup>
                  {filteredCiiu.map((code) => (
                    <CommandItem
                      key={code.code}
                      value={code.code}
                      onSelect={() => {
                        setValue("ciiu", code.code, {
                          shouldValidate: false,
                        });
                        setCiiuOpen(false);
                        setCiiuSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCiiu === code.code
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="font-mono text-xs">{code.code}</span>
                      <span className="ml-2 truncate">
                        {code.description}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {errors.ciiu && (
          <p className="text-sm text-destructive">{errors.ciiu.message}</p>
        )}
      </div>

      {/* Ciudad Select */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Ciudad principal</h3>
          <p className="text-sm text-muted-foreground">
            La ciudad donde opera tu empresa determina impuestos locales como
            ICA.
          </p>
        </div>

        <Select
          value={selectedCiudad}
          onValueChange={(val) =>
            setValue("ciudad", val, { shouldValidate: false })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar ciudad..." />
          </SelectTrigger>
          <SelectContent>
            {CIUDAD_OPTIONS.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.ciudad && (
          <p className="text-sm text-destructive">{errors.ciudad.message}</p>
        )}
      </div>

      {/* Income Bracket */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Rango de ingresos brutos anuales</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona el rango de ingresos brutos anuales de tu empresa.
          </p>
        </div>

        <div className="grid gap-3">
          {INCOME_BRACKETS.map((bracket) => (
            <SelectableCard
              key={bracket.value}
              value={bracket.value}
              label={bracket.label}
              description={`~${formatBracketDescription(bracket.uvtMin, bracket.uvtMax)} COP`}
              selected={selectedRangoIngresos === bracket.value}
              onSelect={(val) =>
                setValue(
                  "rangoIngresos",
                  val as StepActividadData["rangoIngresos"],
                  { shouldValidate: false },
                )
              }
            />
          ))}
        </div>

        {errors.rangoIngresos && (
          <p className="text-sm text-destructive">
            {errors.rangoIngresos.message}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Atras
        </Button>
        <Button type="submit">Finalizar</Button>
      </div>
    </form>
  );
}
