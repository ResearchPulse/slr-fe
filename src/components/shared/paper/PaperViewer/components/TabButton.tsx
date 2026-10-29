import React from "react";
import { cn } from "../../../../../utils/cn";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  className?: string;
  variant?: "pill" | "underline";
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  count,
  className,
  variant = "pill",
}) => {
  const variantClasses = variant === "underline"
    ? "-mb-px min-h-11 flex-none justify-start rounded-none border-b-2 px-1 py-0 text-sm font-semibold normal-case tracking-normal"
    : "min-h-11 flex-1 justify-center rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest";

  const stateClasses = variant === "underline"
    ? active
      ? "border-primary text-primary"
      : "border-transparent text-text-secondary hover:text-text-primary"
    : active
      ? "bg-primary text-white shadow-none"
      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
        variantClasses,
        className,
        stateClasses,
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            variant === "underline"
              ? "bg-bg-secondary text-text-secondary"
              : active
                ? "bg-surface-white/20 text-white"
                : "bg-bg-secondary text-text-secondary",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
