import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Sigma,
  Sparkles,
} from "lucide-react";
import type { SourceDataGroupDto } from "../../../types/synthesisExecution";

type ChartView = "bar" | "pie";

interface ChartCategory {
  name: string;
  count: number;
}

interface DescriptiveChartsWorkspaceProps {
  sourceDataGroups: SourceDataGroupDto[];
  filterHighQualityOnly?: boolean;
}

const PIE_COLORS = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#6366f1",
  "#4f46e5",
  "#0f766e",
  "#0891b2",
  "#7c3aed",
];

function isChartFriendlyGroup(group: SourceDataGroupDto): boolean {
  if (group.values.length === 0) {
    return false;
  }

  if (
    group.values.some(
      (value) =>
        value.optionId ||
        value.booleanValue !== null ||
        value.numericValue !== null,
    )
  ) {
    return true;
  }

  const averageLength =
    group.values.reduce(
      (total, value) => total + value.displayValue.trim().length,
      0,
    ) / group.values.length;
  return averageLength <= 80;
}

export default function DescriptiveChartsWorkspace({
  sourceDataGroups,
  filterHighQualityOnly = false,
}: DescriptiveChartsWorkspaceProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [chartView, setChartView] = useState<ChartView>("bar");

  const chartableGroups = useMemo(() => {
    const baseGroups = sourceDataGroups.map((g) => ({
      ...g,
      values: filterHighQualityOnly
        ? g.values.filter((v) => v.isHighQuality)
        : g.values,
    }));

    const filteredGroups = baseGroups.filter(isChartFriendlyGroup);
    if (filteredGroups.length > 0) {
      return filteredGroups;
    }

    return baseGroups.filter((group) => group.values.length > 0);
  }, [sourceDataGroups, filterHighQualityOnly]);

  const resolvedSelectedFieldId = useMemo(() => {
    const hasSelectedField = chartableGroups.some(
      (group) => group.fieldId === selectedFieldId,
    );
    if (hasSelectedField) {
      return selectedFieldId;
    }

    return chartableGroups[0]?.fieldId ?? "";
  }, [chartableGroups, selectedFieldId]);

  const selectedGroup = useMemo(() => {
    if (chartableGroups.length === 0) {
      return null;
    }

    return (
      chartableGroups.find(
        (group) => group.fieldId === resolvedSelectedFieldId,
      ) ?? chartableGroups[0]
    );
  }, [chartableGroups, resolvedSelectedFieldId]);

  const chartData = useMemo<ChartCategory[]>(() => {
    if (!selectedGroup) {
      return [];
    }

    const valuesForAggregation = selectedGroup.values.filter((value) =>
      filterHighQualityOnly ? value.isHighQuality : true,
    );

    const counts = new Map<string, number>();

    for (const value of valuesForAggregation) {
      const key = value.displayValue.trim() || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.name.localeCompare(right.name),
      );
  }, [selectedGroup, filterHighQualityOnly]);

  const topCategory = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    return chartData[0];
  }, [chartData]);

  const totalStudies = useMemo(() => {
    return chartData.reduce((total, category) => total + category.count, 0);
  }, [chartData]);

  const hasChartData = chartData.length > 0;
  const useHorizontalColumns = chartData.length <= 5;
  const barLayout = useHorizontalColumns ? "horizontal" : "vertical";

  return (
    <div className="space-y-5">
      {filterHighQualityOnly ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">
          Showing results for High Quality studies only (Sensitivity Analysis
          active).
        </div>
      ) : null}
      <section className="rounded-2xl border border-border/80 bg-surface-white px-6 py-5 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              Study profile
            </p>
            <h2 className="mt-1.5 text-xl font-semibold text-text-primary">
              Descriptive Charts
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-text-secondary">
              Explore extracted study characteristics before synthesis coding.
            </p>
          </div>

          <div className="flex items-center divide-x divide-border rounded-xl bg-bg-primary/70 px-1 py-2">
            <div className="px-4">
              <p className="text-xs text-text-secondary">Fields</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {chartableGroups.length}
              </p>
            </div>
            <div className="px-4">
              <p className="text-xs text-text-secondary">Studies</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {totalStudies}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border/80 bg-surface-white p-5 shadow-sm shadow-slate-200/30">
          <div className="space-y-5">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-text-primary"
                  htmlFor="chart-field-select"
                >
                  Chart field
                </label>
                <span className="text-xs text-text-secondary">
                  {chartableGroups.length} available
                </span>
              </div>
              <select
                id="chart-field-select"
                value={resolvedSelectedFieldId}
                onChange={(event) => setSelectedFieldId(event.target.value)}
                disabled={chartableGroups.length === 0}
                className="w-full rounded-xl border border-border bg-bg-primary/50 px-3.5 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-bg-primary"
              >
                {chartableGroups.length === 0 ? (
                  <option value="">No chartable fields available</option>
                ) : null}
                {chartableGroups.map((group) => (
                  <option key={group.fieldId} value={group.fieldId}>
                    {group.fieldName} ({group.values.length})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                View Mode
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg-primary p-1">
                <button
                  type="button"
                  onClick={() => setChartView("bar")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    chartView === "bar"
                      ? "bg-surface-white text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Bar
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("pie")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    chartView === "pie"
                      ? "bg-surface-white text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <PieChartIcon className="h-4 w-4" />
                  Pie
                </button>
              </div>
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Leading category
                </span>
              </div>
              <p className="mt-2.5 text-base font-semibold text-text-primary">
                {topCategory ? topCategory.name : "No chart data"}
              </p>
              <p className="mt-1 text-sm leading-5 text-text-secondary">
                {topCategory
                  ? `${topCategory.count} studies are represented in the leading category for ${selectedGroup?.fieldName ?? "this field"}.`
                  : "Select a field with categorical values to generate a summary."}
              </p>
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Sigma className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Field detail
                </span>
              </div>
              <p className="mt-2.5 text-sm font-medium text-text-primary">
                {selectedGroup?.fieldName ?? "No field selected"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedGroup
                  ? `${selectedGroup.values.length} extracted values available for aggregation.`
                  : "No extracted values were found."}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-border/80 bg-surface-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Distribution
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedGroup
                  ? `Aggregated by ${selectedGroup.fieldName}`
                  : "Choose a field to see its distribution."}
              </p>
            </div>

            <span className="rounded-full bg-bg-primary px-3 py-1.5 text-xs font-medium text-text-secondary">
              {chartView === "bar" ? "Bar chart" : "Pie chart"}
            </span>
          </div>

          {hasChartData && selectedGroup ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
              <div className="h-[380px] rounded-xl bg-bg-primary/70 p-3 sm:p-4">
                <ResponsiveContainer
                  key={resolvedSelectedFieldId}
                  width="100%"
                  height="100%"
                >
                  {chartView === "bar" ? (
                    <BarChart
                      data={chartData}
                      layout={barLayout}
                      margin={
                        useHorizontalColumns
                          ? { top: 16, right: 16, bottom: 8, left: 16 }
                          : { top: 8, right: 24, bottom: 8, left: 16 }
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={!useHorizontalColumns}
                        horizontal={useHorizontalColumns}
                      />
                      {useHorizontalColumns ? (
                        <>
                          <XAxis
                            type="category"
                            dataKey="name"
                            interval={0}
                            stroke="#94a3b8"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <YAxis
                            type="number"
                            allowDecimals={false}
                            stroke="#94a3b8"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                        </>
                      ) : (
                        <>
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            stroke="#94a3b8"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={140}
                            stroke="#94a3b8"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                        </>
                      )}
                      <Tooltip
                        cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Studies"
                        fill="#2563eb"
                        radius={
                          useHorizontalColumns ? [12, 12, 0, 0] : [0, 12, 12, 0]
                        }
                        maxBarSize={48}
                      />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        labelLine={false}
                        label={(entry: any) =>
                          `${Math.round(entry.percent * 100)}%`
                        }
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-bg-primary/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Summary
                  </p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    Top {selectedGroup?.fieldName ?? "field"}:{" "}
                    <span className="font-semibold text-text-primary">
                      {topCategory?.name}
                    </span>{" "}
                    with{" "}
                    <span className="font-semibold text-text-primary">
                      {topCategory?.count ?? 0}
                    </span>{" "}
                    studies.
                  </p>
                </div>

                <div className="rounded-xl bg-bg-primary/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Method note
                  </p>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    Values are grouped by display label so the chart reflects
                    the number of studies contributing each category.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-primary/60 px-6 py-10 text-center">
              <div className="max-w-md">
                <BarChart3 className="mx-auto h-10 w-10 text-text-secondary" />
                <p className="mt-4 text-sm font-medium text-text-primary">
                  No chart data available for the selected field.
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Try another field from the dropdown. Long-form narrative
                  fields are hidden from the chart list when possible.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
