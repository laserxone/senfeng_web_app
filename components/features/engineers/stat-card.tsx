"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value?: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "primary" | "success" | "warning"
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const iconStyles = {
    default: "text-primary",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  }

  return (
    <Card className="border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={cn("rounded-lg bg-secondary p-2.5", iconStyles[variant])}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {trend && (
          <div
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              trend.isPositive
                ? "bg-green-100 text-green-500"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
    </Card>
  )
}
