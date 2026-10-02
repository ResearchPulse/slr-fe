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
    <nav className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-surface-white/70 backdrop-blur-xl border border-border rounded-2xl shadow-sm px-6 py-4 flex items-center gap-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl
                transition-all duration-300 relative group
                ${
                  isActive
                    ? "bg-surface-white shadow-sm text-accent scale-[1.02]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-white/50"
                }
              `}
            >
              {/* Active Indicator Background (Subtle) */}
              {isActive && (
                <div className="absolute inset-0 bg-bg-secondary/30 rounded-xl -z-10 animate-in fade-in zoom-in-95 duration-300" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
              />

              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {item.label}
              </span>

              {/* Bottom Line Indicator */}
              <div
                className={`
                  absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent
                  transition-all duration-300
                  ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"}
                `}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
