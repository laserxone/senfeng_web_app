import { Bell, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";

export default function NotificationBadge({
  count,
  max = 99,
}: {
  count: number;
  max?: number;
}) {
  if (count <= 0) return null;

  const display = count > max ? `${max}+` : count;

  return (
    <span
      className="inline-flex h-5 max-w-9 min-w-5 animate-pulse-opacity items-center justify-center truncate rounded-full bg-red-500 px-1.5 text-[10px] font-bold tabular-nums text-white shadow-[0_0_0_2px_rgb(239_68_68/0.16),0_3px_8px_rgb(220_38_38/0.3)]"
      title={String(display)}
    >
      {display}
    </span>
  );
}

export function NotificationDot({
  count = 0,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={`relative inline-flex size-2.5 shrink-0 ${className}`}
      aria-label="New notification"
      role="status"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-red-400/75" />
      <span className="relative size-2.5 rounded-full bg-red-500 ring-2 ring-sidebar" />
    </span>
  );
}

export function BellNotification({
  count = 0,
  Icon = Bell,
}: {
  count: number;
  Icon?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}) {
  return (
    <BadgeCount count={count} max={99} offset={{ right: -8, top: -6 }}>
      <div className="relative flex h-8 w-4 items-center justify-center">
        <Icon />
      </div>
    </BadgeCount>
  );
}

export function BadgeCount({
  children,
  count = 0,
  max = 99,
  showZero = false,
  dot = false,
  className = "",
  badgeClassName = "",
  offset = { top: -4, right: -4 },
}: {
  children: ReactNode;
  count?: number;
  max?: number;
  showZero?: boolean;
  dot?: boolean;
  className?: string;
  badgeClassName?: string;
  offset?: { top: number; right: number };
}) {
  const display = typeof count === "number" && count > max ? `${max}+` : count;
  const shouldShow = count > 0 || (count === 0 && showZero);
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      {shouldShow && (
        <span
          className={`absolute select-none ${
            dot
              ? "h-2.5 w-2.5 animate-pulse-opacity rounded-full bg-red-500 ring-2 ring-background"
              : "flex h-4 max-w-8 min-w-4 animate-pulse-opacity items-center justify-center truncate rounded-full bg-red-500 px-1 text-[9px] leading-none font-bold tabular-nums text-white shadow-[0_0_0_2px_rgb(239_68_68/0.16),0_2px_6px_rgb(220_38_38/0.28)]"
          } ${badgeClassName}`}
          style={{ top: offset.top, right: offset.right }}
          aria-label={dot ? "notifications" : `notifications: ${display}`}
          title={dot ? "" : String(display)}
        >
          {!dot && (
            <span className="inline-block align-middle">{String(display)}</span>
          )}
        </span>
      )}
    </div>
  );
}
