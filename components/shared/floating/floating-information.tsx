"use client"

import { BellNotification } from "@/components/shared/notifications/NotificationBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useChequeAlerts, type ChequeAlert } from "@/hooks/use-cheque-alerts"
import useUserDetail from "@/hooks/use-user-detail"
import {
  CalendarClock,
  ChevronRight,
  Clock3,
  FileText,
  ReceiptText,
  TriangleAlert,
  X,
} from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { useState } from "react"

const REMINDER_FILTERS = ["today", "upcoming", "overdue"] as const
type ReminderFilter = (typeof REMINDER_FILTERS)[number]

export default function FloatingInformation() {
  const [open, setOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ReminderFilter>("today")
  const { count, grouped } = useChequeAlerts()
  const { base_route } = useUserDetail()

  const reminders =
    activeFilter === "today"
      ? grouped.today
      : activeFilter === "upcoming"
        ? grouped.upcoming
        : grouped.passed

  const counts: Record<ReminderFilter, number> = {
    today: grouped.today.length,
    upcoming: grouped.upcoming.length,
    overdue: grouped.passed.length,
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative rounded-xl"
          aria-label="Open Reminders"
        >
          <BellNotification count={count} Icon={FileText} />
        </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className="w-full max-w-lg min-w-full gap-0 sm:max-w-lg sm:min-w-lg"
      >
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <SheetTitle className="text-lg font-semibold tracking-tight">
                Payment reminders
              </SheetTitle>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close reminders"
              >
                <X />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription className="mt-2 text-xs">
            Track upcoming and overdue installments
          </SheetDescription>
        </SheetHeader>

        <div className="border-b px-4 py-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {REMINDER_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={activeFilter === filter ? "default" : "ghost"}
                className="rounded-full px-3"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                <span className="truncate">
                  {filter === "today"
                    ? "Due today"
                    : filter === "overdue"
                      ? "Overdue"
                      : "Upcoming"}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${activeFilter === filter ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}
                >
                  {counts[filter]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {reminders.length ? (
            <div className="divide-y px-4">
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  baseRoute={base_route}
                  filter={activeFilter}
                  onOpen={() => setOpen(false)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                {activeFilter === "overdue" ? (
                  <TriangleAlert className="size-6" />
                ) : (
                  <Clock3 className="size-6" />
                )}
              </span>
              <p className="text-sm font-semibold">
                No{" "}
                {activeFilter === "today" ? "payments due today" : activeFilter}{" "}
                reminders
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payment reminders will appear here.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function ReminderCard({
  reminder,
  baseRoute,
  filter,
  onOpen,
}: {
  reminder: ChequeAlert
  baseRoute: string
  filter: ReminderFilter
  onOpen: () => void
}) {
  const href = `/${baseRoute}${reminder.link.startsWith("/") ? reminder.link : `/${reminder.link}`}`
  const userName = reminder.seller_name || "Unknown user"
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <article className="flex gap-3 py-4">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${filter === "overdue" ? "bg-orange-50 text-orange-500 ring-orange-50" : "bg-primary/10 text-primary ring-1 ring-primary/10"} `}
      >
        {filter === "overdue" ? (
          <TriangleAlert className="size-4.5" />
        ) : (
          <CalendarClock className="size-4.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={href}
            onClick={onOpen}
            className="group inline-flex min-w-0 items-center gap-1 text-sm leading-5 font-semibold text-foreground hover:text-primary"
          >
            <span className="truncate">
              {reminder.customer_name ||
                reminder.customer_owner ||
                "Unknown customer"}
            </span>
            <ChevronRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <ReminderStatus filter={filter} />
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Serial no. {reminder.serial_no || "N/A"}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/20 p-2.5">
          <ReminderValue label="Price" value={formatCurrency(reminder.price)} />
          <ReminderValue
            label="Due amount"
            value={formatCurrency(reminder.amount)}
            emphasize
          />
          <ReminderValue
            className="col-span-2"
            label="Payment date"
            value={
              reminder.date
                ? moment(reminder.date).format("DD MMM YYYY")
                : "N/A"
            }
            icon={<CalendarClock className="size-3.5" />}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <Avatar size="sm">
            {reminder.seller_dp && (
              <AvatarImage src={reminder.seller_dp || ""} alt={userName} />
            )}
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Sales person
            </p>
            <p className="truncate text-xs font-medium">{userName}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function ReminderStatus({ filter }: { filter: ReminderFilter }) {
  const styles =
    filter === "overdue"
      ? "bg-red-100 text-red-700"
      : filter === "today"
        ? "bg-amber-100 text-amber-700"
        : "bg-blue-100 text-blue-700"

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${styles}`}
    >
      {filter === "today"
        ? "Due today"
        : filter === "overdue"
          ? "Overdue"
          : "Upcoming"}
    </span>
  )
}

function ReminderValue({
  label,
  value,
  emphasize = false,
  icon,
  className = "",
}: {
  label: string
  value: string
  emphasize?: boolean
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`mt-1 flex items-center gap-1.5 text-sm ${emphasize ? "font-semibold text-primary" : "font-medium"}`}
      >
        {icon}
        {value}
      </p>
    </div>
  )
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "N/A"

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function FloatingInfoButton({ pending }: { pending: number }) {
  return (
    <Button size="icon" variant="outline" aria-label="Open payment reminders">
      <BellNotification Icon={ReceiptText} count={pending} />
    </Button>
  )
}
