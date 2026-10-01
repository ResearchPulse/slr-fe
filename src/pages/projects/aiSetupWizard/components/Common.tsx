import type { Step } from "../types";

export function StepBadge({
  step,
  currentStep,
  label,
  complete,
}: {
  step: number;
  currentStep: Step;
  label: string;
  complete: boolean;
}) {
  const isActive = currentStep === step;

  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "h-9 w-9 rounded-full border text-sm font-semibold flex items-center justify-center transition-all",
          complete
            ? "bg-accent border-accent text-white"
            : isActive
              ? "bg-bg-secondary border-accent text-accent"
              : "bg-surface-white border-slate-300 text-text-secondary",
        ].join(" ")}
      >
        {complete ? "✓" : step}
      </div>
      <div>
        <p
          className={[
            "text-sm font-medium",
            isActive || complete ? "text-text-primary" : "text-text-secondary",
          ].join(" ")}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export function AISkeleton({ title }: { title: string }) {
  return (
    <div className="border-y border-border bg-surface-white py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-accent" />
        <p className="text-sm font-medium text-text-primary">{title}</p>
      </div>

      <div className="space-y-3">
        <div className="h-3 w-11/12 animate-pulse rounded-sm bg-bg-secondary" />
        <div className="h-3 w-10/12 animate-pulse rounded-sm bg-bg-secondary" />
        <div className="h-3 w-8/12 animate-pulse rounded-sm bg-bg-secondary" />
      </div>
    </div>
  );
}

export function FieldLabel({
  title,
  ai = false,
}: {
  title: string;
  ai?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <label className="text-sm font-semibold text-text-primary">{title}</label>
      {ai && (
        <span className="text-xs font-medium text-text-secondary">
          Suggested
        </span>
      )}
    </div>
  );
}
