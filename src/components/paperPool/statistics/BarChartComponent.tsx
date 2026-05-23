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
              width={150}
              tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
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
          barSize={24}
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
