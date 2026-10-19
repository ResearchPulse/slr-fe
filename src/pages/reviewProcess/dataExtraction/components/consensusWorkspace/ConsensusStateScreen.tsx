import { ArrowLeft, Info } from "lucide-react";
import Button from "../../../../../components/ui/Button";
import Card from "../../../../../components/ui/Card";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";

interface ConsensusStateScreenProps {
  onBack: () => void;
  isLoading?: boolean;
  message?: string;
}

export default function ConsensusStateScreen({
  onBack,
  isLoading = false,
  message,
}: ConsensusStateScreenProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-secondary">
      <header className="shrink-0 border-b border-border bg-surface-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="min-h-11 !px-2 focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center" role="status" aria-live="polite">
            <LoadingSpinner size="lg" className="mb-3" />
            <p className="text-sm text-text-secondary">Loading consensus data...</p>
          </div>
        ) : (
          <Card className="w-full max-w-md rounded-xl border border-primary/15 bg-primary-light/40 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-surface-white text-primary">
                <Info className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="pt-1 text-sm leading-6 text-text-secondary">
                {message ?? "No consensus data available for this study."}
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
