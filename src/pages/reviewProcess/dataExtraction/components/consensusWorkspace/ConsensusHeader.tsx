import { ArrowLeft, CheckCircle2, Eye, FileText } from "lucide-react";
import Button from "../../../../../components/ui/Button";

interface ConsensusHeaderProps {
  paperTitle: string;
  onBack: () => void;
  onOpenDocument: () => void;
  isReadOnly?: boolean;
  isPartialPreview?: boolean;
}

export default function ConsensusHeader({
  paperTitle,
  onBack,
  onOpenDocument,
  isReadOnly = false,
  isPartialPreview = false,
}: ConsensusHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface-white">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* Left: Back button + Divider + Paper Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0 !px-2.5 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="hidden h-5 w-px bg-border sm:block shrink-0" />

          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-sm sm:text-base font-semibold text-text-primary tracking-tight"
              title={paperTitle}
            >
              {paperTitle}
            </h2>
          </div>
        </div>

        {/* Right: Badge & View Document */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {isPartialPreview ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <Eye className="h-3.5 w-3.5 text-amber-600" />
              Read-Only Preview
            </span>
          ) : isReadOnly ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Finalized
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-accent/30 bg-primary-light px-3 py-1 text-xs font-semibold text-accent">
              Consensus Mode
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDocument}
            className="flex items-center gap-1.5 shadow-none"
          >
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span>View Document</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
