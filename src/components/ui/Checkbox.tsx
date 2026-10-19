import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  wrapperClassName?: string;
  labelClassName?: string;
}

export default function Checkbox({
  label,
  className,
  wrapperClassName,
  labelClassName,
  ...props
}: CheckboxProps) {
  return (
    <label className={cn("group/checkbox inline-flex cursor-pointer items-center gap-2", wrapperClassName)}>
      <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
        <input
          type="checkbox"
          {...props}
          className={cn(
            "peer absolute inset-0 h-full w-full appearance-none rounded-[5px] border border-border bg-surface-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ease-out checked:border-primary checked:bg-primary enabled:group-hover/checkbox:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
            className,
          )}
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 motion-reduce:transition-none"
        />
      </span>
      {label ? <span className={`text-sm text-text-secondary ${labelClassName ?? ""}`}>{label}</span> : null}
    </label>
  );
}
