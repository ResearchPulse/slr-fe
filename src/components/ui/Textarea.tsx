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
          "w-full rounded-xl border bg-surface-white px-3.5 py-2.5",
          "text-text-primary placeholder:text-text-muted",
          "text-sm transition-[color,background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
          "focus:bg-surface-white focus-visible:outline-none focus-visible:ring-2",
          "min-h-[100px] resize-y",

          // Default state (no error)
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

Textarea.displayName = "Textarea";

export default Textarea;
