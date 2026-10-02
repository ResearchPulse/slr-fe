import React from "react";
import { cn } from "../../utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-surface-white border border-border rounded-2xl overflow-hidden p-4 sm:p-6",
        "shadow-[0_1px_2px_rgba(18,35,49,0.04)] transition-[border-color,box-shadow] duration-200",
        "hover:border-text-muted/60",
        className,
      )}
      {...props}
    >
      {title && (
        <div className="pb-4 mb-4 border-b border-border">
          <h3 className="text-base font-medium text-text-primary uppercase tracking-[0.1em]">
            {title}
          </h3>
        </div>
      )}
      <div className={cn(!title && "p-0")}>{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      "text-base font-medium leading-none tracking-[0.05em] uppercase text-text-primary",
      className,
    )}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("p-4 sm:p-6 pt-0 sm:pt-0", className)} {...props} />;

export default Card;
