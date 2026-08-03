"use client"

import type { ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  Award,
  Brain,
  ClipboardList,
  Clock,
  Gift,
  GraduationCap,
  MapPin,
  Monitor,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Engineer = {
  rank: number
  name: string
  role: string
  score: number
  tier: "GOLD" | "SILVER" | "RED"
  status: string
}

type Task = {
  id: string
  type: string
  icon: LucideIcon
  engineer: string
  level: string
  time: string
  status: "In Progress" | "Assigned" | "Escalated"
  points: number
}

const engineers: Engineer[] = [
  {
    rank: 1,
    name: "Arjun Sharma",
    role: "Lead Engineer",
    score: 96,
    tier: "GOLD",
    status: "Top Performer",
  },
  {
    rank: 2,
    name: "Neha Verma",
    role: "Senior Engineer",
    score: 92,
    tier: "SILVER",
    status: "Solid Performer",
  },
  {
    rank: 3,
    name: "Rohit Patel",
    role: "Senior Engineer",
    score: 89,
    tier: "SILVER",
    status: "Solid Performer",
  },
  {
    rank: 4,
    name: "Vikram Singh",
    role: "Engineer",
    score: 86,
    tier: "SILVER",
    status: "Solid Performer",
  },
  {
    rank: 5,
    name: "Ananya Iyer",
    role: "Engineer",
    score: 82,
    tier: "SILVER",
    status: "Solid Performer",
  },
  {
    rank: 6,
    name: "Karan Mehta",
    role: "Junior Engineer",
    score: 74,
    tier: "RED",
    status: "Needs Training",
  },
  {
    rank: 7,
    name: "Pooja Nair",
    role: "Junior Engineer",
    score: 68,
    tier: "RED",
    status: "At Risk",
  },
  {
    rank: 8,
    name: "Rahul Das",
    role: "Junior Engineer",
    score: 58,
    tier: "RED",
    status: "At Risk",
  },
]

const tasks: Task[] = [
  {
    id: "TASK-8756",
    type: "Online Support",
    icon: Monitor,
    engineer: "Neha Verma",
    level: "L1 Basic",
    time: "01:15:30",
    status: "In Progress",
    points: 1,
  },
  {
    id: "TASK-8757",
    type: "On-Site Visit",
    icon: MapPin,
    engineer: "Rohit Patel",
    level: "L2 Intermediate",
    time: "02:45:10",
    status: "Assigned",
    points: 2,
  },
  {
    id: "TASK-8758",
    type: "Repair Service",
    icon: Wrench,
    engineer: "Vikram Singh",
    level: "L3 Complex",
    time: "03:30:45",
    status: "In Progress",
    points: 3,
  },
  {
    id: "TASK-8759",
    type: "Installation",
    icon: ShieldCheck,
    engineer: "Ananya Iyer",
    level: "L2 Intermediate",
    time: "01:05:20",
    status: "Assigned",
    points: 2,
  },
  {
    id: "TASK-8760",
    type: "Remote Solving",
    icon: ClipboardList,
    engineer: "Arjun Sharma",
    level: "L4 Expert",
    time: "00:45:15",
    status: "Escalated",
    points: 4,
  },
]

const radarData = [
  { kpi: "Response", value: 92 },
  { kpi: "Arrival", value: 88 },
  { kpi: "Customer", value: 95 },
  { kpi: "Completion", value: 91 },
  { kpi: "Skill", value: 89 },
  { kpi: "Uniform", value: 94 },
]

const trendData = [
  { month: "Dec", Arjun: 72, Neha: 50, Rohit: 35, Vikram: 25, Ananya: 10 },
  { month: "Jan", Arjun: 86, Neha: 65, Rohit: 48, Vikram: 33, Ananya: 18 },
  { month: "Feb", Arjun: 80, Neha: 58, Rohit: 41, Vikram: 27, Ananya: 13 },
  { month: "Mar", Arjun: 90, Neha: 68, Rohit: 50, Vikram: 35, Ananya: 21 },
  { month: "Apr", Arjun: 83, Neha: 59, Rohit: 38, Vikram: 29, Ananya: 14 },
  { month: "May", Arjun: 94, Neha: 75, Rohit: 58, Vikram: 42, Ananya: 25 },
]

const stats: Array<[string, string, string, LucideIcon, string]> = [
  ["Active Engineers", "128", "+12%", Users, "from-primary to-cyan-500"],
  [
    "Tasks Today",
    "342",
    "+18%",
    ClipboardList,
    "from-violet-500 to-fuchsia-500",
  ],
  ["Satisfaction", "94.6%", "+5.2%", Star, "from-amber-500 to-orange-500"],
  ["On-Time Arrival", "91.3%", "+3.7%", Clock, "from-emerald-500 to-teal-500"],
  ["In Field", "78", "Live", UserCheck, "from-sky-500 to-blue-600"],
  ["Escalations", "14", "+7", AlertTriangle, "from-rose-500 to-red-600"],
]

const decisions: Array<
  [
    string,
    string,
    string,
    LucideIcon,
    "amber" | "green" | "orange" | "red",
    number,
  ]
> = [
  [
    "Engineer of the Month",
    "Arjun Sharma",
    "Outstanding performance across all metrics",
    Trophy,
    "amber",
    96,
  ],
  [
    "Deserves a Raise",
    "Neha Verma",
    "Exceptional consistency and customer feedback",
    TrendingUp,
    "green",
    92,
  ],
  [
    "Needs Training",
    "Karan Mehta",
    "Improve response time and task completion",
    GraduationCap,
    "orange",
    74,
  ],
  [
    "Termination Risk",
    "Rahul Das",
    "Low performance across multiple metrics",
    AlertTriangle,
    "red",
    58,
  ],
]

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

function Panel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border border-white/55 bg-white/82 text-slate-950 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:shadow-black/30",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30" />
      {children}
    </section>
  )
}

function SectionTitle({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  action?: string
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-white dark:text-slate-950">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? (
        <button className="shrink-0 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm transition hover:border-slate-900 hover:text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  )
}

function ProgressRing({
  value,
  className = "",
}: {
  value: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-full shadow-inner",
        className
      )}
      style={{
        background: `conic-gradient(#22c55e ${value * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
      }}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-black text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white">
        {value}%
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Task["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-black",
        status === "Escalated" &&
          "bg-red-500/10 text-red-600 dark:text-red-300",
        status === "Assigned" &&
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        status === "In Progress" &&
          "bg-blue-500/10 text-blue-600 dark:text-blue-300"
      )}
    >
      {status}
    </span>
  )
}

export default function EngineerPerformance() {
  const topEngineer = engineers[0]
  const secondEngineer = engineers[1]
  const thirdEngineer = engineers[2]

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-3 text-slate-950 sm:p-4 dark:bg-[#05070d] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_92%_14%,rgba(236,72,153,0.14),transparent_24%),radial-gradient(circle_at_50%_96%,rgba(16,185,129,0.14),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

      <div className="mx-auto flex max-w-[1800px] flex-col gap-3">
        <Panel className="p-4 sm:p-5">
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-8 right-20 hidden h-24 w-24 rounded-full border border-white/40 bg-white/15 backdrop-blur md:block dark:border-white/10" />

          <div className="relative grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black tracking-[0.18em] text-white uppercase shadow-lg dark:bg-white dark:text-slate-950">
                  <Sparkles className="h-3.5 w-3.5" />
                  Engineer Command Center
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-300">
                  Live performance pulse
                </span>
              </div>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Performance intelligence for the entire field team.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 font-medium text-slate-600 dark:text-slate-300">
                A premium control room for rankings, assignments, bonus
                tracking, and AI-driven performance decisions.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Efficiency", "96%", Target],
                  ["SLA Health", "91%", Activity],
                  ["Bonus Pool", "450K", Gift],
                  ["Risk Alerts", "14", AlertTriangle],
                ].map(([label, value, Icon]) => {
                  const HeroIcon = Icon as LucideIcon

                  return (
                    <div
                      key={label as string}
                      className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/10"
                    >
                      <HeroIcon className="mb-2 h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {label as string}
                      </p>
                      <p className="text-2xl font-black tracking-tight">
                        {value as string}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-amber-300/40 bg-gradient-to-br from-amber-100 via-white to-blue-100 p-4 shadow-2xl shadow-amber-500/10 dark:border-amber-300/20 dark:from-amber-500/20 dark:via-white/10 dark:to-blue-500/15">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
                    Top performer
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    {topEngineer.name}
                  </h2>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {topEngineer.role}
                  </p>
                </div>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-slate-950 text-white shadow-xl dark:bg-white dark:text-slate-950">
                  <Trophy className="h-8 w-8 text-amber-400" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4">
                <ProgressRing value={topEngineer.score} className="h-20 w-20" />
                <div className="space-y-2">
                  {[
                    "Customer rating 4.9",
                    "Task closure 98",
                    "Uniform score 95",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-full bg-white/70 px-3 py-2 text-xs font-black shadow-sm dark:bg-white/10"
                    >
                      <span>{item}</span>
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {stats.map(([label, value, change, Icon, gradient], index) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/10"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                  gradient
                )}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight">
                    {value}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-black",
                      index === 5
                        ? "text-red-600 dark:text-red-300"
                        : "text-emerald-600 dark:text-emerald-300"
                    )}
                  >
                    {change}
                  </p>
                </div>
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-105",
                    gradient
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <Panel className="p-3">
              <SectionTitle
                title="Leaderboard"
                subtitle="Ranking, score and service quality"
                icon={Award}
                action="View All"
              />

              <div className="mb-3 grid grid-cols-3 gap-2">
                {[secondEngineer, topEngineer, thirdEngineer].map(
                  (engineer, index) => (
                    <div
                      key={engineer.name}
                      className={cn(
                        "rounded-2xl border p-2 text-center shadow-sm",
                        index === 1
                          ? "border-amber-300/50 bg-amber-100/80 pt-4 dark:border-amber-300/20 dark:bg-amber-500/15"
                          : "border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/10"
                      )}
                    >
                      <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                        {engineer.name[0]}
                      </div>
                      <p className="mt-2 truncate text-xs font-black">
                        {engineer.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Rank {engineer.rank}
                      </p>
                      <p className="text-sm font-black">{engineer.score}%</p>
                    </div>
                  )
                )}
              </div>

              <div className="space-y-2">
                {engineers.map((engineer) => (
                  <div
                    key={engineer.name}
                    className="group flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/72 p-2 shadow-sm transition hover:border-blue-400/40 hover:bg-blue-50/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    <div
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black",
                        engineer.rank === 1
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      )}
                    >
                      {engineer.rank}
                    </div>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-md">
                      {engineer.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {engineer.name}
                      </p>
                      <p className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {engineer.role}
                      </p>
                    </div>
                    <ProgressRing value={engineer.score} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="min-w-0 space-y-3">
            <Panel className="p-3">
              <SectionTitle
                title="Live Task Deck"
                subtitle="SLA, assignment and task intensity"
                icon={ClipboardList}
                action="View All Tasks"
              />

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-5">
                {tasks.map((task) => {
                  const TaskIcon = task.icon

                  return (
                    <div
                      key={task.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/78 p-3 shadow-sm transition hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-xl dark:border-white/10 dark:bg-white/10"
                    >
                      <div
                        className={cn(
                          "absolute inset-x-0 top-0 h-1",
                          task.status === "Escalated"
                            ? "bg-red-500"
                            : task.status === "Assigned"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                        )}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {task.id}
                          </p>
                          <p className="mt-1 text-[11px] font-black tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
                            {task.type}
                          </p>
                        </div>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg transition group-hover:scale-105 group-hover:rotate-3 dark:bg-white dark:text-slate-950">
                          <TaskIcon className="h-4 w-4" />
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                            Assigned to
                          </p>
                          <p className="truncate text-sm font-black">
                            {task.engineer}
                          </p>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                              SLA
                            </p>
                            <p
                              className={cn(
                                "font-mono text-lg font-black",
                                task.status === "Escalated"
                                  ? "text-red-600 dark:text-red-300"
                                  : "text-blue-600 dark:text-blue-300"
                              )}
                            >
                              {task.time}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                              Points
                            </p>
                            <p className="text-lg font-black">{task.points}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {task.level}
                          </span>
                          <StatusPill status={task.status} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel className="p-3">
              <SectionTitle
                title="Analytics Cockpit"
                subtitle="KPI radar and six-month engineer trend"
                icon={Activity}
                action="Last 6 Months"
              />

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="h-64 min-w-0 rounded-3xl border border-slate-200/70 bg-slate-950 p-3 shadow-inner dark:border-white/10">
                  <div className="mb-2 flex items-center justify-between text-white">
                    <p className="text-xs font-black">Skill Matrix</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black">
                      94 avg
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="86%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.18)" />
                      <PolarAngleAxis
                        dataKey="kpi"
                        tick={{ fontSize: 10, fill: "rgba(255,255,255,0.72)" }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#38bdf8"
                        fill="#38bdf8"
                        fillOpacity={0.28}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-64 min-w-0 rounded-3xl border border-slate-200/70 bg-white/78 p-3 shadow-inner dark:border-white/10 dark:bg-white/10">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-black">Growth Velocity</p>
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-600 dark:text-blue-300">
                      multi-line
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="86%">
                    <LineChart data={trendData}>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "currentColor" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="Arjun"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Neha"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Rohit"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Vikram"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Ananya"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Panel>

            <Panel className="p-3">
              <SectionTitle
                title="Bonus Board"
                subtitle="Monthly rewards and qualification status"
                icon={Gift}
              />

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-amber-500/20">
                  Rs 450,000 Pool
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                  Top 8 visible
                </span>
              </div>

              <div className="overflow-auto rounded-2xl border border-slate-200/70 shadow-sm dark:border-white/10">
                <table className="w-full min-w-[760px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-left text-white dark:bg-white/10">
                      {[
                        "Rank",
                        "Engineer",
                        "Tasks",
                        "High-Value",
                        "Bonus Points",
                        "Bonus Amount",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-white/10 p-3 font-black"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {engineers.map((engineer, index) => (
                      <tr
                        key={engineer.name}
                        className={cn(
                          "transition hover:bg-blue-50 dark:hover:bg-white/10",
                          index === 0
                            ? "bg-amber-50/80 dark:bg-amber-500/10"
                            : "bg-white/72 dark:bg-white/5"
                        )}
                      >
                        <td className="border-b border-slate-200/70 p-3 font-black dark:border-white/10">
                          {engineer.rank}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 font-black dark:border-white/10">
                          {engineer.name}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 dark:border-white/10">
                          {98 - index * 7}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 dark:border-white/10">
                          {32 - index * 3}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 font-black dark:border-white/10">
                          {12850 - index * 980}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 font-black dark:border-white/10">
                          Rs {75000 - index * 8000}
                        </td>
                        <td className="border-b border-slate-200/70 p-3 dark:border-white/10">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-black",
                              engineer.score >= 85 &&
                                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                              engineer.score >= 70 &&
                                engineer.score < 85 &&
                                "bg-orange-500/10 text-orange-600 dark:text-orange-300",
                              engineer.score < 70 &&
                                "bg-red-500/10 text-red-600 dark:text-red-300"
                            )}
                          >
                            {engineer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel className="p-3">
              <SectionTitle
                title="AI Decision Studio"
                subtitle="Suggested actions by score patterns"
                icon={Brain}
              />

              <div className="space-y-2">
                {decisions.map(([title, name, desc, Icon, color, score]) => (
                  <div
                    key={title}
                    className={cn(
                      "group rounded-2xl border p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                      color === "amber" &&
                        "border-amber-300/40 bg-amber-50/90 dark:bg-amber-500/15",
                      color === "green" &&
                        "border-emerald-300/40 bg-emerald-50/90 dark:bg-emerald-500/15",
                      color === "orange" &&
                        "border-orange-300/40 bg-orange-50/90 dark:bg-orange-500/15",
                      color === "red" &&
                        "border-red-300/40 bg-red-50/90 dark:bg-red-500/15"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white">
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            color === "amber" && "text-amber-500",
                            color === "green" && "text-emerald-500",
                            color === "orange" && "text-orange-500",
                            color === "red" && "text-red-500"
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-black tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                          {title}
                        </p>
                        <p className="truncate text-sm font-black">{name}</p>
                        <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                          {desc}
                        </p>
                      </div>
                      <ProgressRing value={score} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden p-0">
              <div className="bg-slate-950 p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.18em] text-blue-200 uppercase">
                      Annual nominee
                    </p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight">
                      Arjun Sharma
                    </h3>
                    <p className="mt-1 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-blue-100">
                      Lead Engineer
                    </p>
                  </div>
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/20">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-300" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 text-center">
                {[
                  ["Annual Rank", "1 of 128"],
                  ["Score", "96%"],
                  ["Points", "12,850"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200/70 bg-white/75 p-2 shadow-sm dark:border-white/10 dark:bg-white/10"
                  >
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                    <p className="text-sm font-black">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
