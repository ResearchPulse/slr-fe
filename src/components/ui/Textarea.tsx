import React from "react";
import { cn } from "../../utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          "w-full px-4 py-3 rounded-[10px] bg-surface-white border",
          "text-text-primary placeholder:text-text-muted",
          "text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
          "focus:bg-surface-white focus:outline-none focus:ring-1",
          "min-h-[100px] resize-y",

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

Textarea.displayName = "Textarea";

export default Textarea;
