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
        "bg-primary text-text-on-primary border border-transparent hover:bg-primary-hover focus:ring-primary/20",
      secondary:
        "bg-transparent border border-border text-text-primary hover:bg-bg-secondary focus:ring-border",
      danger:
        "bg-error text-white border border-transparent hover:bg-red-700 focus:ring-error/20",
      success:
        "bg-success text-white border border-transparent hover:bg-green-700 focus:ring-success/20",
      outline:
        "bg-transparent border border-text-primary text-text-primary hover:bg-text-primary hover:text-text-on-primary focus:ring-text-primary/20",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary focus:ring-border border border-transparent",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[11px]",
      md: "px-4 py-2.5 text-[12px]",
      lg: "px-6 py-3 text-[13px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          // Base Layout & Typography
          "rounded-[4px] uppercase tracking-[0.1em] font-medium flex items-center justify-center transition-colors duration-200 whitespace-nowrap min-h-[44px] md:min-h-0",
          "focus:outline-none focus:ring-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",

          variants[variant],
          sizes[size],

          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-currentColor"
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
