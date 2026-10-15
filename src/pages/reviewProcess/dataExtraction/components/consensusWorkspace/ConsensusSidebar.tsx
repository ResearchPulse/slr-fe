import { FiCheck, FiFileText, FiTarget } from "react-icons/fi";
import type { ConsensusSectionDto } from "../../../../../types/dataExtraction";

interface ConsensusSidebarProps {
  sections: ConsensusSectionDto[];
  activeSectionId: string;
  totalConflictCount: number;
  getSectionConflictCount: (section: ConsensusSectionDto) => number;
  onSectionChange: (sectionId: string) => void;
}

export default function ConsensusSidebar({
  sections,
  activeSectionId,
  totalConflictCount,
  getSectionConflictCount,
  onSectionChange,
}: ConsensusSidebarProps) {
  return (
    <aside className="w-[260px] xl:w-[280px] shrink-0 flex flex-col justify-between border-r border-border bg-surface-white p-3 overflow-y-auto">
      <div className="space-y-2">
        <div className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          Section Navigator <span className="ml-1 font-normal">({sections.length})</span>
        </div>

        <div className="flex flex-col gap-1">
          {sections.map((section, index) => {
            const sectionConflictCount = getSectionConflictCount(section);
            const isActive = section.sectionId === activeSectionId;
            const isResolved = sectionConflictCount === 0;

            return (
              <button
                key={section.sectionId}
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSectionChange(section.sectionId)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-primary hover:bg-bg-primary"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    isActive
                      ? "bg-surface-white shadow-xs text-primary"
                      : "bg-bg-secondary text-text-secondary"
                  }`}
                  aria-hidden="true"
                >
                  {index === 0 ? (
                    <FiFileText className="h-3.5 w-3.5" />
                  ) : (
                    <FiTarget className="h-3.5 w-3.5" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold" title={section.name}>
                    {section.name}
                  </span>
                  <span
                    className={`mt-0.5 block text-[11px] ${
                      isActive ? "text-primary/75" : "text-text-muted"
                    }`}
                  >
                    {isResolved ? "Compatible" : `${sectionConflictCount} conflicts`}
                    <span aria-hidden="true"> · </span>
                    {section.fields.length} fields
                  </span>
                </span>

                {isResolved ? (
                  <FiCheck className="h-4 w-4 shrink-0 text-success" aria-label="Resolved" />
                ) : (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-700">
                    {sectionConflictCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3 px-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-secondary">
            Remaining conflicts
          </span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              totalConflictCount === 0
                ? "text-emerald-600"
                : "text-amber-600"
            }`}
          >
            {totalConflictCount === 0 ? (
              <>
                <FiCheck className="h-3.5 w-3.5" />
                All resolved
              </>
            ) : (
              `${totalConflictCount} left`
            )}
          </span>
        </div>
      </div>
    </aside>
  );
}
