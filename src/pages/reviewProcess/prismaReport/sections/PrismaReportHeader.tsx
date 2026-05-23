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
    <header className="sticky top-0 z-20 bg-surface-white border-b border-border print:static print:border-0">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back + title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-[4px] transition-colors print:hidden"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[4px] bg-indigo-100 flex items-center justify-center shrink-0">
                <FiClipboard className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-text-primary truncate">
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
