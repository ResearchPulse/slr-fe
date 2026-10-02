// Reusable Empty State component for the Identification Phase Workspace

import Button from "./Button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  isLoading?: boolean;
  secondaryLabel?: string;
  helperText?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  isLoading,
  secondaryLabel,
  helperText,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 flex items-center justify-center">{icon}</div>
      <h3 className="font-cormorant text-2xl font-normal text-text-primary mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-text-secondary text-[13px] tracking-wide text-center max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-3">
        {actionLabel && (
          <Button onClick={onAction} isLoading={isLoading}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && (
          <Button
            variant="secondary"
            onClick={() => console.log("Secondary action")}
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
      {helperText && (
        <p className="text-[11px] uppercase tracking-[0.1em] text-text-secondary mt-6">
          {helperText}
        </p>
      )}
    </div>
  );
}
