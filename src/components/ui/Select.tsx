import React from "react";
import { cn } from "../../utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            // Base styles
            "w-full px-3 py-2.5 rounded-[4px] bg-surface-white border appearance-none text-sm",
            "text-text-primary",
            "transition-colors duration-200",
            "focus:bg-surface-white focus:outline-none focus:ring-1",
            "cursor-pointer",

            // Default state (no error)
            !error &&
              "border-border focus:ring-accent focus:border-accent hover:border-text-muted",

            // Error state
            error &&
              "border-red-500 focus:ring-red-500/40 focus:border-red-500",

            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom Chevron */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
