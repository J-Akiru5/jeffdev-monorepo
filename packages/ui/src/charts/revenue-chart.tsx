"use client";

/**
 * Revenue Chart Component
 * ------------------------
 * Bar chart showing monthly revenue.
 */

import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: {
    month: string;
    revenue: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "theme-light" || resolvedTheme === "light";
  const gridColor = isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.06)";
  const tickFill = isLight ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)";
  const tickStroke = isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.1)";
  const tooltipBg = isLight ? "#ffffff" : "#0a0a0a";
  const tooltipBorder = isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.1)";
  const tooltipColor = isLight ? "#0b0f14" : "#fff";

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: tickStroke }}
            axisLine={{ stroke: tickStroke }}
          />
          <YAxis
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: tickStroke }}
            axisLine={{ stroke: tickStroke }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "6px",
              color: tooltipColor,
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              "Revenue",
            ]}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
