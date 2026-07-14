"use client";

import { TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SalesTarget } from "@/lib/types";
import CircularProgress from "../circular-progress";

export default function TargetOverview({ data }: { data?: SalesTarget }) {
  const achieved = Number(data?.target_achieved || 0);
  const remaining = Number(data?.remaining_target || 0);
  const targetTotal = achieved + remaining;
  const achievement = targetTotal > 0
    ? Math.round((achieved / targetTotal) * 100)
    : achieved > 0
      ? 100
      : 0;
  const progressAchievement = Math.min(100, Math.max(0, achievement));

  return (
    <Card className="h-full w-full overflow-hidden border border-slate-200/80  shadow-sm ring-1 ring-black/5 xl:h-[300px] p-0">
      <CardContent className="grid h-full gap-4 p-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold sm:text-base">Sales Overview</p>
            <p className="text-xs text-muted-foreground">Monthly target progress</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Total Sales
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">
              {formatCurrency(achieved)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{achievement}% target achieved</span>
            </div>
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight tabular-nums">
              {achievement}%
            </p>
            <Progress
              value={progressAchievement}
              className="mt-2 h-2 bg-slate-200/70 [&_[data-slot=progress-indicator]]:bg-indigo-600"
            />
          </div>

        </div>

        <div className="flex min-h-0 flex-col items-center justify-center gap-3 pt-8">
          <CircularProgress
            className="stroke-indigo-500/25"
            labelClassName="text-xl font-bold"
            progressClassName="stroke-indigo-600"
            renderLabel={(progress) => `${progress}%`}
            showLabel
            customText={"Target Achieved"}
            size={126}
            strokeWidth={11}
            value={progressAchievement}
          />
          <div className="w-full space-y-1 rounded-md border border-slate-200/80 bg-background/70 p-2.5">
            <BreakdownRow label="Achieved" value={achieved} active />
            <BreakdownRow label="Remaining" value={remaining} />
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-3 w-3 rounded-sm ${active ? "bg-primary" : "bg-muted-foreground/30"
            }`}
        />
        <span className="truncate text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
