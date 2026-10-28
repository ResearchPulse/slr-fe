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
    <nav aria-label="Paper repository sections" className="w-full border-b border-border">
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full items-stretch gap-5 sm:gap-7">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`group inline-flex min-h-10 shrink-0 items-center justify-start gap-2 px-1 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 motion-reduce:transition-none ${
                  isActive
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 transition-colors duration-150 ease-out motion-reduce:transition-none"
                />

                <span className="relative truncate">
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-2 h-0.5 origin-left rounded-full bg-accent transition-transform duration-200 ease-out motion-reduce:transition-none ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
