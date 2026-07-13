"use client";

import { ArrowUpRight, CheckSquare } from "lucide-react";
import moment from "moment";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";

type MyTask = {
  task_name: string;
  created_at?: string;
  date?: string;
  status?: string;
};

export default function MyTasks({ data = [] }: { data?: MyTask[] }) {
  const { base_route } = useUserDetail();
  const openTasks = data
    .filter((task) => {
      const status = task.status?.toLowerCase();
      return !status || !["completed", "complete", "done", "closed"].includes(status);
    })
    .slice(0, 5);

  return (
    <Card className="h-full w-full overflow-hidden border border-slate-200/80 bg-gradient-to-br from-background via-slate-50 to-blue-50/25 shadow-sm ring-1 ring-black/5 xl:h-[300px] p-0">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">My Open Tasks</p>
              <p className="text-xs text-muted-foreground">Pending follow-ups</p>
            </div>
          </div>

          <Link
            href={`/${base_route}/task`}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="min-h-0 flex-1">
        {openTasks.length ? (
          <div className="h-full divide-y overflow-y-auto">
            {openTasks.map((task, index) => (
              <div
                key={`${task.task_name}-${index}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {task.task_name || "Untitled task"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(task.created_at || task.date)}
                  </p>
                </div>

                {task.status && (
                  <Badge variant="outline" className="shrink-0 rounded-md">
                    {task.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No open tasks found
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = moment(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : "-";
}
