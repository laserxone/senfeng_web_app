"use client"
import PageTable from "@/components/shared/tables/app-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Heading from "@/components/ui/heading"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  CalendarDays,
  Clock3,
  Frown,
  MessageSquareText,
  Smile,
  UserRound,
} from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export type FollowUp = {
  id: number
  customer_id: number
  created_at: string
  next_followup: string | null
  feedback: string
  user_id: number
  top_follow: boolean
  status: string
  type: string
  followup_type: string | null
  star: number
  customer_name: string
  customer_owner: string
  user_name: string
  customer_member: boolean
}

export default function Page() {
  const [data, setData] = useState<FollowUp[]>([])
  const { userID, base_route } = useUserDetail()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const feedbackId = searchParams.get("f")

  const selectedFeedback = useMemo(
    () => data.find((item) => String(item.id) === feedbackId) ?? null,
    [data, feedbackId]
  )

  function updateFeedbackParam(id?: number) {
    const params = new URLSearchParams(searchParams.toString())

    if (id) {
      params.set("f", String(id))
    } else {
      params.delete("f")
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  useEffect(() => {
    async function fetchData() {
      axios.get(`/${userID}/feedback`).then((response) => {
        const temp = response.data.map((item: FollowUp) => {
          return {
            ...item,
            customer_name: item.customer_name || item.customer_owner,
          }
        })
        setData([...temp])
      })
    }
    if (userID) fetchData()
  }, [userID])

  const columns: ColumnDef<FollowUp>[] = [
    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        )
      },

      cell: ({ row }) => {
        const item = row.original
        return (
          <Link
            className="hover:underline"
            href={`/${base_route}/customer/${item.customer_id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ml-2">{row.getValue("customer_name")}</div>
          </Link>
        )
      },
    },
    {
      accessorKey: "feedback",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("feedback")}</div>,
    },

    {
      accessorKey: "status",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("status") === "Satisfactory" ? (
            <div className="flex items-center gap-2">
              <Smile size={"20px"} color="green" /> {" Satisfactory"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Frown size={"20px"} color="red" /> {" Unsatisfactory"}
            </div>
          )}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taken By
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },

    {
      accessorKey: "created_at",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("created_at")
            ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Heading
          panel
          title="Feedback"
          description="Manage Feedback from clients"
        />
      </div>

      <PageTable
        columns={columns}
        data={data}
        onRowClick={(item) => updateFeedbackParam(item.id)}
      />

      <FeedbackDetailSheet
        feedback={selectedFeedback}
        open={Boolean(feedbackId && selectedFeedback)}
        customerHref={
          selectedFeedback
            ? `/${base_route}/${selectedFeedback?.customer_member ? "member" : "customer"}/${selectedFeedback.customer_id}`
            : "#"
        }
        onOpenChange={(open) => {
          if (!open) updateFeedbackParam()
        }}
      />
    </div>
  )
}

function FeedbackDetailSheet({
  feedback,
  open,
  customerHref,
  onOpenChange,
}: {
  feedback: FollowUp | null
  open: boolean
  customerHref: string
  onOpenChange: (open: boolean) => void
}) {
  if (!feedback) return null

  const satisfactory = feedback.status === "Satisfactory"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-14">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
              <MessageSquareText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle>Feedback details</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Customer response and follow-up information
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={
                satisfactory
                  ? "h-6 border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700"
                  : "h-6 border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-700"
              }
            >
              {satisfactory ? (
                <Smile className="mr-1 size-3" />
              ) : (
                <Frown className="mr-1 size-3" />
              )}
              {feedback.status || "No status"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-3 p-4">
          <section className="rounded-xl border bg-card p-4 shadow-xs">
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Customer feedback
            </p>
            <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">
              {feedback.feedback || "No feedback was provided."}
            </p>
          </section>

          <section className="grid gap-2 sm:grid-cols-2">
            <DetailCard
              icon={UserRound}
              label="Customer"
              value={feedback.customer_name || feedback.customer_owner || "—"}
            >
              <Link
                href={customerHref}
                className="mt-0.5 inline-flex text-[11px] font-medium text-primary hover:underline"
              >
                View profile
              </Link>
            </DetailCard>
            <DetailCard
              icon={UserRound}
              label="Taken by"
              value={feedback.user_name || "—"}
            />
            <DetailCard
              icon={CalendarDays}
              label="Feedback date"
              value={
                moment(feedback.created_at).isValid()
                  ? moment(feedback.created_at).format("DD MMM YYYY, hh:mm A")
                  : "—"
              }
            />
            <DetailCard
              icon={Clock3}
              label="Next follow-up"
              value={
                feedback.next_followup &&
                moment(feedback.next_followup).isValid()
                  ? moment(feedback.next_followup).format(
                      "DD MMM YYYY, hh:mm A"
                    )
                  : "Not scheduled"
              }
            />
          </section>

          <section className="rounded-xl border bg-muted/15 p-4">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Follow-up information
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailItem label="Type" value={feedback.type || "—"} />
              <DetailItem
                label="Follow-up cycle"
                value={feedback.followup_type || "—"}
              />
              <DetailItem
                label="Priority follow-up"
                value={feedback.top_follow ? "Yes" : "No"}
              />
              <DetailItem
                label="Rating"
                value={feedback.star ? `${feedback.star} / 5` : "Not rated"}
              />
            </dl>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof UserRound
  label: string
  value: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex size-7 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
        <Icon className="size-3.5" />
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-xs leading-5 font-medium">{value}</p>
      {children}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium capitalize">{value}</dd>
    </div>
  )
}
