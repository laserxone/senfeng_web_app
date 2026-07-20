"use client";

import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InsightType = "industry" | "city";

type CustomerInsightItem = {
  label?: string;
  name?: string;
  count?: number;
  total?: number;
};

type CustomerInsightsProps = {
  cities?: CustomerInsightItem[];
  industries?: CustomerInsightItem[];
};

export function CustomerInsights({
  cities = [],
  industries = [],
}: CustomerInsightsProps) {
  const [type, setType] = useState<InsightType>("industry");

  const selectedItems = type === "industry" ? industries : cities;
  const title =
    type === "industry"
      ? "Member Categories by Industries"
      : "Member Categories by Cities";

  const normalizedItems = useMemo(() => {
    return selectedItems
      .map((item) => ({
        label: item.label || item.name || "Unknown",
        count: Number(item.count ?? item.total ?? 0),
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [selectedItems]);

  const totalMembers = useMemo(() => getTotal(normalizedItems), [normalizedItems]);
  const topItems = normalizedItems.slice(0, 5);

  return (
    <Card className="h-full w-full overflow-hidden border border-slate-200/80 shadow-sm ring-1 ring-black/5 xl:h-[300px] p-0">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <p className="text-sm font-semibold sm:text-base">{title}</p>
            <p className="text-xs text-muted-foreground">Top 5 member groups</p>
          </div>
          <Select value={type} onValueChange={(value) => setType(value as InsightType)}>
            <SelectTrigger className="h-8 w-[130px] rounded-md text-xs">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {topItems.length ? (
          <div className="space-y-2.5">
            {topItems.map((item, index) => {
              const percent = totalMembers
                ? Math.round((item.count / totalMembers) * 100)
                : 0;

              return (
                <div
                  key={item.label}
                  className="grid grid-cols-[minmax(0,1fr)_48px_minmax(76px,110px)_38px] items-center gap-2.5"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.label}
                  </p>

                  <p className="text-right text-sm font-semibold tabular-nums">
                    {item.count}
                  </p>

                  <Progress
                    value={percent}
                    className="h-2 bg-slate-200/70 [&_[data-slot=progress-indicator]]:bg-emerald-600"
                  />

                  <p className="text-right text-xs font-medium text-muted-foreground tabular-nums">
                    {percent}%
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            No {type === "industry" ? "industry" : "city"} data found
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 pt-3">
          <p className="text-sm font-semibold text-muted-foreground">
            Total Members
          </p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {totalMembers}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getTotal(items: CustomerInsightItem[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item.count ?? item.total ?? 0);
  }, 0);
}
