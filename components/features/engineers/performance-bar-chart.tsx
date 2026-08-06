"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceBarChartProps {
  data: {
    month: string;
    total_assigned: number;
    total_completed: number;
    completion_rate: number;
  }[];
}

export function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  const chartData = data.map((item) => ({
    name: item.month,
    rate: item.completion_rate,
  }));

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground">Monthly completion rate</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Rate"]}
              />
              <Bar
                dataKey="rate"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {(
                chartData.reduce((sum, item) => sum + item.rate, 0) /
                chartData.length
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-muted-foreground">Avg Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
