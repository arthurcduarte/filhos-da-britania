"use client";

const STEP_LABELS = [
  "", "", "Identidade", "Origem", "Ofício", "Fé", "Herança", "História", "",
];

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  // Steps 3-8 are the "real" selection steps
  const selectionSteps = totalSteps - 3;
  const selectionCurrent = currentStep - 2;
  const progress = Math.max(0, Math.min(1, (selectionCurrent - 1) / (selectionSteps - 1)));

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-ink/10 relative">
        <div
          className="absolute left-0 top-0 h-full bg-ink/40 transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="font-body italic text-xs text-ink/40 whitespace-nowrap">
        {STEP_LABELS[currentStep - 1] ?? ""}
      </span>
    </div>
  );
}
