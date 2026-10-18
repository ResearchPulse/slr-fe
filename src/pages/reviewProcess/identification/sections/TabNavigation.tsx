import type { KeyboardEvent } from "react";
import { FiDatabase, FiGrid, FiSearch, FiUpload } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { TabType } from "../types";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchExecutionCount: number;
  uniquePapersCount: number;
  hasUniquePapers: boolean;
}

const TABS: { id: TabType; label: string; icon: IconType }[] = [
  { id: "strategies", label: "Search Strategies", icon: FiSearch },
  { id: "imports", label: "Imports", icon: FiUpload },
  { id: "library", label: "Papers Library", icon: FiGrid },
  { id: "searches", label: "Searches", icon: FiSearch },
  { id: "dataset", label: "Build Dataset", icon: FiDatabase },
];

export default function TabNavigation({
  activeTab,
  onTabChange,
  searchExecutionCount,
  uniquePapersCount,
  hasUniquePapers,
}: TabNavigationProps) {
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: TabType,
  ) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + TABS.length) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TABS.length - 1
              : -1;

    if (nextIndex < 0) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex].id;
    onTabChange(nextTab);
    requestAnimationFrame(() =>
      document.getElementById(`identification-tab-${nextTab}`)?.focus(),
    );
  };

  return (
    <div className="max-w-full overflow-x-auto border-b border-border bg-bg-secondary/60">
      <nav
        className="flex min-w-max"
        role="tablist"
        aria-label="Identification sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isSelected = activeTab === id;
          const count =
            id === "strategies"
              ? searchExecutionCount
              : id === "library"
                ? hasUniquePapers
                  ? uniquePapersCount.toLocaleString()
                  : "--"
                : null;

          return (
            <button
              key={id}
              type="button"
              id={`identification-tab-${id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls="identification-panel"
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, id)}
              onClick={() => onTabChange(id)}
              className={`flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:px-5 ${
                isSelected
                  ? "border-accent bg-surface-white text-text-primary"
                  : "border-transparent text-text-secondary hover:bg-surface-white/70 hover:text-text-primary"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isSelected ? "text-accent" : "text-text-secondary"}`}
                aria-hidden="true"
              />
              {label}
              {count !== null && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    id === "strategies"
                      ? "bg-primary-light text-accent"
                      : "bg-bg-secondary text-text-primary"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
