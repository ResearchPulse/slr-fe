// PRISMA Report Workspace Header — Back navigation + title + actions

import { FiArrowLeft, FiClipboard } from "react-icons/fi";

interface PrismaReportHeaderProps {
  onBack: () => void;
  children?: React.ReactNode;
}

export default function PrismaReportHeader({
  onBack,
  children,
}: PrismaReportHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface-white/95 border-b border-border/70 shadow-sm print:static print:border-0 print:shadow-none">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Back + title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2.5 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 print:hidden"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <FiClipboard className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-text-primary truncate">
                  PRISMA Report
                </h1>
                <p className="text-xs text-text-secondary">
                  PRISMA 2020 Flow Diagram
                </p>
              </div>
            </div>
          </div>

          {/* Right: Export actions slot */}
          <div className="flex items-center gap-3 print:hidden">{children}</div>
        </div>
      </div>
    </header>
  );
}
