import { FileSpreadsheet } from "lucide-react";
import { FiFileText, FiDatabase, FiBarChart2 } from "react-icons/fi";

interface HeroNavProps {
  activeTab:
    | "library"
    | "deduplication"
    | "sources"
    | "snowballing"
    | "statistics";
  onChange: (
    tab: "library" | "deduplication" | "sources" | "snowballing" | "statistics",
  ) => void;
  isLeader?: boolean;
}

/**
 * HeroNav Component
 * A premium, hero-style navigation bar for switching between Paper Library, Deduplication, and Search Sources.
 * Features glassmorphism, smooth transitions, and matches the project's design system.
 */
export default function HeroNav({
  activeTab,
  onChange,
  isLeader = false,
}: HeroNavProps) {
  const navItems = [
    {
      id: "library" as const,
      label: "Paper Repository",
      icon: FiFileText,
    },
    {
      id: "snowballing" as const,
      label: "Snowballing",
      icon: FileSpreadsheet,
    },
    {
      id: "deduplication" as const,
      label: "Deduplication",
      icon: FiDatabase,
    },
    {
      id: "statistics" as const,
      label: "Statistics",
      icon: FiBarChart2,
    },
  ].filter((item) => {
    if (item.id === "snowballing") return isLeader;
    return true;
  });

  return (
    <nav className="w-full">
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-surface-white p-1 sm:flex sm:items-center sm:gap-2 sm:p-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                group relative flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5
                transition-colors duration-200 sm:flex-1 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-3
                ${
                  isActive
                    ? "bg-primary-light text-primary-hover"
                    : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 transition-transform duration-200 sm:h-5 sm:w-5 ${isActive ? "scale-105" : "group-hover:scale-105"}`}
              />

              <span className="min-w-0 truncate text-xs font-medium normal-case tracking-normal sm:text-sm">
                {item.label}
              </span>

            </button>
          );
        })}
      </div>
    </nav>
  );
}
