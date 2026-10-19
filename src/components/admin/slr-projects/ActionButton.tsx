import React from "react";
import type { IconType } from "react-icons";
import { cn } from "../../../utils/cn";
import Tooltip from "../../ui/Tooltip";

export interface ActionButtonProps {
  icon: IconType;
  label: string;
  variant?: "normal" | "destructive";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  variant = "normal",
  onClick,
  className,
  disabled = false,
}) => {
  return (
    <Tooltip content={label} position="bottom">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
          variant === "destructive"
            ? "text-error hover:bg-error/5"
            : "text-text-secondary hover:text-accent hover:bg-bg-secondary",
          disabled &&
            "opacity-50 cursor-not-allowed pointer-events-none transform-none",
          className,
        )}
        aria-label={label}
      >
        <Icon size={18} />
      </button>
    </Tooltip>
  );
};

export default ActionButton;
