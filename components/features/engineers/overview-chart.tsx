"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts"

interface OverviewChartProps {
  data: {
    month: string
    total_assigned: number
    total_completed: number
    completion_rate: number
  }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
  const chartData = data.map((item) => ({
    name: item.month,
    completed: item.total_completed,
    pending: item.total_assigned - item.total_completed,
  }))

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Overview
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Completed vs Pending tasks over time
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="completedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="pendingGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#completedGradient)"
                dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#pendingGradient)"
                dot={{ fill: "#f59e0b", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#f59e0b" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
