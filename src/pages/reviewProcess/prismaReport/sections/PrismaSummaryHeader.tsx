// PRISMA Summary Header — Top summary cards showing key metrics

import {
  FiDatabase,
  FiCopy,
  FiFilter,
  FiCheckCircle,
} from "react-icons/fi";
import type { PrismaSummaryStats } from "../../../../types/prismaReport";
import { SUMMARY_CARDS } from "../constants";

interface PrismaSummaryHeaderProps {
  stats: PrismaSummaryStats;
  isLoading: boolean;
  generatedAt?: string | null;
}

const CARD_ICONS: Record<string, React.ReactNode> = {
  totalIdentified: <FiDatabase className="w-5 h-5" />,
  duplicatesRemoved: <FiCopy className="w-5 h-5" />,
  recordsScreened: <FiFilter className="w-5 h-5" />,
  studiesIncluded: <FiCheckCircle className="w-5 h-5" />,
};

const COLOR_MAP: Record<string, { icon: string; value: string }> =
  {
    indigo: {
      icon: "text-primary",
      value: "text-text-primary",
    },
    orange: {
      icon: "text-amber-600",
      value: "text-text-primary",
    },
    blue: {
      icon: "text-primary",
      value: "text-text-primary",
    },
    green: {
      icon: "text-green-700",
      value: "text-text-primary",
    },
  };

function SkeletonCard() {
  return (
    <div className="px-5 py-4 animate-pulse">
      <div className="h-7 w-12 bg-bg-secondary rounded mb-2" />
      <div className="h-4 w-28 bg-bg-secondary rounded mb-2" />
      <div className="h-3 w-32 bg-bg-secondary rounded" />
    </div>
  );
}

export default function PrismaSummaryHeader({
  stats,
  isLoading,
  generatedAt,
}: PrismaSummaryHeaderProps) {
  return (
    <section aria-label="Report overview">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-base font-semibold text-text-primary">Report Overview</h2>
        {generatedAt && (
          <p className="text-xs text-text-secondary">
            Snapshot ·{" "}
            {new Date(generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-surface-white p-2 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : SUMMARY_CARDS.map((card) => {
              const colors = COLOR_MAP[card.colorScheme];
              const value = stats[card.key];
              return (
                <div
                  key={card.key}
                  className="relative min-h-[112px] rounded-xl bg-bg-primary/65 p-4 sm:px-5 sm:py-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-white ${colors.icon}`}>
                      {CARD_ICONS[card.key]}
                    </span>
                    <div className={`text-2xl sm:text-[28px] leading-8 font-semibold ${colors.value} tabular-nums`}>
                      {value.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {card.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {card.description}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
