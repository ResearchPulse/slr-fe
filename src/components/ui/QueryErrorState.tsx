import { AlertCircle } from "lucide-react";
import Button from "./Button";
import { cn } from "../../utils/cn";

interface QueryErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export default function QueryErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  onBack,
  backLabel = "Go back",
  className,
}: QueryErrorStateProps) {
  return (
    <section
      role="alert"
      className={cn(
        "w-full rounded-xl border border-error/25 bg-surface-white p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
          <AlertCircle size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 break-words text-sm leading-6 text-text-secondary">{message}</p>
        </div>
      </div>
      {(onRetry || onBack) && (
        <div className="mt-5 flex flex-wrap gap-2 pl-12">
          {onRetry ? (
            <Button type="button" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              {backLabel}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
