import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PendingDelivery,
  PendingPartsPayment,
  PendingPayment,
  TopFollow,
} from "@/lib/types"
import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarCheck,
  Cpu,
  Hash,
  MessageSquareText,
  PackageCheck,
  ReceiptText,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { useId, type ElementType } from "react"

export type MetricDialogState =
  | {
      kind: "pending_payments"
      title: string
      total: number
      totalAmount?: number
      data: PendingPayment[]
    }
  | {
      kind: "pending_parts_payments"
      title: string
      total: number
      totalAmount?: number
      data: PendingPartsPayment[]
    }
  | {
      kind: "pending_deliveries"
      title: string
      total: number
      data: PendingDelivery[]
    }
  | {
      kind: "top_follow"
      title: string
      total: number
      data: TopFollow[]
    }

export function SalesMetricCard({
  title,
  value,
  icon: Icon,
  accent,
  iconClassName,
  onClick,
  description = "Current Total",
}: {
  title: string
  value: number
  icon: ElementType
  accent: string
  iconClassName: string
  onClick?: () => void
  description?: string
}) {
  const getChartColor = (className: string) => {
    if (className.includes("rose")) return "#e11d48"
    if (className.includes("blue")) return "#2563eb"
    if (className.includes("emerald")) return "#059669"
    if (className.includes("amber")) return "#d97706"
    if (className.includes("violet")) return "#7c3aed"
    if (className.includes("indigo")) return "#4f46e5"
    if (className.includes("cyan")) return "#0891b2"
    if (className.includes("orange")) return "#ea580c"
    if (className.includes("red")) return "#dc2626"

    return "#334155"
  }

  const chartColor = getChartColor(iconClassName)

  const chartId = useId()

  return (
    <div
      className={`group relative flex h-full min-h-[118px] w-full overflow-hidden rounded-lg border border-white/60 bg-gradient-to-br ${accent} p-4 ring-1 ring-black/5 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none`}
    >
      {/* soft background glow only */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

      {/* glass shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] leading-snug font-semibold tracking-tight text-slate-800">
              {title}
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-600">
              {description}
            </p>
          </div>

          <div
            className={`grid size-11 shrink-0 place-items-center rounded-lg text-white ring-1 ring-white/40 ${iconClassName} `}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
              disabled={!onClick}
              className={`text-left text-3xl leading-none font-black tracking-tight text-slate-950 ${onClick ? "cursor-pointer transition hover:text-blue-700 hover:underline" : "cursor-default"} `}
            >
              {value?.toLocaleString?.() ?? value}
            </button>
          </div>

          <div className="flex h-11 w-28 items-center justify-center">
            <svg
              viewBox="0 0 60 44"
              fill="none"
              className="h-10 w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={`${chartId}-line`}
                  x1="6"
                  y1="26"
                  x2="90"
                  y2="6"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor={chartColor} stopOpacity="0.35" />
                  <stop
                    offset="0.45"
                    stopColor={chartColor}
                    stopOpacity="0.9"
                  />
                  <stop offset="1" stopColor={chartColor} stopOpacity="1" />
                </linearGradient>

                <linearGradient
                  id={`${chartId}-area`}
                  x1="48"
                  y1="8"
                  x2="48"
                  y2="38"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor={chartColor} stopOpacity="0.16" />
                  <stop offset="1" stopColor={chartColor} stopOpacity="0" />
                </linearGradient>

                <filter
                  id={`${chartId}-glow`}
                  x="-20%"
                  y="-40%"
                  width="140%"
                  height="180%"
                >
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* area */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6 L86 38 L6 38 Z"
                fill={`url(#${chartId}-area)`}
              />

              {/* glow line */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6"
                stroke={chartColor}
                strokeOpacity="0.1"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${chartId}-glow)`}
              />

              {/* main line */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6"
                stroke={`url(#${chartId}-line)`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* end point */}
              <circle
                cx="86"
                cy="6"
                r="3"
                fill="white"
                stroke={chartColor}
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SalesMetricDetailsDialog({
  metric,
  onClose,
  baseRoute,
}: {
  metric: MetricDialogState | null
  onClose: () => void
  baseRoute: string
}) {
  const amountText =
    metric && "totalAmount" in metric && typeof metric.totalAmount === "number"
      ? formatMetricAmount(metric.totalAmount)
      : null

  return (
    <Dialog open={!!metric} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {metric?.title || "Details"}
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {metric?.total || 0} records found
                  {amountText ? ` - ${amountText}` : ""}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="w-fit rounded-full bg-background px-3 py-1"
            >
              Total: {metric?.total || 0}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-150px)]">
          <div className="space-y-3 p-5">
            {!metric || metric.data.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed bg-muted/15 p-6 text-center">
                <div>
                  <AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No records found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Records will appear here when available.
                  </p>
                </div>
              </div>
            ) : (
              metric.data.map((item) => (
                <MetricDetailCard
                  key={`${metric.kind}-${item.id}`}
                  item={item}
                  kind={metric.kind}
                  baseRoute={baseRoute}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function MetricDetailCard({
  item,
  kind,
  baseRoute,
}: {
  item: PendingPayment | PendingPartsPayment | PendingDelivery | TopFollow
  kind: MetricDialogState["kind"]
  baseRoute: string
}) {
  const customer = item.customer
  const customerUrl = `/${baseRoute}/${customer?.member ? "member" : "customer"}/${customer?.id || item.customer_id}`

  if (kind === "pending_parts_payments") {
    const parts = item as PendingPartsPayment
    return (
      <MetricCardShell
        href={customerUrl}
        icon={ReceiptText}
        title={parts.customer?.name || parts.company || "Parts invoice"}
        subtitle={parts.customer?.owner || parts.name || "No owner"}
        badge={parts.status || "Pending"}
        details={[
          { icon: Hash, label: "Invoice", value: parts.invoicenumber || "N/A" },
          { icon: Building2, label: "Company", value: parts.company || "N/A" },
          {
            icon: Banknote,
            label: "Balance",
            value: formatMetricAmount(
              Number(parts.final_amount || 0) - Number(parts.total_paid || 0)
            ),
          },
          { icon: UserRound, label: "Manager", value: parts.manager || "N/A" },
        ]}
      />
    )
  }

  if (kind === "top_follow") {
    const follow = item as TopFollow
    return (
      <MetricCardShell
        href={customerUrl}
        icon={MessageSquareText}
        title={follow.customer?.name || "Follow up"}
        subtitle={follow.customer?.owner || "No owner"}
        badge={follow.status || "Follow up"}
        details={[
          {
            icon: CalendarCheck,
            label: "Next follow up",
            value: formatMetricDate(follow.next_followup),
          },
          {
            icon: ReceiptText,
            label: "Type",
            value: follow.followup_type || follow.type || "N/A",
          },
          {
            icon: MessageSquareText,
            label: "Feedback",
            value: follow.feedback || "N/A",
          },
        ]}
      />
    )
  }

  const payment = item as PendingPayment
  const isDelivery = kind === "pending_deliveries"

  return (
    <MetricCardShell
      href={`/${baseRoute}/member/${payment.customer_id}/${payment.id}`}
      icon={isDelivery ? Truck : Wallet}
      title={payment.customer?.name || "No customer"}
      subtitle={payment.customer?.owner || payment.serial_no || "No owner"}
      badge={isDelivery ? "Delivery" : payment.type || "Machine"}
      details={[
        { icon: Cpu, label: "Serial No", value: payment.serial_no || "N/A" },
        {
          icon: Hash,
          label: "Order No",
          value: payment.order_no_arr?.join(", ") || payment.order_no || "N/A",
        },
        {
          icon: Banknote,
          label: isDelivery ? "Price" : "Pending",
          value: formatMetricAmount(
            isDelivery
              ? Number(payment.price || 0)
              : Number(payment.pending_amount || 0)
          ),
        },
        {
          icon: isDelivery ? PackageCheck : Cpu,
          label: isDelivery ? "Delivery Date" : "Power",
          value: isDelivery
            ? formatMetricDate(
                payment.delivery_date || payment.delivery_request_date
              )
            : payment.power || "N/A",
        },
      ]}
    />
  )
}

function MetricCardShell({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  details,
}: {
  href: string
  icon: ElementType
  title: string
  subtitle: string
  badge: string
  details: { icon: ElementType; label: string; value: string }[]
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm transition hover:bg-muted/15">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Link
          href={href}
          target="_blank"
          className="flex min-w-0 items-start gap-3"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold break-words hover:underline">
              {title}
            </span>
            <span className="mt-1 block text-sm break-words text-muted-foreground">
              {subtitle}
            </span>
          </span>
        </Link>

        <Badge
          variant="outline"
          className="w-fit rounded-full bg-muted/20 px-2.5 py-1"
        >
          {badge}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
        {details.map((detail) => {
          const DetailIcon = detail.icon

          return (
            <span
              key={`${detail.label}-${detail.value}`}
              className="inline-flex min-w-0 items-start gap-2 rounded-xl border bg-muted/10 px-3 py-2"
            >
              <DetailIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0">
                <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {detail.label}
                </span>
                <span className="block font-semibold break-words whitespace-pre-wrap text-foreground">
                  {detail.value}
                </span>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function formatMetricAmount(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatMetricDate(value: string | Date | null) {
  return value ? moment(new Date(value)).format("YYYY-MM-DD") : "N/A"
}
