"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";

import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";
import { updateProfile } from "@/lib/actions/profile";
import {
  TIPO_EMPRESA_OPTIONS,
  REGIMEN_OPTIONS,
  TAMANO_OPTIONS,
  CIUDAD_OPTIONS,
  INCOME_BRACKETS,
} from "@/lib/data/field-options";
import { CIIU_CODES } from "@/lib/data/ciiu-codes";
import { UVT_2026 } from "@/lib/utils/constants";
import { formatCOP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { RecalculationDialog } from "./recalculation-dialog";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface ProfileFormProps {
  empresa: {
    tipoEmpresa: string | null;
    regimen: string | null;
    tamano: string | null;
    nit: string | null;
    digitoVerificacion: string | null;
    ciiu: string | null;
    ciudad: string | null;
    rangoIngresos: string | null;
  };
  stats: {
    total: number;
    pagadas: number;
    vencidas: number;
    pendientes: number;
    proximas: number;
  };
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

const TAX_FIELDS: (keyof ProfileFormData)[] = [
  "tipoEmpresa",
  "regimen",
  "tamano",
  "nit",
  "ciiu",
  "ciudad",
  "rangoIngresos",
];

function hasTaxFieldChanged(
  original: ProfileFormData,
  updated: ProfileFormData,
): boolean {
  return TAX_FIELDS.some((field) => original[field] !== updated[field]);
}

function formatBracketDescription(uvtMin: number, uvtMax: number): string {
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

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function ProfileForm({ empresa, stats }: ProfileFormProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [ciiuOpen, setCiiuOpen] = useState(false);
  const [ciiuSearch, setCiiuSearch] = useState("");

  // Original values for change detection
  const originalValues: ProfileFormData = {
    tipoEmpresa: (empresa.tipoEmpresa as ProfileFormData["tipoEmpresa"]) ?? "NATURAL",
    regimen: (empresa.regimen as ProfileFormData["regimen"]) ?? "ORDINARIO",
    tamano: (empresa.tamano as ProfileFormData["tamano"]) ?? "MICRO",
    nit: empresa.nit ?? "",
    ciiu: empresa.ciiu ?? "",
    ciudad: empresa.ciudad ?? "",
    rangoIngresos: (empresa.rangoIngresos as ProfileFormData["rangoIngresos"]) ?? "RANGO_1",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: originalValues,
  });

  const watchedCiiu = watch("ciiu");
  const selectedCiiuCode = CIIU_CODES.find((c) => c.code === watchedCiiu);

  const filteredCiiu = useMemo(() => {
    if (!ciiuSearch) return CIIU_CODES.slice(0, 50);
    const search = ciiuSearch.toLowerCase();
    return CIIU_CODES.filter(
      (c) =>
        c.code.includes(search) ||
        c.description.toLowerCase().includes(search),
    ).slice(0, 50);
  }, [ciiuSearch]);

  const { execute, isExecuting } = useAction(updateProfile, {
    onSuccess: (result) => {
      setShowDialog(false);
      toast.success(
        `Perfil actualizado. Obligaciones: ${result.data?.deleted} eliminadas, ${result.data?.created} creadas, ${result.data?.preserved} conservadas`,
      );
    },
    onError: (error) => {
      setShowDialog(false);
      toast.error(
        error.error.serverError ?? "Error al actualizar perfil",
      );
    },
  });

  // Pending form data waiting for dialog confirmation
  const [pendingData, setPendingData] = useState<ProfileFormData | null>(null);

  const onSubmit = (data: ProfileFormData) => {
    const taxChanged = hasTaxFieldChanged(originalValues, data);

    if (taxChanged) {
      // Show confirmation dialog with deletion preview
      setPendingData(data);
      setShowDialog(true);
    } else {
      // No tax field changes -- save directly
      execute(data);
    }
  };

  const handleDialogConfirm = () => {
    if (pendingData) {
      execute(pendingData);
    }
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setPendingData(null);
  };

  const deletionCount = stats.pendientes + stats.proximas;

  return (
    <>
      {/* Obligation stats summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{stats.total}</span>{" "}
            obligaciones activas
            {stats.pagadas > 0 && (
              <>, <span className="font-medium text-foreground">{stats.pagadas}</span> pagadas</>
            )}
            {stats.vencidas > 0 && (
              <>, <span className="font-medium text-foreground">{stats.vencidas}</span> vencidas</>
            )}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Datos de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de empresa</label>
              <Select
                value={watch("tipoEmpresa")}
                onValueChange={(val) =>
                  setValue("tipoEmpresa", val as ProfileFormData["tipoEmpresa"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_EMPRESA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipoEmpresa && (
                <p className="text-sm text-destructive">
                  {errors.tipoEmpresa.message}
                </p>
              )}
            </div>

            {/* NIT */}
            <div className="space-y-2">
              <label className="text-sm font-medium">NIT</label>
              <div className="flex items-center gap-2">
                <Input
                  {...register("nit")}
                  placeholder="Ej: 900123456"
                  className="flex-1"
                />
                {empresa.digitoVerificacion && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    - {empresa.digitoVerificacion}
                  </span>
                )}
              </div>
              {errors.nit && (
                <p className="text-sm text-destructive">
                  {errors.nit.message}
                </p>
              )}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Cambiar el NIT recalculara todas tus fechas de vencimiento
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Regimen Tributario */}
        <Card>
          <CardHeader>
            <CardTitle>Regimen Tributario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Regimen */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Regimen</label>
              <Select
                value={watch("regimen")}
                onValueChange={(val) =>
                  setValue("regimen", val as ProfileFormData["regimen"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar regimen..." />
                </SelectTrigger>
                <SelectContent>
                  {REGIMEN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.regimen && (
                <p className="text-sm text-destructive">
                  {errors.regimen.message}
                </p>
              )}
            </div>

            {/* Tamano */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamano de la empresa</label>
              <Select
                value={watch("tamano")}
                onValueChange={(val) =>
                  setValue("tamano", val as ProfileFormData["tamano"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tamano..." />
                </SelectTrigger>
                <SelectContent>
                  {TAMANO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tamano && (
                <p className="text-sm text-destructive">
                  {errors.tamano.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Actividad Economica */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Economica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CIIU Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Actividad economica (CIIU)
              </label>
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
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              setCiiuOpen(false);
                              setCiiuSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watchedCiiu === code.code
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="font-mono text-xs">
                              {code.code}
                            </span>
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
                <p className="text-sm text-destructive">
                  {errors.ciiu.message}
                </p>
              )}
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciudad principal</label>
              <Select
                value={watch("ciudad")}
                onValueChange={(val) =>
                  setValue("ciudad", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
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
                <p className="text-sm text-destructive">
                  {errors.ciudad.message}
                </p>
              )}
            </div>

            {/* Rango de ingresos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rango de ingresos brutos anuales
              </label>
              <Select
                value={watch("rangoIngresos")}
                onValueChange={(val) =>
                  setValue(
                    "rangoIngresos",
                    val as ProfileFormData["rangoIngresos"],
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rango..." />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_BRACKETS.map((bracket) => (
                    <SelectItem key={bracket.value} value={bracket.value}>
                      {bracket.label} (~
                      {formatBracketDescription(
                        bracket.uvtMin,
                        bracket.uvtMax,
                      )}{" "}
                      COP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rangoIngresos && (
                <p className="text-sm text-destructive">
                  {errors.rangoIngresos.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || isExecuting}>
            {isExecuting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {/* Recalculation confirmation dialog */}
      <RecalculationDialog
        open={showDialog}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
        deletionCount={deletionCount}
        isExecuting={isExecuting}
      />
    </>
  );
}
