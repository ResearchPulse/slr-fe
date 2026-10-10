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
          "w-full px-3 py-2.5 rounded-xl bg-surface-white border",
          "text-text-primary placeholder:text-text-muted",
          "text-sm transition-colors duration-200",
          "focus:bg-surface-white focus:outline-none focus:ring-2",
          "min-h-[100px] resize-y",

          // Default state (no error)
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

Textarea.displayName = "Textarea";

export default Textarea;
