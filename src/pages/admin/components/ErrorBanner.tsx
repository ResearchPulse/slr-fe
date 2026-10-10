import React from "react";

interface ErrorBannerProps {
  message?: string | null;
  fallback: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, fallback }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
    {message || fallback}
  </div>
);

export default ErrorBanner;
