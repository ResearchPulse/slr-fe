import React from "react";
import { cn } from "../../../../../utils/cn";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  count,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
        active
          ? "bg-primary text-white shadow-none"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-xl text-[9px] font-black",
            active
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
