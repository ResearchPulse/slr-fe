import React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CountItemDto } from "../../../types/paperStatistics";

interface DistributionDonutChartProps {
  data: CountItemDto[];
  totalLabel?: string;
  itemLabel?: string;
}

const COLORS = [
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-error)",
];

const DistributionDonutChart: React.FC<DistributionDonutChartProps> = ({
  data,
  totalLabel = "Total papers",
  itemLabel = "paper",
}) => {
  const items = data.map((item, index) => ({
    ...item,
    count: Math.max(0, Number(item.count) || 0),
    color: COLORS[index % COLORS.length],
  })).sort((a, b) => b.count - a.count);
  const chartData = items.filter((item) => item.count > 0);
  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid min-h-[260px] grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(140px,0.9fr)_minmax(0,1.1fr)] sm:gap-4">
      <div className="relative mx-auto h-[210px] w-full max-w-[230px] sm:h-[240px] sm:max-w-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="var(--color-surface-white)"
              strokeWidth={2}
              animationDuration={350}
            >
              {chartData.map((item, index) => (
                <Cell
                  key={`${item.label}-${index}`}
                  fill={item.color}
                  className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const count = Number(value ?? 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const unit = count === 1 ? itemLabel : `${itemLabel}s`;
                return [`${count.toLocaleString()} ${unit} (${percentage}%)`, String(name ?? "")];
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 8px rgb(18 35 49 / 0.08)",
              }}
              itemStyle={{ color: "var(--color-text-primary)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold leading-none tabular-nums text-text-primary">
            {total.toLocaleString()}
          </span>
          <span className="mt-1.5 text-[10px] font-medium leading-tight text-text-secondary">
            {totalLabel}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col justify-center divide-y divide-border">
        {items.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const unit = item.count === 1 ? itemLabel : `${itemLabel}s`;

          return (
            <li key={`${item.label}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-text-primary">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-text-secondary">
                  {percentage}%
                </span>
              </div>
              <div className="mt-1 pl-[18px] text-xs text-text-secondary">
                <span className="font-semibold tabular-nums text-text-primary">
                  {item.count.toLocaleString()}
                </span>{" "}
                {unit}
              </div>
              <div className="ml-[18px] mt-2 h-1 overflow-hidden rounded-full bg-bg-secondary">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DistributionDonutChart;
