import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          // Base styles
          "min-h-11 w-full rounded-xl border bg-surface-white px-3.5 py-2.5",
          "text-sm text-text-primary placeholder:text-text-muted",
          "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
          "focus-visible:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:bg-bg-secondary disabled:text-text-disabled disabled:opacity-75",

          // Default state (no error) — blue border only on focus
          !error && "border-border focus-visible:border-primary focus-visible:ring-primary/20",

          // Error state
          error && "border-error focus-visible:border-error focus-visible:ring-error/20",

          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
