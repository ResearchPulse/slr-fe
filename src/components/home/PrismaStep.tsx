import { forwardRef } from "react";
import type { IconType } from "react-icons";

interface PrismaStepProps {
  icon: IconType;
  label: string;
  number: string;
  description?: string;
  isActive?: boolean;
}

const PrismaStep = forwardRef<HTMLDivElement, PrismaStepProps>(
  ({ icon: Icon, label, number, description, isActive = false }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          h-full flex flex-col items-start text-left p-6 sm:p-7
          bg-surface-white border rounded-[14px]
          shadow-[0_1px_2px_rgba(18,35,49,0.04)]
          transition-[border-color,box-shadow] duration-200
          ${isActive ? "border-primary" : "border-border hover:border-text-muted/60"}
        `}
        data-prisma-step
      >
        {/* Step number — blue accent */}
        <span className="text-[13px] font-semibold text-primary tracking-[0.2em] mb-5">
          {number}
        </span>

        {/* Icon — soft blue surface */}
        <div
          className={`
          w-11 h-11 rounded-[10px] flex items-center justify-center mb-5
          ${
            isActive
              ? "bg-primary text-text-on-primary"
              : "bg-soft-blue text-primary"
          }
        `}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Label */}
        <h4 className="text-[15px] font-semibold text-text-primary uppercase tracking-[0.12em] mb-2">
          {label}
        </h4>
        {description && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  },
);

PrismaStep.displayName = "PrismaStep";

export default PrismaStep;
