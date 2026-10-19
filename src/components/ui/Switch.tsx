import React from "react";
import { cn } from "../../utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}) => {
  return (
    <label
      className={cn(
        "inline-flex items-center cursor-pointer select-none group",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        {/* Track */}
        <div
          className={cn(
            "h-6 w-11 rounded-full transition-colors duration-150 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary/40 motion-reduce:transition-none",
            checked ? "bg-primary" : "bg-border group-hover:bg-text-muted",
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out motion-reduce:transition-none",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm text-text-secondary">{label}</span>
      )}
    </label>
  );
};

export default Switch;
