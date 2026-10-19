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
  onSecondaryAction?: () => void;
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
  onSecondaryAction,
  helperText,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="mb-5 flex items-center justify-center sm:mb-6">{icon}</div>
      <h3 className="mb-3 text-center text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
        {title}
      </h3>
      <p className="mb-6 max-w-md text-center text-[13px] leading-relaxed text-text-secondary sm:mb-8">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && (
          <Button onClick={onAction} isLoading={isLoading}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <Button
            variant="secondary"
            onClick={onSecondaryAction}
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
