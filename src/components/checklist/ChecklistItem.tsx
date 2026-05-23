import { useState, useCallback, useId } from "react";
import Input from "../ui/Input";
import {
  FiHelpCircle,
  FiCheck,
  FiLoader,
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
    ? "bg-bg-secondary border-slate-300 border-dashed"
    : isCompleted
      ? "bg-emerald-50 border-emerald-300"
      : "bg-surface-white border-border hover:border-indigo-300";

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
        "rounded-[4px] border transition-all",
        isSubItem ? "ml-4 p-4" : "p-6",
        rowContainerClass,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Item Number + Topic */}
          <div className="flex items-baseline gap-3 mb-1">
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
                "font-semibold",
                isSubItem ? "text-base" : "text-lg",
                isEditableLeaf ? "text-text-primary" : "text-slate-800",
              )}
            >
              {template.topic}
            </h4>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2">
            {!isEditableLeaf && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-800 rounded-full">
                Structure
              </span>
            )}
            {template.isRequired && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                Required
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full items-center gap-1">
                <FiCheck className="w-3 h-3" /> Completed
              </span>
            )}
            {isReportToggleOnly && reportStatusLabel && (
              <span
                className={cn(
                  "inline-flex px-2.5 py-1 text-xs font-semibold rounded-full",
                  response?.isReported === true
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {reportStatusLabel}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onShowSample(template)}
            title="Show sample answer"
            className="p-2 rounded-[4px] hover:bg-bg-secondary text-text-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          >
            <FiHelpCircle className="w-5 h-5" />
          </button>
          {response?.pdfCoordinates && onNavigateToPdf && (
            <button
              onClick={() => onNavigateToPdf(response.pdfCoordinates!)}
              title="View in PDF"
              className="p-2 rounded-[4px] hover:bg-bg-secondary text-text-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            >
              <FiFileText className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-sm font-medium rounded-[4px] bg-bg-secondary hover:bg-bg-secondary text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
          {isEditableLeaf ? (
            <button
              onClick={handleSaveClick}
              disabled={!hasUnsavedChanges || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[4px] bg-accent text-white hover:bg-indigo-700 disabled:bg-indigo-200 disabled:text-indigo-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-slate-200 text-text-primary">
              Read-only
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div
            className={cn(
              "mt-4 mb-4 p-3 border rounded-[4px]",
              isEditableLeaf
                ? "bg-bg-primary border-border"
                : "bg-bg-secondary border-slate-300",
            )}
          >
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {template.description}
            </p>
          </div>

          {!isEditableLeaf && (
            <div className="mt-4 p-3 rounded-[4px] border border-border bg-bg-secondary">
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
                  disabled={isLoading}
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
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-[4px] border transition-colors",
                      response?.isReported === true
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "bg-surface-white border-border text-text-primary hover:border-emerald-300",
                    )}
                  >
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportStatusChange(false)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-[4px] border transition-colors",
                      response?.isReported === false
                        ? "bg-amber-100 border-amber-300 text-amber-800"
                        : "bg-surface-white border-border text-text-primary hover:border-amber-300",
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
          className="mt-3 inline-flex items-center gap-2 text-xs text-indigo-700 font-medium"
          aria-live="polite"
        >
          <FiLoader className="w-3.5 h-3.5 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;
