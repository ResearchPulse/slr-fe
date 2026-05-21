import { forwardRef } from "react";

interface SystemSignatureProps {
  className?: string;
  primaryClassName?: string;
  accentClassName?: string;
}

const SystemSignature = forwardRef<
  HTMLDivElement,
  SystemSignatureProps
>(
  (
    {
      className = "",
      primaryClassName = "text-white",
      accentClassName = "text-amber-300",
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`text-3xl lg:text-4xl font-sans font-bold uppercase tracking-[0.2em] mb-4 ${primaryClassName} ${className}`}
      >
        PRISMA
        <span className={`font-medium ml-1 ${accentClassName}`}>SLR</span>
      </div>
    );
  }
);

SystemSignature.displayName = "SystemSignature";

export default SystemSignature;
