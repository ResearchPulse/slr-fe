import { FiCheck, FiFileText, FiTarget } from "react-icons/fi";
import type { WizardSection } from "../../../../../types/templateWizard";

interface TemplateSectionNavigatorProps {
  sections: WizardSection[];
  activeSectionId: string;
  sectionFieldCounts: Record<string, number>;
  onSelect: (sectionId: string) => void;
}

function getSectionLabel(section: WizardSection) {
  return section.name.replace(/^(RQ\d+\s*:\s*)+/i, "$1");
}

export default function TemplateSectionNavigator({
  sections,
  activeSectionId,
  sectionFieldCounts,
  onSelect,
}: TemplateSectionNavigatorProps) {
  return (
    <nav className="rounded-xl border border-border bg-surface-white p-2 lg:sticky lg:top-0 lg:self-start" aria-label="Template sections">
      <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        Section navigator <span className="ml-1 font-normal">({sections.length})</span>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {sections.map((section, index) => {
          const isActive = section.id === activeSectionId;
          const fieldCount = sectionFieldCounts[section.id] ?? 0;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(section.id)}
              className={`flex min-w-[190px] flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:min-w-0 ${isActive ? "bg-primary-light text-primary" : "text-text-primary hover:bg-bg-primary"}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-surface-white" : "bg-bg-secondary text-text-secondary"}`} aria-hidden="true">
                {section.isPicoc ? <FiFileText className="h-3.5 w-3.5" /> : <FiTarget className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold" title={getSectionLabel(section)}>
                  {getSectionLabel(section)}
                </span>
                <span className={`mt-0.5 block text-[11px] ${isActive ? "text-primary/75" : "text-text-muted"}`}>
                  {section.isPicoc ? "Shared context" : section.linkedResearchQuestionId ? `RQ${index}` : "Compatible"}
                  <span aria-hidden="true"> · </span>{fieldCount} fields
                </span>
              </span>
              {fieldCount > 0 && <FiCheck className="h-4 w-4 shrink-0 text-success" aria-label="Configured" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
