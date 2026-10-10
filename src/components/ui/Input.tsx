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
        className={cn(
          // Base styles
          "w-full px-4 py-3 rounded-xl bg-surface-white border",
          "text-text-primary placeholder:text-text-muted",
          "text-base transition-[color,background-color,border-color,box-shadow] duration-200",
          "focus:bg-surface-white focus:outline-none focus:ring-2",

          // Default state (no error) — blue border only on focus
          !error && "border-border focus:border-accent focus:ring-accent/20",

          // Error state
          error && "border-error focus:border-error focus:ring-error/20",

          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
