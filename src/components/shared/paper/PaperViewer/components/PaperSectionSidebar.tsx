import { cn } from "../../../../../utils/cn";
import { type ParsedSectionDto } from "../../../../../types/paper";

export interface PaperSectionSidebarProps {
  sections: ParsedSectionDto[] | null;
  activeSection: string | null;
  onSectionClick: (sectionKey: string) => void;
  width?: number;
}

/**
 * Dynamic Paper Section Sidebar
 * Renders sections parsed from the full-text PDF for quick navigation.
 */
export function PaperSectionSidebar({
  sections,
  activeSection,
  onSectionClick,
  width = 200,
}: PaperSectionSidebarProps) {
  const displaySections = sections || [];

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-bg-secondary motion-safe:animate-in motion-safe:slide-in-from-left-1 motion-safe:duration-150 motion-reduce:animate-none"
    >
      <div className="p-4 border-b border-border bg-surface-white/50">
        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
          Sections
        </h3>
      </div>

      <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {displaySections.length > 0 ? (
          displaySections.map((section) => {
            const isActive = activeSection === section.sectionTitle;

            return (
              <button
                key={`${section.sectionTitle}-${section.order}`}
                onClick={() => onSectionClick(section.sectionTitle)}
                className={cn(
                  "min-h-11 w-full rounded-xl px-3 py-2 text-left transition-colors duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none",
                  "text-xs font-bold uppercase tracking-tight",
                  isActive
                    ? "bg-primary-light text-accent shadow-none"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{section.sectionTitle}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)] shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest leading-loose">
              No sections detected
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-surface-white/30">
        <p className="text-[9px] text-text-secondary leading-tight font-medium">
          Structured Reading Mode
        </p>
      </div>
    </div>
  );
}
