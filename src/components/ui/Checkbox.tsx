import React from "react";
import { cn } from "../../utils/cn";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export default function Checkbox({
  label,
  className,
  ...props
}: CheckboxProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <input
        type="checkbox"
        {...props}
        className="h-4 w-4 rounded-[3px] border-border text-accent focus:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {label ? <span className="text-sm text-text-primary">{label}</span> : null}
    </label>
  );
}
