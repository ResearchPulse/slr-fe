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
        className="flex flex-col items-center text-center p-6 transition-all duration-500 opacity-0"
        data-prisma-step
      >
        {/* Editorial number */}
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#5C5C5C] mb-4 font-mono">
          {number}
        </span>

        {/* Icon box */}
        <div className={`
          w-14 h-14 flex items-center justify-center mb-4 border transition-colors
          ${isActive
            ? "bg-[#5B0000] border-[#5B0000] text-[#F4F0E8]"
            : "bg-[#FDFCF9] border-[#D8D2C8] text-[#5C5C5C]"
          }
        `}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Label */}
        <h4 className="text-[11px] font-medium text-[#111111] uppercase tracking-[0.2em] mb-1">
          {label}
        </h4>
        {description && (
          <p className="text-[11px] text-[#5C5C5C] max-w-[100px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  }
);

PrismaStep.displayName = "PrismaStep";

export default PrismaStep;
