import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface SectionLoadingProps {
  type: "admin" | "client";
  title?: string;
  subtitle?: string;
}

const SectionLoading: React.FC<SectionLoadingProps> = ({
  type,
  title,
  subtitle,
}) => {
  const isAdmin = type === "admin";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-(--z-index-section-loading) flex flex-col items-center justify-center space-y-8 bg-bg-primary motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none"
    >
      <div className="relative">
        <LoadingSpinner size="lg" className="text-accent opacity-80" aria-hidden="true" />
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          {title ||
            (isAdmin ? "Initializing Admin Console" : "Loading Client Portal")}
        </h3>
        <p className="mx-auto max-w-[280px] text-sm text-text-secondary">
          {subtitle ||
            (isAdmin
              ? "Setting up your management workspace..."
              : "Preparing your systematic review environment...")}
        </p>
      </div>
    </div>
  );
};

export default SectionLoading;
