import React from "react";
import { cn } from "../../utils/cn";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: "w-4 h-4 border",
    md: "w-8 h-8 border-[2px]",
    lg: "w-12 h-12 border-[2px]",
  };

  return (
    <div
      className={cn("flex justify-center items-center", className)}
      {...props}
    >
      <div
        className={cn(
          "border-border border-t-accent rounded-full motion-safe:animate-spin motion-reduce:animate-none",
          sizeStyles[size],
        )}
      />
    </div>
  );
};

export default LoadingSpinner;
