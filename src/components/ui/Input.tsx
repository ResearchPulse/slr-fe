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
          "w-full px-3 py-2.5 rounded-[4px] bg-[#FDFCF9] border",
          "text-[#111111] placeholder:text-[#A0998C]",
          "text-sm transition-colors duration-200",
          "focus:bg-[#FDFCF9] focus:outline-none focus:ring-1",
          
          // Default state (no error)
          !error && "border-[#D8D2C8] focus:ring-[#5B0000] focus:border-[#5B0000]",

          // Error state
          error && "border-red-500 focus:ring-red-500/40 focus:border-red-500",

          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
