"use client";

/**
 * Project Status Chart Component
 * -------------------------------
 * Donut chart showing project status distribution.
 */

import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface ProjectStatusChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "theme-light" || resolvedTheme === "light";
  const tooltipBg = isLight ? "#ffffff" : "#0a0a0a";
  const tooltipBorder = isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.1)";
  const tooltipColor = isLight ? "#0b0f14" : "#fff";
  const legendColor = isLight ? "rgba(11,15,20,0.75)" : "rgba(255,255,255,0.6)";

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "6px",
              color: tooltipColor,
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-sm" style={{ color: legendColor }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
