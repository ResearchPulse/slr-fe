import React from "react";
import { cn } from "../../utils/cn";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { ChecklistSection, SectionProgress } from "../../types/checklist";

interface SectionSidebarProps {
  sections: SectionProgress[];
  activeSection: string;
  onSectionClick: (section: ChecklistSection) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

/**
 * Left sidebar showing all sections with progress indicators
 * Allows users to jump to specific sections
 */
const SectionSidebar: React.FC<SectionSidebarProps> = ({
  sections,
  activeSection,
  onSectionClick,
  isCollapsed = false,
  onToggleCollapse,
  className,
}) => {
  const totalCompletedItems = sections.reduce(
    (sum, section) => sum + section.completedItems,
    0,
  );
  const totalItems = sections.reduce(
    (sum, section) => sum + section.totalItems,
    0,
  );
  const totalProgress =
    totalItems > 0 ? Math.round((totalCompletedItems / totalItems) * 100) : 0;

  return (
    <aside
      className={cn(
        "relative z-30 flex h-screen flex-col border-r border-border bg-surface-white ",
        isCollapsed ? "w-20" : "w-64",
        className,
      )}
    >
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-4 top-8 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary shadow-none shadow-slate-200/50  hover:border-indigo-200 hover:text-accent active:scale-90"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <FiChevronRight size={16} />
          ) : (
            <FiChevronLeft size={16} />
          )}
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {!isCollapsed && (
          <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-text-secondary">
            Sections
          </h3>
        )}

        {(sections ?? []).map((section) => {
          const isActive = activeSection === section.section;
          const percentage = section.completionPercentage;
          const isComplete = percentage === 100;

          return (
            <button
              key={section.section}
              onClick={() => onSectionClick(section.section)}
              title={isCollapsed ? section.displayName : undefined}
              className={cn(
                "group relative flex w-full items-center overflow-hidden rounded-[4px] border text-left transition-all",
                isCollapsed
                  ? "h-14 justify-center px-2"
                  : "justify-between px-3 py-2.5",
                isActive
                  ? "border-indigo-300 bg-bg-secondary"
                  : "border-transparent hover:border-border hover:bg-bg-primary",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
              )}

              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 ",
                  isCollapsed ? "justify-center" : "justify-between",
                )}
              >
                <div
                  className={cn(
                    "min-w-0 ",
                    isCollapsed
                      ? "w-0 -translate-x-3 invisible opacity-0"
                      : "visible translate-x-0 opacity-100",
                  )}
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isActive
                        ? "text-indigo-900"
                        : "text-text-primary group-hover:text-text-primary",
                    )}
                  >
                    {section.displayName}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {section.completedItems} of {section.totalItems} items
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary text-xs font-semibold",
                      isCollapsed && "bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        isComplete ? "text-emerald-600" : "text-accent",
                      )}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {!isCollapsed && isActive && (
                    <FiChevronRight className="h-4 w-4 text-accent" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-border bg-bg-primary px-4 py-3",
          isCollapsed && "px-3",
        )}
      >
        <div
          className={cn(
            "space-y-2 text-xs text-text-secondary ",
            isCollapsed
              ? "h-0 invisible overflow-hidden opacity-0"
              : "h-auto visible opacity-100",
          )}
        >
          <div className="flex justify-between gap-3">
            <span>Total Progress:</span>
            <span className="font-semibold text-text-primary">
              {totalProgress}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Items Done:</span>
            <span className="font-semibold text-text-primary">
              {totalCompletedItems}/{totalItems}
            </span>
          </div>
        </div>

        {isCollapsed && (
          <div className="flex justify-center">
            <div className="rounded-full bg-surface-white px-2 py-1 text-[10px] font-semibold text-text-secondary shadow-none ring-1 ring-gray-200">
              {totalProgress}%
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SectionSidebar;
