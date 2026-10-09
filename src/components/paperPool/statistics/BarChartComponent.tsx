import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarChartComponentProps {
  data: any[];
  xKey: string;
  yKey: string;
  horizontal?: boolean;
  color?: string;
}

const COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

function wrapLabel(value: string, maxLength = 22) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, maxLength));
      current = "";
    }
  }

  if (current) lines.push(current);
  if (lines.length <= 2) return lines;

  return [lines[0], `${lines.slice(1).join(" ").slice(0, maxLength - 1)}…`];
}

function CategoryTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const lines = wrapLabel(String(payload?.value ?? ""));
  const textX = x ?? 0;
  const textY = y ?? 0;

  return (
    <text
      x={textX}
      y={textY}
      textAnchor="end"
      fill="#64748b"
      fontSize={11}
      fontWeight={500}
    >
      {lines.map((line, index) => (
        <tspan
          key={`${line}-${index}`}
          x={textX}
          dy={lines.length === 1 ? 4 : index === 0 ? -5 : 12}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  xKey,
  yKey,
  horizontal = false,
  color = "#3b82f6",
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={!horizontal}
          horizontal={horizontal}
          stroke="#f1f5f9"
        />
        {horizontal ? (
          <>
            <XAxis type="number" hide />
            <YAxis
              dataKey={yKey}
              type="category"
              width={190}
              tick={<CategoryTick />}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
          </>
        )}
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar
          dataKey={xKey}
          fill={color}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          barSize={18}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
