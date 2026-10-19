import React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      disabled,
      isLoading,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        "bg-primary text-text-on-primary border border-transparent hover:bg-primary-hover hover:shadow-[0_4px_8px_rgba(0,113,188,0.16)] focus-visible:ring-primary/25",
      secondary:
        "bg-surface-white border border-border text-text-primary hover:border-text-secondary hover:bg-bg-secondary focus-visible:ring-border",
      danger:
        "bg-error text-white border border-transparent hover:bg-error/90 focus-visible:ring-error/20",
      success:
        "bg-success text-white border border-transparent hover:bg-success/90 focus-visible:ring-success/20",
      outline:
        "bg-transparent border border-border text-text-primary hover:border-text-secondary hover:bg-bg-secondary focus-visible:ring-border",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary focus-visible:ring-border border border-transparent",
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-xs min-h-9",
      md: "px-4 py-2.5 text-sm min-h-11",
      lg: "px-6 py-3.5 text-sm min-h-[52px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          // Base Layout & Typography
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap",
          // Motion — explicit properties only, never `all`
          "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out motion-reduce:transform-none motion-reduce:transition-none",
          "hover:-translate-y-px active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",

          variants[variant],
          sizes[size],

          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 text-current motion-safe:animate-spin motion-reduce:animate-none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
