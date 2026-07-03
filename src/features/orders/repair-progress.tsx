"use client";

import { Check } from "lucide-react";
import { getStages } from "@/shared/constants/service-stages";

interface RepairProgressProps {
  serviceType?: string | null;
  currentStage: number;
}

export function RepairProgress({ serviceType, currentStage }: RepairProgressProps) {
  const stages = getStages(serviceType);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isCompleted = i < currentStage;
          const isCurrent = i === currentStage;
          return (
            <div key={stage.key} className="flex items-center gap-1 flex-1 last:flex-none">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted-foreground/30 text-muted-foreground/50"
                }`}
              >
                {isCompleted ? <Check className="size-3" /> : i + 1}
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {stages[currentStage]?.label || `Этап ${currentStage + 1}`}
      </p>
    </div>
  );
}
