import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineChartComponentProps {
  data: any[];
  xKey: string;
  yKey: string;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  xKey,
  yKey,
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0071BC" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#0071BC" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#DCE4E9"
        />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontWeight: 500, fill: "#647381" }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontWeight: 500, fill: "#647381" }}
        />
        <Tooltip
          formatter={(value) => [
            `${Number(value ?? 0).toLocaleString()} papers`,
            "Records",
          ]}
          labelFormatter={(label) => `Year ${label}`}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #DCE4E9",
            boxShadow: "0 4px 8px rgb(18 35 49 / 0.08)",
          }}
          labelStyle={{ color: "#122331", fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ color: "#647381", fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke="#0071BC"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorCount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
