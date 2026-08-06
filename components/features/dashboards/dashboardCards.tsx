import {
  Activity,
  CreditCard,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type MetricShellProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  iconClassName: string;
  children?: ReactNode;
  onClick?: () => void;
};

function MetricShell({
  title,
  value,
  icon: Icon,
  accent,
  iconClassName,
  children,
  onClick,
}: MetricShellProps) {
  return (
    <div
      className={`relative flex h-full min-h-[92px] w-full overflow-hidden rounded-xl border bg-gradient-to-br ${accent} p-3 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="pointer-events-none absolute -right-5 -bottom-10 h-16 w-24 rotate-[-18deg] rounded-[2rem] bg-white/50" />
      <div className="relative flex w-full items-start gap-2.5">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white shadow-sm ${iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs leading-tight font-bold break-words text-slate-950">
            {title}
          </p>
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="mt-1 text-left text-2xl leading-none font-black tracking-tight text-slate-950 hover:underline"
            >
              {value}
            </button>
          ) : (
            <p className="mt-1 text-2xl leading-none font-black tracking-tight text-slate-950">
              {value}
            </p>
          )}
          {children && <div className="mt-auto pt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export const MachinesSoldCard = ({
  value,
  percentage,
  onClick,
}: {
  value: number;
  percentage: number;
  onClick: () => void;
}) => {
  return (
    <MetricShell
      title="Machines Sold This Month"
      value={value}
      icon={CreditCard}
      accent="from-emerald-50 via-white to-teal-50 text-emerald-700 ring-emerald-100"
      iconClassName="bg-emerald-600"
      onClick={onClick}
    >
      <p
        className={`text-[11px] font-semibold ${
          percentage >= 0 ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {percentage >= 0 ? "+" : "-"}
        {Math.abs(percentage)}% from last month
      </p>
    </MetricShell>
  );
};

export const FeedbackTakenCard = ({
  value,
  remaining,
  total,
}: {
  value: number;
  remaining: number;
  total: number;
}) => {
  return (
    <MetricShell
      title="Calls This Month"
      value={value}
      icon={MessageSquareText}
      accent="from-indigo-50 via-white to-blue-50 text-indigo-700 ring-indigo-100"
      iconClassName="bg-indigo-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">of {total}</span>
        <span
          className={`rounded-full border bg-white/70 px-2 py-0.5 text-[11px] font-semibold ${
            remaining === 0
              ? "border-emerald-100 text-emerald-700"
              : "border-red-100 text-red-700"
          }`}
        >
          {remaining === 0 ? "No" : remaining} remaining
        </span>
      </div>
    </MetricShell>
  );
};

export const VisitsDoneCard = ({
  value,
  remaining,
  total,
}: {
  value: number;
  remaining: number;
  total: number;
}) => {
  return (
    <MetricShell
      title="Visits Done This Month"
      value={value}
      icon={Activity}
      accent="from-sky-50 via-white to-cyan-50 text-sky-700 ring-sky-100"
      iconClassName="bg-sky-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">of {total}</span>
        <span
          className={`rounded-full border bg-white/70 px-2 py-0.5 text-[11px] font-semibold ${
            remaining === 0
              ? "border-emerald-100 text-emerald-700"
              : "border-red-100 text-red-700"
          }`}
        >
          {remaining === 0 ? "No" : remaining} remaining
        </span>
      </div>
    </MetricShell>
  );
};
