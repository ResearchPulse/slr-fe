// Strategies Tab Content: Error state, SearchStrategiesPanel, QuickImportCard

import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import Button from "../../../../components/ui/Button";
import SearchStrategiesPanel from "../../../../components/identification/strategies/SearchStrategiesPanel";
import type { SearchExecutionResponse } from "../../../../types/searchExecution";
import type { ImportBatch } from "../../../../types/identification";

interface StrategiesTabContentProps {
  identificationPhaseId: string;
  searchExecutions: SearchExecutionResponse[];
  importBatches: ImportBatch[];
  listLoading: boolean;
  listError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  onRetry: () => void;
  onCreateStrategy: () => void;
  onImportToStrategy: (strategyId: string) => void;
  onEditStrategy: (id: string) => void;
  onDeleteStrategy: (strategyId: string) => Promise<void>;
  onViewImportPapers: (importBatchId: string) => void;
  onDeleteImportBatch: (importBatchId: string) => Promise<void>;
  onQuickImport: (
    file: File,
    source: string,
    strategyId?: string,
  ) => Promise<void>;
  canEdit: boolean;
}

export default function StrategiesTabContent({
  identificationPhaseId,
  searchExecutions,
  importBatches,
  listLoading,
  listError,
  onRetry,
  onCreateStrategy,
  onImportToStrategy,
  onEditStrategy,
  onDeleteStrategy,
  onViewImportPapers,
  onDeleteImportBatch,
  canEdit,
}: StrategiesTabContentProps) {
  return (
    <div className="space-y-5">
      {/* Error State */}
      {listError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/25 bg-error/5 p-4">
          <FiAlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold text-text-primary">
              Failed to load search strategies
            </h3>
            <p className="text-sm text-text-secondary">{listError}</p>
            <Button variant="secondary" size="sm" onClick={onRetry} className="mt-3">
              <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* PRIMARY: Search Strategies Panel with nested ImportBatch */}
      <SearchStrategiesPanel
        identificationProcessId={identificationPhaseId}
        strategies={searchExecutions}
        importBatches={importBatches}
        isLoading={listLoading}
        onCreateStrategy={onCreateStrategy}
        onImportToStrategy={onImportToStrategy}
        onEditStrategy={onEditStrategy}
        onDeleteStrategy={onDeleteStrategy}
        onViewImportPapers={onViewImportPapers}
        onDeleteImportBatch={onDeleteImportBatch}
        canEdit={canEdit}
      />

      {/* SECONDARY: Quick Import Card */}
      {/* <QuickImportCard
        identificationProcessId={identificationPhaseId}
        availableStrategies={searchExecutions}
        onImport={onQuickImport}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      /> */}
    </div>
  );
}
