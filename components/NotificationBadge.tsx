import { Bell } from "lucide-react";
import { ReactNode } from "react";

export default function NotificationBadge({ count, max = 99 }: { count: number, max?: number }) {
  const display = count > max ? `${max}+` : count;

  return (
    <span
      className="
        inline-flex items-center justify-center
        px-2 py-0.5 
        text-xs font-bold text-white
        bg-red-600 rounded-full
        min-w-[1.5rem] 
        max-w-[3.25rem] truncate
        shadow-sm
      "
      title={String(display)}
    >
      {display}
    </span>
  );
}

export function BellNotification({ count = 0 }) {
  return (
    <BadgeCount count={count} max={99} offset={{ right: -8, top: -6 }}>
      <div className="relative h-8 w-4 flex items-center justify-center">
        <Bell />
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
} : {
  children : ReactNode
  count ?: number
  max ?: number
  showZero ?: boolean
  dot ?: boolean
  className ?: string
  badgeClassName ?: string
  offset ?: {top : number, right : number}
}) {
  const display = typeof count === "number" && count > max ? `${max}+` : count;
  const shouldShow = dot || !!count || (count === 0 && showZero);
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      {shouldShow && (
        <span
          className={`absolute select-none ${dot
              ? "h-2 w-2 rounded-full bg-red-500"
              : "min-w-4 max-w-[3.25rem] truncate rounded-full bg-red-600 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-white shadow-sm flex items-center justify-center animate-pulse-opacity"
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
