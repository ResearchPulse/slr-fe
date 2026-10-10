// PRISMA Exclusion Table — Breakdown of exclusion reasons across stages

import { FiInfo } from "react-icons/fi";
import type {
  PrismaNodeResponse,
  PrismaStage,
} from "../../../../types/prismaReport";

interface PrismaExclusionTableProps {
  nodes: PrismaNodeResponse[];
  isLoading: boolean;
}

/** Derive exclusion-related rows from flow nodes */
function buildExclusionRows(
  nodes: PrismaNodeResponse[],
): { reason: string; count: number; percentage: string }[] {
  const exclusionStages: { stage: PrismaStage; reason: string }[] = [
    {
      stage: "DuplicateRecordsRemoved",
      reason: "Records removed prior to screening",
    },
    {
      stage: "RecordsExcluded",
      reason: "Records excluded during screening (title/abstract)",
    },
    {
      stage: "ReportsNotRetrieved",
      reason: "Reports not retrieved (full-text unavailable)",
    },
    {
      stage: "ReportsExcluded",
      reason: "Reports excluded after eligibility assessment",
    },
  ];

  const totalIdentified =
    nodes.find((n) => n.stage === "RecordsIdentified")?.total ?? 1;

  const getCount = (stage: PrismaStage): number => {
    const node = nodes.find((n) => n.stage === stage);
    if (node) return node.total;
    const sideNode = nodes.find((n) => n.sideBox?.stage === stage);
    return sideNode?.sideBox?.total ?? 0;
  };

  return exclusionStages.map(({ stage, reason }) => {
    const count = getCount(stage);
    return {
      reason,
      count,
      percentage: ((count / Math.max(1, totalIdentified)) * 100).toFixed(2),
    };
  });
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-48 bg-bg-secondary rounded" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="h-4 w-12 bg-bg-secondary rounded ml-auto" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="h-4 w-16 bg-bg-secondary rounded ml-auto" />
      </td>
    </tr>
  );
}

export default function PrismaExclusionTable({
  nodes,
  isLoading,
}: PrismaExclusionTableProps) {
  const rows = isLoading ? [] : buildExclusionRows(nodes);
  const totalExcluded = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section aria-label="Exclusion reasons breakdown">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-text-primary">
          Exclusion Breakdown
        </h3>
        <div className="group relative" tabIndex={0} aria-label="About exclusion percentages">
          <FiInfo className="w-4 h-4 text-text-secondary cursor-help" aria-hidden="true" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-none z-10">
            Breakdown of records removed at each stage of the PRISMA flow.
            Percentages are relative to total records identified.
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-bg-primary/60">
              <th className="px-2 py-2 text-left font-medium text-text-secondary text-xs">
                Reason
              </th>
              <th className="px-2 py-2 text-right font-medium text-text-secondary text-xs">
                Count
              </th>
              <th className="px-2 py-2 text-right font-medium text-text-secondary text-xs">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-text-secondary text-sm"
                >
                  No exclusion data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.reason}
                  className="hover:bg-primary-light/40 transition-colors"
                >
                  <td className="px-2 py-2.5 text-text-primary">{row.reason}</td>
                  <td className="px-2 py-2.5 text-right font-medium text-text-primary tabular-nums">
                    {row.count.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-secondary tabular-nums">
                    {row.percentage}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border/60 bg-bg-primary/45">
                <td className="px-2 py-2.5 font-semibold text-text-primary text-sm">
                  Total Excluded
                </td>
                <td className="px-2 py-2.5 text-right font-bold text-text-primary tabular-nums">
                  {totalExcluded.toLocaleString()}
                </td>
                <td className="px-2 py-2.5 text-right text-text-secondary font-medium tabular-nums">
                  {(
                    (totalExcluded /
                      (nodes.find((n) => n.stage === "RecordsIdentified")
                        ?.total ?? 1)) *
                    100
                  ).toFixed(2)}
                  %
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
