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
        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 sm:flex sm:items-center sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="min-h-11 shrink-0 !px-2.5 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="hidden h-5 w-px shrink-0 bg-border sm:block" />

          <h2
            className="col-span-2 break-words text-sm font-semibold tracking-tight text-text-primary sm:col-span-1 sm:min-w-0 sm:flex-1 sm:truncate sm:text-base"
            title={paperTitle}
          >
            {paperTitle}
          </h2>
        </div>

        {/* Right: Badge & View Document */}
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          {isPartialPreview ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
              <Eye className="h-3.5 w-3.5 text-warning" />
              Read-Only Preview
            </span>
          ) : isReadOnly ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
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
            className="flex min-h-11 items-center gap-1.5 shadow-none"
          >
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span>View Document</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
