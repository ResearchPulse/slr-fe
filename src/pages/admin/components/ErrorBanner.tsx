import React from "react";
import Button from "../../../components/ui/Button";

interface ErrorBannerProps {
  message?: string | null;
  fallback: string;
  onRetry?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, fallback, onRetry }) => (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/25 bg-error/5 px-4 py-3 text-[13px] font-medium text-error">
    <span>{message || fallback}</span>
    {onRetry ? (
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);

export default ErrorBanner;
