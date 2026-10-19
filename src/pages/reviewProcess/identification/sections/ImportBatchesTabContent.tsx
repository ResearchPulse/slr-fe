// Import Batches Tab Content

import { useState } from "react";
import {
  FiUpload,
  FiRefreshCw,
  FiAlertCircle,
  FiFileText,
  FiDatabase,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import Button from "../../../../components/ui/Button";
import Select from "../../../../components/ui/Select";
import type { ImportBatch } from "../../../../types/identification";
import { formatRelativeTime } from "../../../../utils/dateFormat";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

interface ImportBatchesTabContentProps {
  importBatches: ImportBatch[];
  importBatchesLoading: boolean;
  importBatchesError: string | null;
  isDragging: boolean;
  onRetry: () => void;
  onDeleteImportBatch: (importBatchId: string) => void | Promise<void>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function ImportBatchesTabContent({
  importBatches,
  importBatchesLoading,
  importBatchesError,
  isDragging,
  onRetry,
  onDeleteImportBatch,
  onDragOver,
  onDragLeave,
  onDrop,
}: ImportBatchesTabContentProps) {
  const [sourceFilter, setSourceFilter] = useState("all");
  const availableSources = Array.from(
    new Set(
      importBatches
        .map((batch) => batch.source)
        .filter((source): source is string => Boolean(source)),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const filteredBatches = importBatches.filter(
    (batch) => sourceFilter === "all" || batch.source === sourceFilter,
  );

  if (importBatchesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="md" />
          <p className="text-sm text-text-secondary">
            Loading import batches...
          </p>
        </div>
      </div>
    );
  }

  if (importBatchesError) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 p-4" role="alert">
        <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold text-error">
            Failed to load import batches
          </h3>
          <p className="text-sm text-text-primary">{importBatchesError}</p>
          <button
            onClick={onRetry}
            className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-error hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error motion-reduce:transition-none"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Upload Zone or Filter Bar */}
      {importBatches.length === 0 ? (
        <div
          className={`relative mb-6 rounded-xl border-2 border-dashed p-12 transition-[border-color,background-color] motion-reduce:transition-none ${
            isDragging
              ? "border-accent bg-primary-light"
              : "border-border bg-bg-primary hover:border-primary/40"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="text-center">
            <FiUpload className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Upload RIS File to Begin
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Import bibliographic records from PubMed, IEEE Xplore, ACM Digital
              Library, and other databases. Drag and drop your RIS file here, or
              click to browse.
            </p>
            <Button size="lg" className="text-base px-8">
              <FiUpload className="w-5 h-5 mr-2" />
              Select RIS File
            </Button>
            <p className="text-sm text-text-secondary mt-4">
              Supported formats:{" "}
              <span className="font-medium">.ris, .bib, .csv, .xml</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-secondary">
            Showing {filteredBatches.length} of {importBatches.length} batches
          </p>
          <div className="w-full sm:max-w-[240px]">
            <Select
              aria-label="Filter import batches by source"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              options={[
                { value: "all", label: "All sources" },
                ...availableSources.map((source) => ({ value: source, label: source })),
              ]}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Import Batches Table */}
      {importBatches.length > 0 && filteredBatches.length === 0 && (
        <div className="rounded-xl border border-border bg-bg-primary px-4 py-8 text-center">
          <p className="text-sm font-medium text-text-primary">No batches from this source</p>
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Show all sources
          </button>
        </div>
      )}

      {filteredBatches.length > 0 && (
        <>
          <div className="space-y-3 md:hidden">
            {filteredBatches.map((batch) => (
              <article key={batch.id} className="rounded-xl border border-border bg-surface-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FiFileText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold text-text-primary">
                        {batch.fileName || "Imported records"}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                        <FiDatabase aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" />
                        {batch.source || "Unknown source"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
                    <FiCheck aria-hidden="true" className="h-3 w-3" />
                    Completed
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 text-xs">
                  <div>
                    <dt className="text-text-secondary">Imported by</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">{batch.importedBy || "System"}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Imported</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">{formatRelativeTime(batch.importedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Records</dt>
                    <dd className="mt-0.5 font-semibold text-text-primary">{batch.totalRecords.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => onDeleteImportBatch(batch.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-error/20 px-3 text-xs font-medium text-error transition-colors hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30"
                      aria-label={`Delete import batch ${batch.fileName}`}
                    >
                      <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  File Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Source Database
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Imported By
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Import Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Records
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-border hover:bg-bg-primary transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4 text-text-secondary" />
                      <span className="font-medium text-text-primary">
                        {batch.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="w-4 h-4 text-accent" />
                      <span className="text-sm text-text-primary">
                        {batch.source}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {batch.importedBy || "System"}
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {formatRelativeTime(batch.importedAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-lg font-semibold text-text-primary">
                        {batch.totalRecords.toLocaleString()}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Total records
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <FiCheck className="w-3 h-3" />
                        Completed
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onDeleteImportBatch(batch.id)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-error transition-colors hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 motion-reduce:transition-none"
                        aria-label={`Delete import batch ${batch.fileName}`}
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}
