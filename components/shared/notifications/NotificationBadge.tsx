import { Bell, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";

export default function NotificationBadge({
  count,
  max = 99,
}: {
  count: number;
  max?: number;
}) {
  const display = count > max ? `${max}+` : count;

  return (
    <span
      className="inline-flex max-w-[3.25rem] min-w-[1.5rem] items-center justify-center truncate rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm animate-pulse-opacity"
      title={String(display)}
    >
      {display}
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
  const shouldShow = dot || !!count || (count === 0 && showZero);
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      {shouldShow && (
        <span
          className={`absolute select-none ${
            dot
              ? "h-2 w-2 rounded-full bg-red-500"
              : "animate-pulse-opacity flex max-w-[3.25rem] min-w-4 items-center justify-center truncate rounded-full bg-red-600 px-1.5 py-[2px] text-[10px] leading-none font-semibold text-white shadow-sm"
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
