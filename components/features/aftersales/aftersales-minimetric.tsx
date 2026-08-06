import { ReactElement, ReactNode } from "react";
import { MetricTone } from "./aftersales-types";
const toneClasses: Record<MetricTone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60",
  green:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60",
  red: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/60",
  slate: "bg-muted text-muted-foreground ring-border",
  violet:
    "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/60",
};

export default function MiniMetric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon: ReactElement;
  tone: MetricTone;
}) {
  return (
    <div className="min-w-0 rounded-xl px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="truncate text-base font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
