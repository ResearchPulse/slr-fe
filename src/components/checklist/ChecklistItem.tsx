import { useState, useCallback, useId } from "react";
import Input from "../ui/Input";
import LoadingSpinner from "../ui/LoadingSpinner";
import {
  FiHelpCircle,
  FiCheck,
  FiSave,
  FiFileText,
} from "react-icons/fi";
import { cn } from "../../utils/cn";
import type {
  ChecklistItemTemplate,
  ChecklistItemResponse,
} from "../../types/checklist";

interface ChecklistItemProps {
  template: ChecklistItemTemplate;
  response?: ChecklistItemResponse;
  onUpdate: (
    itemTemplateId: string,
    updates: Partial<ChecklistItemResponse>,
  ) => void;
  onSaveItem: (itemTemplateId: string) => Promise<void>;
  onShowSample: (template: ChecklistItemTemplate) => void;
  onNavigateToPdf?: (coordinate: string) => void;
  isSubItem?: boolean;
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
  /** The response can be read but not changed */
  isReadOnly?: boolean;
}

/**
 * Reusable component for a single checklist item with location or report-status response controls.
 */
const ChecklistItem: React.FC<ChecklistItemProps> = ({
  template,
  response,
  onUpdate,
  onSaveItem,
  onShowSample,
  onNavigateToPdf,
  isSubItem = false,
  hasUnsavedChanges = false,
  isLoading = false,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const locationFieldId = useId();
  const reportFieldId = useId();

  const locationValue = response?.reportLocation ?? "";
  const isEditableLeaf = !!template.canRespond && !template.hasChildren;
  const isReportToggleOnly =
    isEditableLeaf &&
    template.hasLocationField === false &&
    template.isSectionHeaderOnly === false;
  const reportStatusLabel =
    response?.isReported === true
      ? "Reported"
      : response?.isReported === false
        ? "Not Reported"
        : null;

  const isCompleted = response?.isCompleted ?? false;

  const rowContainerClass = !isEditableLeaf
    ? "bg-bg-secondary border-border border-dashed"
    : isCompleted
      ? "bg-success/10 border-success/30"
      : "bg-surface-white border-border hover:border-accent";

  const handleSaveClick = useCallback(() => {
    if (!isEditableLeaf) return;
    void onSaveItem(template.id);
  }, [isEditableLeaf, onSaveItem, template.id]);

  const handleLocationChange = useCallback(
    (newLocation: string) => {
      if (!isEditableLeaf) return;
      onUpdate(template.id, {
        reportLocation: newLocation,
      });
    },
    [isEditableLeaf, onUpdate, template.id],
  );

  const handleReportStatusChange = useCallback(
    (isReported: boolean) => {
      if (!isReportToggleOnly) return;
      onUpdate(template.id, {
        isReported,
      });
    },
    [isReportToggleOnly, onUpdate, template.id],
  );

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors duration-150 motion-reduce:transition-none",
        isSubItem ? "ml-4 p-4" : "p-4 sm:p-6",
        rowContainerClass,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 max-[360px]:min-w-40">
          {/* Item Number + Topic */}
            <div className="flex min-w-0 items-baseline gap-3 mb-1">
            <span
              className={cn(
                "text-sm font-bold min-w-fit",
                isEditableLeaf ? "text-accent" : "text-text-secondary",
              )}
            >
              {template.itemNumber}
            </span>
            <h4
              className={cn(
                "min-w-0 font-semibold",
                isSubItem ? "text-base" : "text-lg",
                "text-text-primary",
              )}
            >
              {template.topic}
            </h4>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2">
            {!isEditableLeaf && (
              <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-1 text-xs font-semibold text-text-secondary">
                Structure
              </span>
            )}
            {template.isRequired && (
              <span className="inline-flex items-center rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
                Required
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <FiCheck className="w-3 h-3" /> Completed
              </span>
            )}
            {isReportToggleOnly && reportStatusLabel && (
              <span
                className={cn(
                  "inline-flex px-2.5 py-1 text-xs font-semibold rounded-full",
                  response?.isReported === true
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning",
                )}
              >
                {reportStatusLabel}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={() => onShowSample(template)}
            title="Show sample answer"
            aria-label="Show sample answer"
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-secondary text-text-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
          >
            <FiHelpCircle className="w-5 h-5" />
          </button>
          {response?.pdfCoordinates && onNavigateToPdf && (
            <button
              onClick={() => onNavigateToPdf(response.pdfCoordinates!)}
              title="View in PDF"
              aria-label="View in PDF"
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-secondary text-text-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            >
              <FiFileText className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-11 px-3 text-sm font-medium rounded-xl bg-bg-secondary hover:bg-bg-secondary text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
          {isEditableLeaf ? (
            <button
              onClick={handleSaveClick}
              disabled={isReadOnly || !hasUnsavedChanges || isLoading}
              className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-medium rounded-xl bg-accent text-white hover:bg-primary-hover disabled:bg-accent/40 disabled:text-white disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
          ) : (
            <span className="inline-flex items-center rounded-xl bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-primary">
              Read-only
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div
            className={cn(
              "mt-4 mb-4 p-3 border rounded-xl",
              isEditableLeaf
                ? "bg-bg-primary border-border"
                : "bg-bg-secondary border-border",
            )}
          >
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {template.description}
            </p>
          </div>

          {!isEditableLeaf && (
            <div className="mt-4 p-3 rounded-xl border border-border bg-bg-secondary">
              <p className="text-sm text-text-primary font-medium">
                Read-only item
              </p>
              <p className="text-xs text-text-secondary mt-1">
                (Grouping item - fill sub-items below)
              </p>
            </div>
          )}

          {isEditableLeaf && template.hasLocationField !== false && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor={locationFieldId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Location Where Item is Reported
                </label>
                <Input
                  id={locationFieldId}
                  placeholder="e.g., Section 4, Page 5 or Line 120-135"
                  value={locationValue}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  disabled={isLoading || isReadOnly}
                  className="text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Changes are local until you click Save.
                </p>
              </div>
            </div>
          )}

          {isReportToggleOnly && (
            <div className="mt-4 space-y-3">
              <fieldset>
                <legend
                  id={reportFieldId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Reporting Status
                </legend>
                <div
                  className="flex flex-wrap gap-2"
                  aria-labelledby={reportFieldId}
                >
                  <button
                    type="button"
                    onClick={() => handleReportStatusChange(true)}
                    disabled={isLoading || isReadOnly}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                      response?.isReported === true
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-surface-white text-text-primary hover:border-success/30",
                    )}
                  >
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportStatusChange(false)}
                    disabled={isLoading || isReadOnly}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                      response?.isReported === false
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-border bg-surface-white text-text-primary hover:border-warning/30",
                    )}
                  >
                    Not Report
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Changes are local until you click Save.
                </p>
              </fieldset>
            </div>
          )}
        </>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div
          className="mt-3 inline-flex items-center gap-2 text-xs text-accent font-medium"
          aria-live="polite"
        >
          <LoadingSpinner size="sm" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;
