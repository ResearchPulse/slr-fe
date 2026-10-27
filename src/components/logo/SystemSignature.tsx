import { forwardRef } from "react";

interface SystemSignatureProps {
  className?: string;
  logoClassName?: string;
  showTagline?: boolean;
}

const SystemSignature = forwardRef<HTMLDivElement, SystemSignatureProps>(
  ({ className = "", logoClassName = "h-8 lg:h-9", showTagline = false }, ref) => {
    return (
      <div className={`flex min-w-0 max-w-full flex-col items-start justify-center ${className}`} ref={ref}>
        <img
          src="/brand/logo-horizontal.png"
          alt="SLRS"
          className={`block max-w-full w-auto object-contain object-left select-none ${logoClassName}`}
          draggable={false}
        />
        {showTagline && (
          <p className="mt-1 hidden text-[8.5px] text-text-muted uppercase tracking-[0.18em] sm:block sm:text-[9px]">
            Systematic Literature Review System
          </p>
        )}
      </div>
    );
  },
);

SystemSignature.displayName = "SystemSignature";

export default SystemSignature;
