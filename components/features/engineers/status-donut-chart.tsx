"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ValueType } from "recharts/types/component/DefaultTooltipContent"

interface StatusDonutChartProps {
  data: {
    status: string
    total: number
  }[]
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"]

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.total,
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">By Status</CardTitle>
        <p className="text-xs text-muted-foreground">Complaint status distribution</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                // formatter={(value: number) => [value as ValueType, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="text-xs font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
