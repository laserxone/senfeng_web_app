"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface StatusDonutChartProps {
  data: {
    status: string;
    total: number;
  }[];
}

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

export function OrderDonutChart({ data }: StatusDonutChartProps) {
  const chartData = data.map((item) => ({
    name: item.status,
    value: Number(item.total) || 0,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const displayData = total > 0 ? chartData : [{ name: "No Orders", value: 1 }];

  return (
    <div className="relative h-full min-h-[72px] w-full min-w-[72px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius="48%"
            outerRadius="76%"
            paddingAngle={total > 0 ? 3 : 0}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {displayData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={total > 0 ? COLORS[index % COLORS.length] : "#e5e7eb"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{total}</span>
      </div>
    </div>
  );
}
