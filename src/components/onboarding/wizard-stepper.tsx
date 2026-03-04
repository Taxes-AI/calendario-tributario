"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  steps: { title: string }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
}: WizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => isCompleted && onStepClick(index)}
                disabled={!isCompleted}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  isCompleted &&
                    "cursor-pointer border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                  isCurrent &&
                    "border-primary bg-primary/10 text-primary",
                  !isCompleted &&
                    !isCurrent &&
                    "border-muted-foreground/30 text-muted-foreground/50 cursor-not-allowed"
                )}
                aria-label={`${step.title}${isCompleted ? " (completado)" : isCurrent ? " (actual)" : ""}`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Step label (hidden on mobile) */}
              <span
                className={cn(
                  "ml-2 hidden text-sm sm:inline",
                  isCurrent && "font-medium text-foreground",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground/50"
                )}
              >
                {step.title}
              </span>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 flex-1",
                    index < currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step counter text */}
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Paso {currentStep + 1} de {steps.length}
      </p>
    </div>
  );
}
