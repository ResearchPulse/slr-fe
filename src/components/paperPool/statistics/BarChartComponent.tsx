import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface BarChartComponentProps {
  data: any[];
  xKey: string;
  yKey: string;
  horizontal?: boolean;
  color?: string;
}

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
      fill="#647381"
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
  color = "var(--color-accent)",
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 44, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={!horizontal}
          horizontal={horizontal}
          stroke="#DCE4E9"
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
              tick={{ fontSize: 12, fontWeight: 600, fill: "#647381" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
          </>
        )}
        <Tooltip
          formatter={(value) => [
            `${Number(value ?? 0).toLocaleString()} papers`,
            "Records",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DCE4E9",
            boxShadow: "0 4px 8px rgb(18 35 49 / 0.08)",
          }}
          labelStyle={{ color: "#122331", fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ color: "#647381", fontSize: 12 }}
          cursor={{ fill: "#F7F9FA" }}
        />
        <Bar
          dataKey={xKey}
          fill={color}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          barSize={18}
        >
          {horizontal && (
            <LabelList
              dataKey={xKey}
              position="right"
              formatter={(value) => Number(value ?? 0).toLocaleString()}
              fill="#122331"
              fontSize={11}
              fontWeight={600}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
