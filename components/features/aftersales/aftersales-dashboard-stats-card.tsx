import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ReactElement, ReactNode } from "react";
import MiniMetric from "./aftersales-minimetric";
import SectionTitle from "./aftersales-section-tile";
import { MetricTone } from "./aftersales-types";

export default function DashboardStatsCard({
  title,
  subtitle,
  icon,
  metrics,
  onClick,
  button = false,
  option,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  metrics: {
    label: string;
    value: ReactNode;
    icon: ReactElement;
    tone: MetricTone;
  }[];
  onClick?: () => void;
  button?: boolean;
  option: number;
}) {
  const interactive = Boolean(onClick);

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm transition ${interactive ? "hover:border-muted-foreground/30 hover:bg-muted/40" : ""}`}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          option={option}
          title={title}
          subtitle={subtitle}
          icon={icon}
        />
        {button ? (
          <Button
            size={"sm"}
            variant="outline"
            className="h-7 rounded-full border-border bg-muted/50 px-3 text-foreground hover:bg-muted"
            onClick={(event) => {
              event.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="size-3.5" /> Open
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        {metrics.map((metric) => (
          <MiniMetric key={metric.label} {...metric} />
        ))}
      </div>
    </article>
  );
}
