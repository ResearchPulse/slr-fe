// Tab navigation bar for the Identification Phase Workspace

import { FiSearch, FiGrid, FiDatabase } from "react-icons/fi";
import type { TabType } from "../types";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchExecutionCount: number;
  uniquePapersCount: number;
  hasUniquePapers: boolean;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  searchExecutionCount,
  uniquePapersCount,
  hasUniquePapers,
}: TabNavigationProps) {
  const tabClass = (tab: TabType) =>
    `flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? "border-accent text-accent bg-surface-white"
        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
    }`;

  return (
    <div className="border-b border-border bg-bg-primary">
      <nav className="flex">
        {/* Search Strategies */}
        <button
          onClick={() => onTabChange("strategies")}
          className={tabClass("strategies")}
        >
          <FiSearch className="w-4 h-4" />
          Search Strategies
          <span className="ml-1 px-2 py-0.5 bg-primary-light text-accent rounded-full text-xs font-semibold">
            {searchExecutionCount}
          </span>
        </button>

        {/* Papers Library */}
        <button
          onClick={() => onTabChange("library")}
          className={tabClass("library")}
        >
          <FiGrid className="w-4 h-4" />
          Papers Library
          <span className="ml-1 px-2 py-0.5 bg-bg-secondary text-text-primary rounded-full text-xs">
            {hasUniquePapers ? uniquePapersCount.toLocaleString() : "--"}
          </span>
        </button>

        {/* Build Dataset */}
        <button
          onClick={() => onTabChange("dataset")}
          className={tabClass("dataset")}
        >
          <FiDatabase className="w-4 h-4" />
          Build Dataset
        </button>
      </nav>
    </div>
  );
}
