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
      className="bg-slate-50 border-r border-slate-100 flex flex-col h-full animate-in slide-in-from-left duration-300 shrink-0 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 bg-white/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
                  "w-full text-left px-3 py-2 rounded-xl transition-all duration-200 group",
                  "text-xs font-bold uppercase tracking-tight",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{section.sectionTitle}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)] shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
              No sections detected
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white/30">
        <p className="text-[9px] text-slate-400 leading-tight font-medium">
          Structured Reading Mode
        </p>
      </div>
    </div>
  );
}
