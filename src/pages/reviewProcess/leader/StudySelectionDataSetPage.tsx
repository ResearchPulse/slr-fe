import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useIncludedPapers } from "../../../hooks/useStudySelection";
import SnapshotDatasetView from "./components/SnapshotDatasetView";
import type { PaperResponse } from "../../../types/paper";

const BuildDatasetPage: React.FC = () => {
  const { screeningProcessId } = useParams<{ screeningProcessId: string }>();

  // Snapshot state - pagination and filters
  const [snapshotPage, setSnapshotPage] = useState(1);
  const [snapshotSearchInput, setSnapshotSearchInput] = useState("");
  const [snapshotYearInput, setSnapshotYearInput] = useState("");
  const [snapshotPageSize] = useState(9);

  // Use the new hook for Included Papers (Snapshot)
  const {
    data: snapshotData,
    isLoading: snapshotLoading,
    isFetching: snapshotFetchingStatus,
    refetch: refetchSnapshot,
  } = useIncludedPapers(screeningProcessId, {
    search: snapshotSearchInput,
    pageNumber: snapshotPage,
    pageSize: snapshotPageSize,
  });

  const snapshotPapers = (snapshotData?.items || []).map((p: any) => ({
    ...p,
    id: p.paperId || p.id,
  })) as any as PaperResponse[];
  const totalSnapshotCount = snapshotData?.totalCount || 0;
  const snapshotTotalPages = snapshotData?.totalPages || 0;
  const snapshotFetching = snapshotLoading || snapshotFetchingStatus;

  const paginatedSnapshotPapers = snapshotPapers;

  const handleRemoveFromSnapshot = useCallback(() => {
    // TODO: Call API to remove from snapshot
    // For now, it won't persist after refetch without API implementation
  }, []);

  const handleSnapshotClearFilters = () => {
    setSnapshotSearchInput("");
    setSnapshotYearInput("");
    setSnapshotPage(1);
  };

  const handleRefetch = () => {
    refetchSnapshot();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex-1 flex flex-col bg-surface-white rounded-xl border border-border shadow-none overflow-hidden">
        <div className="h-full p-6">
          <SnapshotDatasetView
            papers={paginatedSnapshotPapers}
            totalCount={totalSnapshotCount}
            page={snapshotPage}
            totalPages={snapshotTotalPages}
            loading={snapshotLoading}
            fetching={snapshotFetching}
            error={null}
            pageSize={snapshotPageSize}
            searchInput={snapshotSearchInput}
            yearInput={snapshotYearInput}
            onSearchInputChange={(v) => {
              setSnapshotSearchInput(v);
              setSnapshotPage(1);
            }}
            onYearInputChange={(v) => {
              setSnapshotYearInput(v);
              setSnapshotPage(1);
            }}
            onSearch={setSnapshotSearchInput}
            onYearFilter={(v) => setSnapshotYearInput(v?.toString() || "")}
            onClearFilters={handleSnapshotClearFilters}
            onRefetch={handleRefetch}
            onNextPage={() => setSnapshotPage((p) => p + 1)}
            onPreviousPage={() => setSnapshotPage((p) => p - 1)}
            onRemoveFromSnapshot={handleRemoveFromSnapshot}
            canEdit={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BuildDatasetPage;
