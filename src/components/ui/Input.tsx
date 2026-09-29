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
          "w-full px-3 py-2.5 rounded-[4px] bg-surface-white border",
          "text-text-primary placeholder:text-text-muted",
          "text-sm transition-colors duration-200",
          "focus:bg-surface-white focus:outline-none focus:ring-1",

          // Default state (no error)
          !error && "border-border focus:ring-accent focus:border-accent",

          // Error state
          error && "border-red-500 focus:ring-red-500/40 focus:border-red-500",

          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
