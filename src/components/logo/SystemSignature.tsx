import { forwardRef } from "react";

interface SystemSignatureProps {
  className?: string;
  primaryClassName?: string;
  accentClassName?: string;
}

const SystemSignature = forwardRef<HTMLDivElement, SystemSignatureProps>(
  (
    {
      className = "",
      primaryClassName = "text-[#111111]",
      accentClassName = "text-accent",
    },
    ref,
  ) => {
    return (
      <div className={`flex flex-col items-start justify-center ${className}`} ref={ref}>
        <div
          className={`font-cormorant text-[26px] lg:text-[28px] leading-none tracking-[0.2em] font-medium ${primaryClassName}`}
        >
          SLR<span className={`italic ${accentClassName}`}>S</span>
        </div>
        <p className="text-[9px] sm:text-[9.5px] text-[#666666] uppercase tracking-[0.15em] mt-1 font-medium">
          Systematic Literature Review System
        </p>
      </div>
    );
  },
);

SystemSignature.displayName = "SystemSignature";

export default SystemSignature;
