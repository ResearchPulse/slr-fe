import React from "react";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiUpload,
  FiPlus,
  FiLayers,
  FiArrowDown,
  FiInfo,
} from "react-icons/fi";
import Button from "../ui/Button";
import PaperTable from "./PaperTable";
import FilterSidebar from "./FilterSidebar";
import SavedFilterDropdown from "./SavedFilterDropdown";
import BulkActionBar from "./BulkActionBar";
import AddToProcessBySelectionModal from "./AddToProcessBySelectionModal";
import AddToProcessByFilterModal from "./AddToProcessByFilterModal";
import ManageFiltersModal from "./ManageFiltersModal";
import PaperViewerModal from "../shared/paper/PaperViewerModal";
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
  isFilterPanelCollapsed: boolean;
  setIsFilterPanelCollapsed: (val: boolean) => void;

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

  // Detail View
  viewerPaper: PaperPoolItem | null;
  setViewerPaper: (paper: PaperPoolItem | null) => void;

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
  isFilterPanelCollapsed,
  setIsFilterPanelCollapsed,
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
  viewerPaper,
  setViewerPaper,
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
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Area */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-accent sm:h-14 sm:w-14">
            <FiLayers className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              Paper <span className="text-accent">Identification</span> Repository
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-text-secondary">
              Centralized repository of all imported papers. Select and assign
              papers to review processes below.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          {/* Search Box */}
          <div className="group relative min-w-0 flex-1 sm:min-w-[250px] sm:flex-none">
            <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search title, DOI, authors..."
              className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 sm:w-[260px]"
            />
          </div>

          <SavedFilterDropdown
            savedFilters={savedFilters}
            selectedFilterId={selectedSavedFilterId}
            onSelect={onApplySavedFilter}
            onManage={() => setIsManageFiltersOpen(true)}
            onSaveNew={onOpenSaveModal}
            isCreating={isCreatingFilter}
          />

          {isLeader && (
            <Button
              variant="outline"
              className="w-full rounded-lg border-border px-4 hover:border-accent hover:text-accent sm:w-auto"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FiUpload className="w-4 h-4 mr-2" />
              Import Papers
            </Button>
          )}
        </div>
      </div>

      {/* Read-Only Banner for Non-Leaders */}
      {!isLeader && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-sm text-blue-900 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-accent">
            <FiInfo className="h-5 w-5" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-blue-950">
              View-Only Repository:
            </span>
            <span className="text-blue-800/90">
              Only Project Leaders can import sources and assign papers to review processes. You can search, inspect papers, or navigate to your review processes below.
            </span>
          </div>
        </div>
      )}

      {/* Main Content: Sidebar + Table */}
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:gap-5">
        <FilterSidebar
          filters={filters}
          availableSources={metadata?.searchSources ?? []}
          availableBatches={metadata?.importBatches ?? []}
          isCollapsed={isFilterPanelCollapsed}
          onToggleCollapse={() =>
            setIsFilterPanelCollapsed(!isFilterPanelCollapsed)
          }
          onChange={setFilters}
          onReset={onResetFilters}
          onSaveCurrent={onOpenSaveModal}
          onAddToProcess={() => setIsAddToProcessByFilterOpen(true)}
          isSaving={isCreatingFilter}
        />

        <div className="flex-1 min-w-0 space-y-6">
          <PaperTable
            papers={papers}
            isLoading={isLoadingPapers}
            isFetching={isFetchingPapers}
            totalCount={totalCount}
            pageNumber={pageNumber}
            totalPages={totalPages}
            pageSize={pageSize}
            selectedPaperIds={selectedPaperIds}
            allPageSelected={allPageSelected}
            onToggleAllPage={handleToggleAllPage}
            onTogglePaper={handleTogglePaper}
            onViewDetails={setViewerPaper}
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
        </div>
      </div>

      {/* Flow Indicator */}
      <div className="my-2 flex items-center gap-4 px-1 sm:gap-6 sm:px-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-white px-4 py-2 shadow-sm sm:px-5">
            <FiPlus className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Assign papers to review processes
            </span>
            <FiArrowDown className="h-4 w-4 text-accent" />
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      <div id="review-process-panel">
        <ReviewProcessPanel
          processes={processSnapshots}
          selectedPaperIds={selectedPaperIds}
          onAddSelected={onAddSelectedToProcess}
          onAddFromFilter={(processId) => {
            if (!selectedSavedFilterId) {
              toast.error("Please select a filter first");
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

      <PaperViewerModal
        paper={viewerPaper}
        isOpen={!!viewerPaper}
        onClose={() => setViewerPaper(null)}
        onApplyMetadataSuggestion={onApplyMetadataSuggestion}
        isApplyingMetadataSuggestion={isApplyingMetadataSuggestion}
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
