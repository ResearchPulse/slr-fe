import React from "react";
import { useNavigate } from "react-router-dom";
import { toastError } from "../../utils/toast";
import {
  FiInfo,
} from "react-icons/fi";
import PaperTable from "./PaperTable";
import FilterPopover from "./FilterPopover";
import BulkActionBar from "./BulkActionBar";
import AddToProcessBySelectionModal from "./AddToProcessBySelectionModal";
import AddToProcessByFilterModal from "./AddToProcessByFilterModal";
import ManageFiltersModal from "./ManageFiltersModal";
import NameFilterModal from "./NameFilterModal";
import PaperImportModal from "./PaperImportModal";
import ReviewProcessRail from "./ReviewProcessRail";
import ReviewProcessPanel from "./ReviewProcessPanel";
import type {
  PaperPoolItem,
  PaperPoolFilters,
  PaperPoolFilterSetting,
  ProcessSnapshot,
  SelectionInsertResult,
  PaperPoolFilterMetadata,
} from "./types";
import type { UploadPdfOptions } from "../../pages/reviewProcess/studySelection/uploadTypes";
import type { PaperWithDecisionsResponse } from "../../types/studySelection";

type UploadPdfHandler = (
  paperId: string,
  file: File,
  options?: UploadPdfOptions,
) => Promise<PaperWithDecisionsResponse>;
type ApplyMetadataSuggestionHandler = (
  paperId: string,
  sourceMetadataId: string,
  fields: string[],
) => Promise<void>;

interface PaperRepositoryPageProps {
  projectId: string;
  // Papers Data
  papers: PaperPoolItem[];
  totalCount: number;
  totalPages: number;
  isLoadingPapers: boolean;
  isFetchingPapers: boolean;

  // Search & Filters
  searchText: string;
  setSearchText: (val: string) => void;
  filters: PaperPoolFilters;
  setFilters: (filters: PaperPoolFilters) => void;
  onResetFilters: () => void;

  // Selection
  selectedPaperIds: string[];
  setSelectedPaperIds: (ids: string[]) => void;

  // Saved Filters
  savedFilters: PaperPoolFilterSetting[];
  selectedSavedFilterId: string | null;
  onApplySavedFilter: (filter: PaperPoolFilterSetting) => void;
  onSelectSavedFilter: (id: string) => void;
  onDeleteSavedFilter: (id: string) => Promise<void>;
  onSaveCurrentAsFilter: (name: string) => Promise<void>;
  onConfirmSaveFilter: (name: string) => void;
  onOpenSaveModal: () => void;
  onSaveDetailAsNew: (draft: PaperPoolFilterSetting) => Promise<void>;

  // Process Transfer
  processSnapshots: ProcessSnapshot[];
  onAddSelectedToProcess: (processId: string) => Promise<void>;
  onAddFromFilterToProcess: (
    processId: string,
    filterId: string,
  ) => Promise<void>;
  isAdding: boolean;
  insertResult: SelectionInsertResult | null;
  setInsertResult: (res: SelectionInsertResult | null) => void;
  selectedSavedFilterMatchedCount: number | null;

  // Modals/UI State
  isManageFiltersOpen: boolean;
  setIsManageFiltersOpen: (val: boolean) => void;
  isNameFilterModalOpen: boolean;
  setIsNameFilterModalOpen: (val: boolean) => void;
  isAddToProcessBySelectionOpen: boolean;
  setIsAddToProcessBySelectionOpen: (val: boolean) => void;
  isAddToProcessByFilterOpen: boolean;
  setIsAddToProcessByFilterOpen: (val: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (val: boolean) => void;

  // Pagination
  pageNumber: number;
  setPageNumber: (n: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;

  // Detail Filter State (for management)
  detailFilter: PaperPoolFilterSetting | null;
  isLoadingDetailFilter: boolean;
  onViewFilterDetail: (id: string) => void;
  isCreatingFilter: boolean;
  isDeletingFilter: boolean;
  metadata: PaperPoolFilterMetadata | null;

  // Navigation
  onGoToDeduplication: () => void;
  onNavigateToProcess: (processId: string) => void;
  pendingDuplicatesCount: number;

  // PDF Actions
  onUploadPdf?: UploadPdfHandler;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: ApplyMetadataSuggestionHandler;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;
  onDeletePaper?: (paperId: string, reason: string) => void;
  isDeletingPaper?: string | null;
  onOpenCreateProcessModal: () => void;
  isLeader?: boolean;
  canUploadPdf?: boolean;
}

export default function PaperRepositoryPage({
  projectId,
  papers,
  totalCount,
  totalPages,
  isLoadingPapers,
  isFetchingPapers,
  searchText,
  setSearchText,
  filters,
  setFilters,
  onResetFilters,
  selectedPaperIds,
  setSelectedPaperIds,
  savedFilters,
  selectedSavedFilterId,
  onApplySavedFilter,
  onSelectSavedFilter,
  onDeleteSavedFilter,
  onConfirmSaveFilter,
  onOpenSaveModal,
  onSaveDetailAsNew,
  processSnapshots,
  onAddSelectedToProcess,
  onAddFromFilterToProcess,
  isAdding,
  insertResult,
  setInsertResult,
  selectedSavedFilterMatchedCount,
  isManageFiltersOpen,
  setIsManageFiltersOpen,
  isNameFilterModalOpen,
  setIsNameFilterModalOpen,
  isAddToProcessBySelectionOpen,
  setIsAddToProcessBySelectionOpen,
  isAddToProcessByFilterOpen,
  setIsAddToProcessByFilterOpen,
  isImportModalOpen,
  setIsImportModalOpen,
  pageNumber,
  setPageNumber,
  pageSize,
  setPageSize,
  detailFilter,
  isLoadingDetailFilter,
  onViewFilterDetail,
  isCreatingFilter,
  isDeletingFilter,
  metadata,
  onNavigateToProcess,
  onUploadPdf,
  isUploadingPdf,
  onApplyMetadataSuggestion,
  isApplyingMetadataSuggestion,
  onRemovePdf,
  isRemovingPdf,
  onDeletePaper,
  isDeletingPaper,
  onOpenCreateProcessModal,
  isLeader = false,
  canUploadPdf = false,
}: PaperRepositoryPageProps) {
  const navigate = useNavigate();
  const [isReviewRailOpen, setIsReviewRailOpen] = React.useState(false);
  const allPageSelected =
    papers.length > 0 && papers.every((p) => selectedPaperIds.includes(p.id));

  const handleToggleAllPage = (checked: boolean) => {
    const pageIds = papers.map((p) => p.id);
    if (checked) {
      setSelectedPaperIds(
        Array.from(new Set([...selectedPaperIds, ...pageIds])),
      );
    } else {
      setSelectedPaperIds(
        selectedPaperIds.filter((id) => !pageIds.includes(id)),
      );
    }
  };

  const handleTogglePaper = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedPaperIds([...selectedPaperIds, id]);
    } else {
      setSelectedPaperIds(selectedPaperIds.filter((pid) => pid !== id));
    }
  };

  return (
    <div className="flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
      {/* Read-Only Banner for Non-Leaders */}
      {!isLeader && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-text-primary sm:text-sm" role="status">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FiInfo className="h-4 w-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-text-primary">
              View-Only Repository:
            </span>
            <span className="text-text-secondary">
              Only Project Leaders can import sources and assign papers to review processes. You can search, inspect papers, or navigate to your review processes below.
            </span>
          </div>
        </div>
      )}

      {/* Unified repository table and filter toolbar */}
      <div className="flex min-w-0 flex-1 flex-col space-y-4">
          <PaperTable
            papers={papers}
            isLoading={isLoadingPapers}
            isFetching={isFetchingPapers}
            totalCount={totalCount}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            filterControl={
              <FilterPopover
                filters={filters}
                availablePaperSources={metadata?.paperSources ?? []}
                availableSources={metadata?.searchSources ?? []}
                availableBatches={metadata?.importBatches ?? []}
                onChange={(nextFilters) => {
                  setFilters(nextFilters);
                }}
                onReset={onResetFilters}
                onSaveCurrent={onOpenSaveModal}
                onAddToProcess={() => setIsAddToProcessByFilterOpen(true)}
                savedFilters={savedFilters}
                selectedFilterId={selectedSavedFilterId}
                onSelectSavedFilter={onApplySavedFilter}
                onManageSavedFilters={() => setIsManageFiltersOpen(true)}
                isSaving={isCreatingFilter}
              />
            }
            onImport={() => setIsImportModalOpen(true)}
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageSize={pageSize}
            selectedPaperIds={selectedPaperIds}
            allPageSelected={allPageSelected}
            onToggleAllPage={handleToggleAllPage}
            onTogglePaper={handleTogglePaper}
            onViewDetails={(paper) =>
              navigate(`/projects/${projectId}/papers/${paper.id}`)
            }
            onPageChange={setPageNumber}
            onPageSizeChange={setPageSize}
            onUploadPdf={onUploadPdf}
            isUploadingPdf={isUploadingPdf}
            onApplyMetadataSuggestion={onApplyMetadataSuggestion}
            isApplyingMetadataSuggestion={isApplyingMetadataSuggestion}
            onRemovePdf={onRemovePdf}
            isRemovingPdf={isRemovingPdf}
            onDeletePaper={onDeletePaper}
            isDeletingPaper={isDeletingPaper}
            isLeader={isLeader}
            canUploadPdf={canUploadPdf}
          />
          {isLeader && (
            <BulkActionBar
              selectedCount={selectedPaperIds.length}
              onAddToProcess={() => setIsAddToProcessBySelectionOpen(true)}
              onClear={() => {
                setSelectedPaperIds([]);
                setInsertResult(null);
              }}
              isSubmitting={isAdding}
            />
          )}
      </div>

      <div id="review-process-panel">
        <ReviewProcessPanel
          processes={processSnapshots}
          selectedPaperIds={selectedPaperIds}
          onAddSelected={onAddSelectedToProcess}
          onAddFromFilter={(processId) => {
            if (!selectedSavedFilterId) {
              toastError("Please select a filter first");
              return;
            }
            onAddFromFilterToProcess(processId, selectedSavedFilterId);
          }}
          onNavigate={onNavigateToProcess}
          onCreateProcess={onOpenCreateProcessModal}
          isAdding={isAdding}
          isLeader={isLeader}
        />
      </div>

      {/* Overlays / Modals */}
      <AddToProcessBySelectionModal
        isOpen={isAddToProcessBySelectionOpen}
        onClose={() => {
          setIsAddToProcessBySelectionOpen(false);
          setInsertResult(null);
        }}
        processSnapshots={processSnapshots}
        selectedPaperIds={selectedPaperIds}
        onAddSelected={onAddSelectedToProcess}
        isAdding={isAdding}
        insertResult={insertResult}
        onNavigateToProcess={onNavigateToProcess}
        isLeader={isLeader}
      />

      <AddToProcessByFilterModal
        isOpen={isAddToProcessByFilterOpen}
        onClose={() => {
          setIsAddToProcessByFilterOpen(false);
          setInsertResult(null);
        }}
        processSnapshots={processSnapshots}
        savedFilters={savedFilters}
        onAddFromFilter={onAddFromFilterToProcess}
        isAdding={isAdding}
        insertResult={insertResult}
        selectedSavedFilterId={selectedSavedFilterId}
        selectedSavedFilterMatchedCount={selectedSavedFilterMatchedCount}
        onSelectFilter={onSelectSavedFilter}
        onNavigateToProcess={onNavigateToProcess}
        isLeader={isLeader}
      />

      <ManageFiltersModal
        isOpen={isManageFiltersOpen}
        onClose={() => setIsManageFiltersOpen(false)}
        savedFilters={savedFilters}
        onDelete={onDeleteSavedFilter}
        onSaveAsNew={onSaveDetailAsNew}
        detailFilter={detailFilter}
        isLoadingDetail={isLoadingDetailFilter}
        onViewDetail={onViewFilterDetail}
        isCreating={isCreatingFilter}
        isDeleting={isDeletingFilter}
        metadata={metadata}
      />

      <NameFilterModal
        isOpen={isNameFilterModalOpen}
        onClose={() => setIsNameFilterModalOpen(false)}
        onConfirm={(name) => {
          onConfirmSaveFilter(name);
          setIsNameFilterModalOpen(false);
        }}
        isLoading={isCreatingFilter}
      />

      <ReviewProcessRail
        isOpen={isReviewRailOpen}
        onClose={() => setIsReviewRailOpen(false)}
        processSnapshots={processSnapshots}
        selectedCount={selectedPaperIds.length}
        filteredCount={totalCount}
        savedFilterOptions={savedFilters.map((f) => ({
          id: f.id,
          name: f.name,
        }))}
        selectedSavedFilterId={selectedSavedFilterId}
        selectedSavedFilterMatchedCount={selectedSavedFilterMatchedCount}
        selectedProcessId={null} // Controlled by modal or state if needed
        insertResult={insertResult}
        onSelectProcess={() => {}} // Integration logic if rail can select
        onSelectSavedFilter={() => {}}
        onCreateSavedFilterFromCurrent={onOpenSaveModal}
        onAddToSelectedProcess={() => setIsAddToProcessBySelectionOpen(true)}
        onAddAllFilteredToSelectedProcess={() =>
          setIsAddToProcessByFilterOpen(true)
        }
        onNavigateToProcess={onNavigateToProcess}
        isAdding={isAdding}
        isLeader={isLeader}
      />

      <PaperImportModal
        projectId={projectId}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        sourceOptions={(metadata?.searchSources ?? []).map((source) => ({
          label: source.name,
          value: source.id,
        }))}
      />
    </div>
  );
}
