"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import RecentQuotations from "@/components/features/sales/recent-quotations";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useUserDetail from "@/hooks/use-user-detail";
import formatCurrency from "@/lib/formatCurrency";
import {
  AdminDashboardRecentSales,
  AdminTeamProgress,
  AdminTeamTasks,
  QuotationData,
} from "@/lib/types";
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  Factory,
  Gauge,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

type Props = {
  team: AdminTeamProgress[];
  tasks: AdminTeamTasks[];
  feedback: { month: string; satisfactory: number; unsatisfactory: string }[];
  industries: { customer_count: string; industry: string }[];
  recentSales: AdminDashboardRecentSales[];
  recentQuotations: QuotationData[];
};

const percentage = (value: number, total: number) =>
  total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ExecutiveCommandCenter({
  team,
  tasks,
  feedback,
  industries,
  recentSales,
  recentQuotations,
}: Props) {
  const teamRows = team
    .map((member) => {
      const sales = Number(member.total_sale_price) || 0;
      const target = Number(member.monthly_target) || 0;
      const completedTasks =
        tasks
          .find((item) => item.assigned_user_id === member.id)
          ?.todayTasks.filter((task) => task.status === "Completed").length ||
        0;
      const totalTasks =
        tasks.find((item) => item.assigned_user_id === member.id)?.todayTasks
          .length || 0;

      return {
        ...member,
        sales,
        salesProgress: percentage(sales, target),
        taskProgress: percentage(completedTasks, totalTasks),
        completedTasks,
        totalTasks,
      };
    })
    .sort((a, b) => b.salesProgress - a.salesProgress);

  const feedbackTotals = feedback.reduce(
    (totals, item) => ({
      satisfactory: totals.satisfactory + (Number(item.satisfactory) || 0),
      unsatisfactory:
        totals.unsatisfactory + (Number(item.unsatisfactory) || 0),
    }),
    { satisfactory: 0, unsatisfactory: 0 },
  );
  const totalFeedback =
    feedbackTotals.satisfactory + feedbackTotals.unsatisfactory;
  const satisfaction = percentage(feedbackTotals.satisfactory, totalFeedback);
  const totalCustomers = industries.reduce(
    (total, item) => total + (Number(item.customer_count) || 0),
    0,
  );
  const topIndustries = [...industries]
    .sort((a, b) => Number(b.customer_count) - Number(a.customer_count))
    .slice(0, 4);
  const maxIndustryCount = Math.max(
    ...topIndustries.map((item) => Number(item.customer_count) || 0),
    1,
  );

  return (
    <section className="space-y-4">
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="order-1 flex h-[500px] overflow-hidden border-border/70 shadow-sm">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="flex items-center justify-between border-b bg-muted/25 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                  <Target className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Team scorecard</h4>
                  <p className="text-xs text-muted-foreground">
                    Ranked by target attainment
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {teamRows.length} members
              </span>
            </div>
            <ScrollArea className="min-h-0 flex-1">
            <div className="divide-y divide-border/60">
              {teamRows.length ? (
                teamRows.map((member, index) => (
                  <div
                    key={member.id}
                    className="grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(190px,1.4fr)_minmax(105px,.7fr)_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <Avatar className="size-8">
                        <AvatarFallback >
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {member.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {member.total_visits} visits
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Target pace
                        </span>
                        <span className="font-bold">
                          {member.salesProgress}%
                        </span>
                      </div>
                      <Progress
                        value={member.salesProgress}
                        className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500"
                      />
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold">
                        {formatCurrency(member.sales)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        of {formatCurrency(member.monthly_target)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState label="No team performance data available yet." />
              )}
            </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="order-4 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] shadow-sm xl:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Gauge className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Customer pulse</h4>
                <p className="text-xs text-muted-foreground">
                  Six-month feedback health
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-end gap-5">
              <div>
                <p className="text-4xl font-bold tracking-tighter">
                  {satisfaction}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  satisfaction score
                </p>
              </div>
              <TooltipProvider>
              <div className="mb-1 flex flex-1 gap-1.5">
                {feedback.slice(-6).map((item) => {
                  const monthTotal =
                    Number(item.satisfactory) + Number(item.unsatisfactory);
                  return (
                    <Tooltip key={item.month}>
                      <TooltipTrigger asChild>
                        <button type="button" className="flex flex-1 cursor-help flex-col gap-1 rounded-md outline-none transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
                          <div className="flex h-14 items-end overflow-hidden rounded-md bg-rose-500/10">
                            <div
                              className="w-full rounded-md bg-emerald-500 transition-all"
                              style={{
                                height: `${percentage(Number(item.satisfactory), monthTotal)}%`,
                              }}
                            />
                          </div>
                          <span className="text-center text-[9px] text-muted-foreground">
                            {item.month.slice(0, 3)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={8} arrowColor="bg-popover fill-popover" className="block min-w-40 rounded-xl border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-lg">
                        <p className="mb-2 border-b border-border pb-2 text-[11px] font-semibold text-muted-foreground">{item.month}</p>
                        <div className="flex items-center justify-between gap-5"><span className="text-emerald-600 dark:text-emerald-400">Satisfactory</span><span className="font-bold">{Number(item.satisfactory) || 0}</span></div>
                        <div className="mt-1 flex items-center justify-between gap-5"><span className="text-rose-600 dark:text-rose-400">Not satisfactory</span><span className="font-bold">{Number(item.unsatisfactory) || 0}</span></div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              </TooltipProvider>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-3">
              <Metric
                icon={BadgeCheck}
                label="Positive"
                value={feedbackTotals.satisfactory}
                color="text-emerald-600"
              />
              <Metric
                icon={CircleAlert}
                label="Needs attention"
                value={feedbackTotals.unsatisfactory}
                color="text-rose-600"
              />
            </div>
          </CardContent>
        </Card>
        <div className="order-2 min-h-0 xl:h-[505px]">
          <RecentQuotations data={recentQuotations} />
        </div>
        <div className="order-3">
          <RecentDeals sales={recentSales} />
        </div>
        <div className="order-5">
          <CustomerMix
            industries={topIndustries}
            totalCustomers={totalCustomers}
            maxIndustryCount={maxIndustryCount}
          />
        </div>
      </div>

      <div className="hidden grid gap-4 xl:grid-cols-2 xl:[&>div:first-child]:hidden [&_[data-slot=latest-deals]]:hidden">
        <Card className="border-border/70 shadow-sm xl:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b bg-muted/25 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Today’s execution</h4>
                  <p className="text-xs text-muted-foreground">
                    Task completion by assignee
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {tasks.length ? (
                tasks.map((member) => {
                  const complete = member.todayTasks.filter(
                    (task) => task.status === "Completed",
                  ).length;
                  const pending = member.todayTasks.length - complete;
                  const rate = percentage(complete, member.todayTasks.length);
                  return (
                    <div
                      key={member.assigned_user_id}
                      className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(150px,1fr)_minmax(120px,1fr)_auto] sm:items-center"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-muted text-[10px] font-bold">
                          {initials(member.assigned_user_name)}
                        </div>
                        <p className="truncate text-sm font-semibold">
                          {member.assigned_user_name}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{complete} completed</span>
                          <span>{rate}%</span>
                        </div>
                        <Progress
                          value={rate}
                          className="h-1.5 [&>div]:bg-emerald-500"
                        />
                      </div>
                      <div className="flex gap-1.5 text-[10px] font-semibold">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700">
                          {complete} done
                        </span>
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-700">
                          {pending} open
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState label="No tasks assigned today." />
              )}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-1">
          <RecentDeals sales={recentSales} />
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-700">
                  <Factory className="size-4" />
                </div>
                <p className="text-sm font-semibold">Customer mix</p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {totalCustomers.toLocaleString()} customers across industries
              </p>
              <div className="mt-3 space-y-2.5">
                {topIndustries.map((item) => (
                  <div key={item.industry}>
                    <div className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-muted-foreground">
                        {item.industry}
                      </span>
                      <span className="font-semibold">
                        {item.customer_count}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${percentage(Number(item.customer_count), maxIndustryCount)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailPanel tasks={tasks} />
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`size-4 ${color}`} />
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function RecentDeals({ sales }: { sales: AdminDashboardRecentSales[] }) {
  const {base_route} = useUserDetail()
  return (
    <Card data-slot="latest-deals" className="h-[500px] overflow-hidden border-border/70 shadow-sm">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-700">
              <BadgeCheck className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Latest closed deals</p>
              <p className="text-[11px] text-muted-foreground">
                Most recent sales activity
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700">
            {sales.length}
          </span>
        </div>
        <ScrollArea className="mt-3 min-h-0 flex-1">
        <div className="divide-y divide-border/60">
          {sales.slice(0, 5).map((sale, index) => (
            <div
              key={`${sale.customer_id}-${index}`}
              className="flex items-center gap-2.5 py-2.5"
            >
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[9px] font-bold text-muted-foreground">
                {initials(sale.seller_name)}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/${base_route}/member/${sale.customer_id}/${sale.id}`}>
                <p className="truncate text-xs font-semibold">
                  {sale.customer_name || sale.customer_owner || "Customer"}
                </p>
                </Link>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  Closed by {sale.seller_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">
                  {formatCurrency(sale.price)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(sale.contract_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
        </ScrollArea>
        {!sales.length && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No recent sales to show.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CustomerMix({ industries, totalCustomers, maxIndustryCount }: { industries: { customer_count: string; industry: string }[]; totalCustomers: number; maxIndustryCount: number }) {
  return <Card className="h-full border-border/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2.5"><div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-700"><Factory className="size-4" /></div><div><p className="text-sm font-semibold">Customer mix</p><p className="text-[11px] text-muted-foreground">{totalCustomers.toLocaleString()} customers across industries</p></div></div><div className="mt-4 space-y-3">{industries.map((item) => <div key={item.industry}><div className="flex justify-between gap-2 text-[11px]"><span className="truncate text-muted-foreground">{item.industry}</span><span className="font-semibold">{item.customer_count}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage(Number(item.customer_count), maxIndustryCount)}%` }} /></div></div>)}</div></CardContent></Card>;
}

function TaskDetailPanel({ tasks }: { tasks: AdminTeamTasks[] }) {
  return (
    <Card className="h-[500px] overflow-hidden border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <UsersRound className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Task activity</h4>
              <p className="text-xs text-muted-foreground">
                Yesterday and today, grouped by employee
              </p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Select an employee to view tasks
          </span>
        </div>

        <ScrollArea className="h-[420px]">
          <div className="divide-y divide-border/60">
            {tasks.length ? (
              tasks.map((member) => {
                const allTasks = [
                  ...member.todayTasks,
                  ...member.yesterdayTasks,
                ];
                const completed = allTasks.filter(
                  (task) => task.status === "Completed",
                ).length;

                return (
                  <details key={member.assigned_user_id} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-muted/35">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-[10px] font-bold text-white shadow-sm">
                        {initials(member.assigned_user_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {member.assigned_user_name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {allTasks.length} tasks · {completed} completed
                        </p>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                          {member.todayTasks.length} today
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                          {member.yesterdayTasks.length} yesterday
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground transition group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <div className="border-t bg-muted/15 px-4 py-3">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <TaskDayList
                          label="Today"
                          tasks={member.todayTasks}
                          accent="sky"
                        />
                        <TaskDayList
                          label="Yesterday"
                          tasks={member.yesterdayTasks}
                          accent="slate"
                        />
                      </div>
                    </div>
                  </details>
                );
              })
            ) : (
              <EmptyState label="No task activity available." />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TaskDayList({
  label,
  tasks,
  accent,
}: {
  label: string;
  tasks: AdminTeamTasks["todayTasks"];
  accent: "sky" | "slate";
}) {
  return (
    <div className="rounded-xl border bg-card p-2.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <span className="text-[10px] text-muted-foreground">
          {tasks.length} tasks
        </span>
      </div>
      <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
        {tasks.length ? (
          tasks.map((task) => {
            const completed = task.status === "Completed";
            return (
              <div
                key={task.id}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2"
              >
                <span
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${completed ? "bg-emerald-500" : accent === "sky" ? "bg-sky-500" : "bg-slate-400"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {task.title || `Task #${task.id}`}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(task.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${completed ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}
                >
                  {completed ? "Done" : task.status || "Open"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="py-5 text-center text-xs text-muted-foreground">
            No tasks recorded.
          </p>
        )}
      </div>
    </div>
  );
}
