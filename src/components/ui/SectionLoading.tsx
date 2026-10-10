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
    <div className="fixed inset-0 bg-bg-primary z-(--z-index-section-loading) flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <LoadingSpinner size="lg" className="text-accent opacity-80" />
      </div>
      <div className="text-center space-y-3">
        <h3 className="font-cormorant text-3xl font-normal text-text-primary tracking-tight">
          {title ||
            (isAdmin ? "Initializing Admin Console" : "Loading Client Portal")}
        </h3>
        <p className="text-text-secondary text-sm max-w-[280px] mx-auto animate-pulse">
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
