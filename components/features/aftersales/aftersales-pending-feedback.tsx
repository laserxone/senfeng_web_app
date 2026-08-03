import AppCalendar from "@/components/features/calendar/app-calendar"
import { RequiredStar } from "@/components/shared/common/RequiredStar"
import StarRating from "@/components/shared/common/startRating"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Spinner from "@/components/ui/spinner"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import {
  CalendarDays,
  MapPin,
  MessageSquareText,
  Search,
  Star,
} from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { useMemo, useState } from "react"
import { DashboardData } from "./aftersales-types"

const PendingFeedbackData = ({
  data,
  onRefresh,
  user_id,
}: {
  user_id: string | number
  data: DashboardData
  onRefresh: () => Promise<void>
}) => {
  const [search, setSearch] = useState("")
  const { base_route } = useUserDetail()
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return data.withoutFeedback

    return data.withoutFeedback.filter((item) =>
      objectValuesToSearchText(item).includes(query)
    )
  }, [data.withoutFeedback, search])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
            <MessageSquareText className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Pending Feedback
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredData.length} of {data.withoutFeedback.length} records
            </p>
          </div>
        </div>

        <div className="relative min-w-0 sm:w-[300px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search any field..."
            className="h-8 pl-9"
          />
        </div>
      </div>

      <div className="grid gap-2">
        {filteredData.length ? (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm xl:grid-cols-[240px_1fr]"
            >
              <div className="flex min-w-0 items-start gap-3 xl:border-r xl:border-border xl:pr-4">
                <Avatar className="size-11 shrink-0 border border-border">
                  <AvatarFallback className="bg-violet-50 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                    {getInitials(item.name || item.owner || "PF")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <Link
                    className="hover:underline"
                    target="_blank"
                    href={`/${base_route}/member/${item.id}`}
                  >
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.name || "Unnamed customer"}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground">
                    {item.owner || "No owner"}
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-xs text-foreground">
                    {formatValue(item.number)}
                  </p>

                  <Rating rating={Number(item.rating || 0)} />
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-wide text-violet-600 uppercase dark:text-violet-300">
                      Previous Feedback
                    </p>

                    <blockquote className="mt-1 line-clamp-2 text-sm leading-5 text-foreground italic">
                      &quot;{item.previous_feedback || "No previous feedback"}
                      &quot;
                    </blockquote>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                    <InfoTag
                      icon={<CalendarDays className="size-3.5" />}
                      value={formatDate(item.previous_feedback_date)}
                    />
                    <InfoTag
                      icon={<MapPin className="size-3.5" />}
                      value={formatValue(item.location)}
                    />
                    <InfoTag
                      value={item.previous_feedback_status || "Pending"}
                      tone={getStatusTone(item.previous_feedback_status)}
                    />
                  </div>
                </div>

                <FeedbackForm
                  user_id={user_id}
                  onRefresh={onRefresh}
                  customer_id={item.id}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No pending feedback matched your search.
          </div>
        )}
      </div>
    </div>
  )
}

const FeedbackForm = ({
  user_id,
  customer_id,
  onRefresh,
}: {
  customer_id: number
  user_id: string | number
  onRefresh: () => Promise<void>
}) => {
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [next, setNext] = useState<Date | undefined>(undefined)
  const [top, setTop] = useState(false)
  const [satisfactory, setSatisfactory] = useState(false)
  const [rating, setRating] = useState(0)
  async function handleSaveFeedback() {
    setLoading(true)
    axios
      .post(`/${user_id}/feedback`, {
        feedback,
        type: "aftersales",
        customer_id,
        user_id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: undefined,
        top_follow: false,
        rating,
      })
      .then(async () => {
        await onRefresh()
        setFeedback("")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-[260px] flex-1 space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Response / Update
          </Label>

          <Input
            placeholder="Enter response or update..."
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="h-9 rounded-lg border-input bg-background text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Next Follow Up <RequiredStar />
          </Label>

          <AppCalendar
            date={next}
            onChange={setNext}
            min={new Date()}
            max={""}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Rating <RequiredStar />
            </Label>
            <StarRating
              size={16}
              value={rating}
              onChange={(e) => setRating(e)}
            />
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Checkbox
                checked={top}
                onCheckedChange={(checked: boolean) => setTop(checked)}
              />
              Top Follow up
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Checkbox
                checked={satisfactory}
                onCheckedChange={(checked: boolean) => setSatisfactory(checked)}
              />
              Satisfactory
            </label>
          </div>
        </div>

        <Button
          disabled={!feedback || loading || !next || rating === 0}
          size="sm"
          className="h-9 shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSaveFeedback}
        >
          {loading && <Spinner />}
          Submit
        </Button>
      </div>
    </div>
  )
}

const Rating = ({ rating }: { rating: number }) => {
  const displayRating = Number.isFinite(rating) ? rating : 0

  return (
    <div className="mt-1 flex items-center gap-1">
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`size-3 ${index < Math.round(displayRating) ? "fill-current" : "fill-transparent text-muted-foreground/40"}`}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">
        ({displayRating.toFixed(1)})
      </span>
    </div>
  )
}

const InfoTag = ({
  icon,
  value,
  tone = "neutral",
}: {
  icon?: React.ReactNode
  value: unknown
  tone?: "neutral" | "success" | "danger" | "warning"
}) => {
  const toneClass = {
    neutral: "bg-muted/60 text-muted-foreground border-border",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  }[tone]

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${toneClass}`}
    >
      {icon}
      <span className="">{formatValue(value)}</span>
    </span>
  )
}

function objectValuesToSearchText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().toLowerCase()
  if (Array.isArray(value)) return value.map(objectValuesToSearchText).join(" ")
  if (typeof value === "object")
    return Object.values(value).map(objectValuesToSearchText).join(" ")
  return String(value).toLowerCase()
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PF"
  )
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

function formatDate(value: unknown) {
  if (!value) return "-"
  return moment(String(value)).format("MMM D, YYYY")
}

function getStatusTone(value: unknown) {
  const status = String(value || "").toLowerCase()
  if (status.includes("satisfactory") && !status.includes("unsatisfactory"))
    return "success"
  if (status.includes("unsatisfactory")) return "danger"
  if (status.includes("pending")) return "warning"
  return "neutral"
}

export default PendingFeedbackData
