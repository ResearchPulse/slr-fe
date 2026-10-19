import { useMemo, useState, useEffect, useCallback } from "react";
import {
  FiCheckSquare,
  FiSave,
  FiSquare,
  FiMinusSquare,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { ExtractionSuggestionResponse } from "../../../../types/paper";
import { cn } from "../../../../utils/cn";

interface MetadataSuggestionModalProps {
  isOpen: boolean;
  isApplying: boolean;
  currentMetadata: {
    title?: string | null;
    authors?: string | null;
    abstract?: string | null;
    doi?: string | null;
    journal?: string | null;
    volume?: string | null;
    issue?: string | null;
    pages?: string | null;
    keywords?: string | null;
    year?: string | null;
    publishedDate?: string | null;
    issn?: string | null;
    eissn?: string | null;
    language?: string | null;
    md5?: string | null;
    publisher?: string | null;
  };
  suggestion: ExtractionSuggestionResponse;
  onApply: (selectedFields: string[]) => Promise<void>;
  onClose: () => void;
  onApplied?: (selectedFields: string[]) => void;
}

interface SuggestionFieldConfig {
  key: keyof ExtractionSuggestionResponse;
  apiFieldName: string;
  label: string;
}

const SUGGESTION_FIELD_CONFIG: SuggestionFieldConfig[] = [
  { key: "title", apiFieldName: "Title", label: "Title" },
  { key: "authors", apiFieldName: "Authors", label: "Authors" },
  { key: "abstract", apiFieldName: "Abstract", label: "Abstract" },
  { key: "doi", apiFieldName: "DOI", label: "DOI" },
  { key: "journal", apiFieldName: "Journal", label: "Journal" },
  { key: "volume", apiFieldName: "Volume", label: "Volume" },
  { key: "issue", apiFieldName: "Issue", label: "Issue" },
  { key: "pages", apiFieldName: "Pages", label: "Pages" },
  { key: "keywords", apiFieldName: "Keywords", label: "Keywords" },
  { key: "year", apiFieldName: "Year", label: "Year" },
  {
    key: "publishedDate",
    apiFieldName: "Published Date",
    label: "Published Date",
  },
  { key: "issn", apiFieldName: "ISSN", label: "ISSN" },
  { key: "eissn", apiFieldName: "EISSN", label: "EISSN" },
  { key: "language", apiFieldName: "Language", label: "Language" },
  { key: "md5", apiFieldName: "Md5", label: "Md5" },
  { key: "publisher", apiFieldName: "Publisher", label: "Publisher" },
];

/**
 * Normalizes values for comparison:
 * - Trims whitespace
 * - Collapses multiple spaces into one
 * - Normalizes comma spacing (comma followed by exactly one space)
 */
function normalizeValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim().replace(/\s+/g, " ").replace(/,\s*/g, ", ");
}

export default function MetadataSuggestionModal({
  isOpen,
  isApplying,
  currentMetadata,
  suggestion,
  onApply,
  onClose,
  onApplied,
}: MetadataSuggestionModalProps) {
  // 1. Process rows and determine status
  const rows = useMemo(() => {
    return SUGGESTION_FIELD_CONFIG.map((field) => {
      const currentValue = normalizeValue(
        currentMetadata[field.key as keyof typeof currentMetadata] as string,
      );
      const suggestedValue = normalizeValue(suggestion[field.key] as string);

      const isChanged =
        currentValue !== suggestedValue && suggestedValue.length > 0;
      const isSmartDefault =
        isChanged &&
        (suggestion.suggestedFields?.includes(field.apiFieldName) ?? false);

      return {
        ...field,
        currentValue,
        suggestedValue,
        isChanged,
        isSmartDefault,
      };
    }).filter((row) => row.suggestedValue.length > 0);
  }, [currentMetadata, suggestion]);

  // 2. Local state for selection
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // 3. Sync state whenever rows change (Alignment with Backend Logic)
  useEffect(() => {
    if (isOpen) {
      const defaults = rows
        .filter((row) => row.isSmartDefault)
        .map((row) => row.apiFieldName);
      setSelectedFields(defaults);
    }
  }, [rows, isOpen]);

  const selectableRows = useMemo(() => rows.filter((r) => r.isChanged), [rows]);

  const handleToggle = useCallback((fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName)
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName],
    );
  }, []);

  const handleSelectAll = () => {
    setSelectedFields(selectableRows.map((r) => r.apiFieldName));
  };

  const handleClearAll = () => {
    setSelectedFields([]);
  };

  const handleApply = async () => {
    if (selectedFields.length === 0 || isApplying) return;

    try {
      await onApply(selectedFields);
      onApplied?.(selectedFields);
      onClose();
    } catch (error) {
      console.error("Failed to apply metadata:", error);
    }
  };

  const allSelected =
    selectableRows.length > 0 &&
    selectedFields.length === selectableRows.length;
  const noneSelected = selectedFields.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Metadata Suggestions"
      description="Review extracted metadata and choose which fields to apply."
      size="xl"
      closeOnEsc={!isApplying}
      closeOnOutsideClick={!isApplying}
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-primary-light/50 p-4 text-sm text-accent">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="leading-relaxed">
            Suggested values are extracted via GROBID AI. Fields marked with
            <span className="mx-1 font-bold text-accent italic">
              "Suggested"
            </span>
            represent values that differ from your current metadata or fill in
            missing gaps.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary/50 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-white shadow-sm">
            <FiMinusSquare className="h-6 w-6 text-text-secondary/35" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              No usable metadata suggestions found in the PDF.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
                <span className="text-xs font-semibold tracking-wide text-text-secondary">
                  Bulk Actions
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={allSelected || isApplying}
                  className="min-h-11 px-2 text-xs normal-case tracking-normal text-accent"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={noneSelected || isApplying}
                  className="min-h-11 px-2 text-xs normal-case tracking-normal"
                >
                  Clear All
                </Button>
              </div>

              <div className="text-xs font-medium text-text-secondary">
                {selectedFields.length} of {selectableRows.length} selected
              </div>
            </div>

            {/* Table */}
            <div
              role="region"
              aria-label="Suggested metadata comparison"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                ) {
                  return;
                }

                event.preventDefault();
                event.currentTarget.scrollLeft +=
                  event.key === "ArrowRight" ? 80 : -80;
              }}
              className="overflow-x-auto rounded-xl border border-border bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <table className="min-w-[680px] divide-y divide-border text-left">
                <thead className="bg-bg-secondary/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary sm:px-6 sm:py-4">
                      Field Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary sm:px-6 sm:py-4">
                      Current Metadata
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary sm:px-6 sm:py-4">
                      AI Suggestion
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary sm:px-6 sm:py-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((row) => {
                    const isChecked = selectedFields.includes(row.apiFieldName);
                    const isSelectable = row.isChanged;
                    const isRecommended = row.isSmartDefault;

                    return (
                      <tr
                        key={row.apiFieldName}
                        className={cn(
                          "group transition-colors",
                          !isSelectable
                            ? "bg-bg-secondary/30"
                            : "hover:bg-bg-secondary",
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-text-primary">
                              {row.label}
                            </span>
                            {!isSelectable && (
                              <span className="text-[10px] font-medium text-text-secondary">
                                Unchanged
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                            {row.currentValue || (
                              <span className="italic text-text-secondary/50">
                                Empty
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={cn(
                                "text-xs leading-relaxed font-medium line-clamp-3",
                                isSelectable
                                  ? "text-text-primary"
                                  : "text-text-secondary",
                              )}
                            >
                              {row.suggestedValue}
                            </span>
                            {isRecommended && (
                              <div className="inline-flex w-fit items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-success ring-1 ring-success/20">
                                <FiCheckSquare className="h-2.5 w-2.5" />
                                Recommended
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <Button
                              type="button"
                              variant={isChecked ? "secondary" : "ghost"}
                              size="sm"
                              disabled={!isSelectable || isApplying}
                              onClick={() => handleToggle(row.apiFieldName)}
                              aria-pressed={isChecked}
                              className="min-h-11 gap-2 rounded-lg px-3 text-xs normal-case tracking-normal"
                            >
                              {isChecked ? (
                                <FiCheckSquare className="h-4 w-4" />
                              ) : (
                                <FiSquare className="h-4 w-4" />
                              )}
                              <span>
                                {isChecked ? "Selected" : "Select"}
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isApplying}
            className="w-full normal-case tracking-normal sm:w-auto"
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={
              selectedFields.length === 0 || isApplying || rows.length === 0
            }
            aria-busy={isApplying || undefined}
            className="w-full normal-case tracking-normal sm:w-auto"
          >
            {isApplying ? (
              <>
                <FiLoader className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" />
                Applying...
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4" />
                Apply {selectedFields.length} Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
