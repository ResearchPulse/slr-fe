import { ArrowLeft } from "lucide-react";
import Button from "../../../../../components/ui/Button";
import {
  SectionTypeEnum,
  type ExtractionSectionDto,
} from "../../../../../types/dataExtraction";
import { getSectionId } from "./reviewerFormUtils.tsx";

interface ReviewerSidebarProps {
  sections: ExtractionSectionDto[];
  activeSectionId: string;
  selectedTemplateName: string;
  isAutoExtracting: boolean;
  isSubmittingExtraction: boolean;
  canAutoExtract: boolean;
  canSubmit: boolean;
  isReadOnly?: boolean;
  submitButtonLabel?: string;
  onAutoExtract: () => void;
  onSectionChange: (sectionId: string) => void;
  onBack: () => void;
  onSubmitExtraction: () => void;
}

export default function ReviewerSidebar({
  sections,
  activeSectionId,
  selectedTemplateName,
  isAutoExtracting,
  isSubmittingExtraction,
  canAutoExtract,
  canSubmit,
  isReadOnly = false,
  submitButtonLabel,
  onAutoExtract,
  onSectionChange,
  onBack,
  onSubmitExtraction,
}: ReviewerSidebarProps) {
  return (
    <aside className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <Button
        type="button"
        onClick={onAutoExtract}
        isLoading={isAutoExtracting}
        disabled={!canAutoExtract}
        className="mb-4 w-full rounded-xl"
      >
        ✨ Auto-Extract with AI
      </Button>

      <div className="mb-4 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-text-primary">Sections</h2>
        <p className="mt-1 truncate text-xs text-text-secondary" title={selectedTemplateName}>
          {selectedTemplateName || "Extraction Template"}
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const sectionId = getSectionId(section);
          const isActive = sectionId === activeSectionId;

          return (
            <button
              key={sectionId}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSectionChange(sectionId)}
              className={`group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                isActive
                  ? "border-primary/25 bg-blue-50/80 text-primary shadow-sm"
                  : "border-border bg-surface-white text-text-secondary hover:border-primary/25 hover:bg-bg-secondary hover:text-text-primary"
              }`}
            >
              <span className="min-w-0 truncate text-sm font-semibold">
                {section.name}
              </span>
              <span
                className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  isActive
                    ? "bg-white/80 text-primary/75"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {section.sectionType === SectionTypeEnum.MatrixGrid
                  ? "Matrix"
                  : "Flat"}
              </span>
            </button>
          );
        })}
      </div>

      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-surface-white p-3 sm:p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-full justify-start rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Button
          type="button"
          variant="success"
          className="w-full rounded-xl"
          isLoading={isSubmittingExtraction}
          disabled={!canSubmit}
          onClick={onSubmitExtraction}
        >
          {isReadOnly
            ? "Submitted (Locked)"
            : (submitButtonLabel ?? "Submit Extraction")}
        </Button>
      </div>
    </aside>
  );
}
