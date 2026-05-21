import { forwardRef } from "react";

const FlowArrow = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="hidden lg:flex items-center justify-center h-14 px-3 opacity-0"
      data-flow-arrow
    >
      {/* Thin editorial line arrow */}
      <div className="flex items-center gap-1 text-[#D8D2C8]">
        <div className="w-8 h-px bg-[#D8D2C8]" />
        <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-[#D8D2C8]" />
      </div>
    </div>
  );
});

FlowArrow.displayName = "FlowArrow";

export default FlowArrow;
