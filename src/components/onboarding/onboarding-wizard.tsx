"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WizardStepper } from "./wizard-stepper";
import { StepEmpresa } from "./step-empresa";
import { StepRegimen } from "./step-regimen";
import { StepNit } from "./step-nit";
import { StepActividad } from "./step-actividad";
import {
  saveStepEmpresa,
  saveStepRegimen,
  saveStepNit,
  saveStepActividad,
  completeOnboarding,
} from "@/lib/actions/onboarding";
import type { StepEmpresaData } from "@/lib/schemas/onboarding";
import type { StepRegimenData } from "@/lib/schemas/onboarding";
import type { StepNitData } from "@/lib/schemas/onboarding";
import type { StepActividadData } from "@/lib/schemas/onboarding";

export interface OnboardingData {
  tipoEmpresa?: string;
  regimen?: string;
  tamano?: string;
  nit?: string;
  ciiu?: string;
  ciudad?: string;
  rangoIngresos?: string;
}

interface OnboardingWizardProps {
  initialData: Partial<OnboardingData>;
  initialStep: number;
}

const STEPS = [
  { title: "Empresa" },
  { title: "Regimen" },
  { title: "NIT" },
  { title: "Actividad" },
];

export function OnboardingWizard({
  initialData,
  initialStep,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(
    Math.min(initialStep, STEPS.length - 1),
  );
  const [wizardData, setWizardData] =
    useState<Partial<OnboardingData>>(initialData);
  const [isPending, startTransition] = useTransition();

  function handleStepClick(step: number) {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  }

  function handleStepEmpresaComplete(data: StepEmpresaData) {
    const updated = { ...wizardData, ...data };
    setWizardData(updated);

    startTransition(async () => {
      const result = await saveStepEmpresa(data);
      if (result?.serverError) {
        toast.error("Error al guardar. Intenta de nuevo.");
        return;
      }
      toast.success("Tipo de empresa guardado");
      setCurrentStep(1);
    });
  }

  function handleStepRegimenComplete(data: StepRegimenData) {
    const updated = { ...wizardData, ...data };
    setWizardData(updated);

    startTransition(async () => {
      const result = await saveStepRegimen(data);
      if (result?.serverError) {
        toast.error("Error al guardar. Intenta de nuevo.");
        return;
      }
      toast.success("Regimen y tamano guardados");
      setCurrentStep(2);
    });
  }

  function handleStepNitComplete(data: StepNitData) {
    const updated = { ...wizardData, ...data };
    setWizardData(updated);

    startTransition(async () => {
      const result = await saveStepNit(data);
      if (result?.serverError) {
        toast.error("Error al guardar. Intenta de nuevo.");
        return;
      }
      toast.success("NIT guardado");
      setCurrentStep(3);
    });
  }

  function handleStepActividadComplete(data: StepActividadData) {
    const updated = { ...wizardData, ...data };
    setWizardData(updated);

    startTransition(async () => {
      // Save the step data first
      const saveResult = await saveStepActividad(data);
      if (saveResult?.serverError) {
        toast.error("Error al guardar. Intenta de nuevo.");
        return;
      }

      // Then complete onboarding (triggers matching engine)
      const completeResult = await completeOnboarding();
      if (completeResult?.serverError) {
        toast.error("Error al completar el onboarding. Intenta de nuevo.");
        return;
      }

      const count =
        completeResult?.data?.obligacionesGeneradas ?? 0;
      toast.success(
        `Perfil completado. Se generaron ${count} obligaciones tributarias.`,
      );
      router.push("/dashboard");
    });
  }

  return (
    <div className="space-y-8">
      <WizardStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="min-h-[300px]">
        {currentStep === 0 && (
          <StepEmpresa
            defaultValues={{
              tipoEmpresa: wizardData.tipoEmpresa as
                | StepEmpresaData["tipoEmpresa"]
                | undefined,
            }}
            onComplete={handleStepEmpresaComplete}
          />
        )}

        {currentStep === 1 && (
          <StepRegimen
            defaultValues={{
              regimen: wizardData.regimen as
                | StepRegimenData["regimen"]
                | undefined,
              tamano: wizardData.tamano as
                | StepRegimenData["tamano"]
                | undefined,
            }}
            onComplete={handleStepRegimenComplete}
            onBack={() => setCurrentStep(0)}
          />
        )}

        {currentStep === 2 && (
          <StepNit
            defaultValues={{
              nit: wizardData.nit,
            }}
            onComplete={handleStepNitComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <StepActividad
            defaultValues={{
              ciiu: wizardData.ciiu,
              ciudad: wizardData.ciudad,
              rangoIngresos: wizardData.rangoIngresos as
                | StepActividadData["rangoIngresos"]
                | undefined,
            }}
            onComplete={handleStepActividadComplete}
            onBack={() => setCurrentStep(2)}
          />
        )}
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Guardando...</p>
          </div>
        </div>
      )}
    </div>
  );
}
