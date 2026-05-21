import React from "react";
import { cn } from "../../utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className, ...props }) => {
  return (
    <div
      className={cn(
        "bg-[#FDFCF9] border border-[#D8D2C8] rounded-[4px] overflow-hidden p-4 sm:p-6",
        "hover:border-[#A0998C] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {title && (
        <div className="pb-4 mb-4 border-b border-[#D8D2C8]">
          <h3 className="text-base font-medium text-[#111111] uppercase tracking-[0.1em]">{title}</h3>
        </div>
      )}
      <div className={cn(!title && "p-0")}>{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn("text-base font-medium leading-none tracking-[0.05em] uppercase text-[#111111]", className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("p-4 sm:p-6 pt-0 sm:pt-0", className)} {...props} />;

export default Card;
