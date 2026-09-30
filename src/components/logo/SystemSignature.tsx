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
      primaryClassName = "text-text-primary",
      accentClassName = "text-accent",
    },
    ref,
  ) => {
    return (
      <div className={`flex flex-col items-start justify-center ${className}`} ref={ref}>
        <div
          className={`font-sans text-[24px] lg:text-[26px] leading-none tracking-[0.06em] font-bold ${primaryClassName}`}
        >
          SLR<span className={accentClassName}>S</span>
        </div>
        <p className="text-[8.5px] sm:text-[9px] text-text-muted uppercase tracking-[0.18em] mt-1 font-semibold">
          Systematic Literature Review System
        </p>
      </div>
    );
  },
);

SystemSignature.displayName = "SystemSignature";

export default SystemSignature;
