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
        className="flex flex-col items-center text-center p-4 sm:p-6"
        data-prisma-step
      >
        {/* Step number */}
        <span className="text-[11px] uppercase tracking-[0.25em] text-text-secondary mb-4 font-mono">
          {number}
        </span>

        {/* Icon box */}
        <div
          className={`
          w-14 h-14 flex items-center justify-center mb-4 border
          ${
            isActive
              ? "bg-accent border-accent text-bg-primary"
              : "bg-surface-white border-border text-text-secondary"
          }
        `}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Label */}
        <h4 className="text-[11px] font-medium text-text-primary uppercase tracking-[0.2em] mb-1">
          {label}
        </h4>
        {description && (
          <p className="text-[11px] text-text-secondary max-w-[100px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  },
);

PrismaStep.displayName = "PrismaStep";

export default PrismaStep;
