"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const THEMES = {
  light: "",
  dark: ".dark",
};

type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
    theme?: Record<string, string>;
    icon?: React.ComponentType<any>;
  }
>;

type ChartContextType = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextType | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  id?: string;
  config: ChartConfig;
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);

ChartContainer.displayName = "Chart";

function ChartStyle({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) {
  const colorConfig = Object.entries(config).filter(
    ([, c]) => c.theme || c.color
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const color = item.theme?.[theme] || item.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`)
          .join("\n"),
      }}
    />
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartLegend = RechartsPrimitive.Legend;

type TooltipProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  payload?: any[];
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: any;
  labelFormatter?: (label: any, payload: any[]) => React.ReactNode;
  formatter?: any;
  color?: string;
  nameKey?: string;
  labelKey?: string;
  className?: string;
  labelClassName?: string;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    const tooltipLabel =
      !hideLabel && label ? (
        <div className={cn("font-medium", labelClassName)}>{label}</div>
      ) : null;

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}

        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const indicatorColor = color || item.color || item.payload?.fill;

            return (
              <div key={index} className="flex items-center gap-2">
                {!hideIndicator && (
                  <div
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}

                <div className="flex flex-1 justify-between">
                  <span className="text-muted-foreground">
                    {item.name}
                  </span>

                  <span className="font-mono">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ChartTooltipContent.displayName = "ChartTooltip";

type LegendProps = React.HTMLAttributes<HTMLDivElement> & {
  payload?: any[];
  hideIcon?: boolean;
  nameKey?: string;
  verticalAlign?: "top" | "bottom";
};

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  LegendProps
>(({ className, payload, hideIcon, verticalAlign = "bottom" }, ref) => {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item: any) => (
        <div key={item.value} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
});

ChartLegendContent.displayName = "ChartLegend";

export {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
};