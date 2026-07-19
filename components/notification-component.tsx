"use client"

import { Button } from "@/components/ui/button"
import { db } from "@/config/firebase"
import useUserDetail from "@/hooks/use-user-detail"
import type { NotificationItem } from "@/store/context/NotificationContext"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import {
  Banknote,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  ClipboardCheck,
  Cog,
  FileText,
  HardHat,
  Inbox,
  ListTodo,
  LoaderCircle,
  MailOpen,
  MessageSquareText,
  PackageCheck,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const ADMIN_FILTERS = [
  "unread",
  "all",
  "sales",
  "engineering",
  "tasks",
] as const
const USER_FILTERS = ["unread", "all"] as const
const PAGE_SIZE = 20

type NotificationFilter = (typeof ADMIN_FILTERS)[number]

const notificationIconRules: Array<[string[], LucideIcon]> = [
  [["customer"], UserRound],
  [["task"], ListTodo],
  [["loan", "commission"], Banknote],
  [["payment"], CircleDollarSign],
  [["machine"], Settings],
  [["delivery", "backup"], PackageCheck],
  [["complaint", "feedback"], MessageSquareText],
  [["repair", "engineering"], Wrench],
  [["part"], Cog],
  [["quotation"], FileText],
]

function getNotificationIcon(title?: string) {
  const normalizedTitle = title?.toLowerCase() ?? ""
  return (
    notificationIconRules.find(([keywords]) =>
      keywords.some((keyword) => normalizedTitle.includes(keyword))
    )?.[1] ?? Bell
  )
}

function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return null

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  )
  if (elapsedSeconds < 60) return "Just now"

  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`

  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? "day" : "days"} ago`
}

export default function Notification() {
  const { base_route, isAdmin, userID } = useUserDetail()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("unread")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [updatingNotification, setUpdatingNotification] = useState<
    string | null
  >(null)
  const [deletingNotification, setDeletingNotification] = useState<
    string | null
  >(null)
  const [, refreshRelativeTimes] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(
      () => refreshRelativeTimes((current) => current + 1),
      60_000
    )
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!userID) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    void getDocs(
      query(collection(db, "Notification"), where("sendTo", "==", userID))
    )
      .then((snapshot) => {
        if (cancelled) return
        const items = snapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id,
        })) as NotificationItem[]

        setNotifications(
          items.sort((a, b) => (b.TimeStamp ?? 0) - (a.TimeStamp ?? 0))
        )
      })
      .catch((error) => {
        console.error("Unable to load notifications", error)
        toast.error("Unable to load notifications")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userID])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications
    if (activeFilter === "unread") {
      return notifications.filter((notification) => notification.read === false)
    }
    if (activeFilter === "tasks") {
      return notifications.filter(
        (notification) =>
          notification.category?.toLowerCase() === "tasks" ||
          notification.title?.toLowerCase().includes("task")
      )
    }
    return notifications.filter(
      (notification) => notification.category?.toLowerCase() === activeFilter
    )
  }, [activeFilter, notifications])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / PAGE_SIZE)
  )
  const visibleNotifications = filteredNotifications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )
  const unreadCount = notifications.filter(
    (notification) => notification.read === false
  ).length
  const pageStart = filteredNotifications.length
    ? (page - 1) * PAGE_SIZE + 1
    : 0
  const pageEnd = Math.min(page * PAGE_SIZE, filteredNotifications.length)

  useEffect(() => {
    setPage(1)
  }, [activeFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const markAsRead = async (notificationId: string) => {
    if (updatingNotification || deletingNotification) return
    setUpdatingNotification(notificationId)

    try {
      await updateDoc(doc(db, "Notification", notificationId), { read: true })
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error("Unable to mark notification as read", error)
      toast.error("Unable to mark notification as read")
    } finally {
      setUpdatingNotification(null)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (deletingNotification || updatingNotification) return
    setDeletingNotification(notificationId)

    try {
      await deleteDoc(doc(db, "Notification", notificationId))
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      )
    } catch (error) {
      console.error("Unable to delete notification", error)
      toast.error("Unable to delete notification")
    } finally {
      setDeletingNotification(null)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => notification.read === false
    )
    if (!unreadNotifications.length || isMarkingAll) return

    setIsMarkingAll(true)
    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "Notification", notification.id), { read: true })
        )
      )
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      )
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Unable to mark all notifications as read", error)
      toast.error("Unable to mark all notifications as read")
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-4 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden">
      <section className="relative shrink-0 overflow-hidden rounded-[26px] border border-violet-200/50 bg-gradient-to-br from-violet-100/70 via-card to-slate-100/70 px-5 py-5 text-foreground  sm:px-6 dark:border-white/[0.07] dark:from-violet-950/35 dark:via-card dark:to-slate-900/70">
        <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-52 rounded-full bg-slate-300/25 blur-3xl dark:bg-indigo-400/[0.06]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/55 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-violet-700 uppercase backdrop-blur-xl dark:border-violet-400/15 dark:bg-white/[0.04] dark:text-violet-300">
              <Sparkles className="size-3 text-violet-500" />
              Notification center
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-[28px]">
              Your notification workspace
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
              Everything that needs your attention, organized in one calm place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 ">
            <div className="min-w-20 rounded-xl border border-border/70 bg-background/65 px-3.5 py-2  backdrop-blur-xl">
              <p className="text-lg font-bold">{notifications.length}</p>
              <p className="text-[8px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Total
              </p>
            </div>
            <div className="min-w-20 rounded-xl border border-violet-200/60 bg-violet-100/50 px-3.5 py-2  backdrop-blur-xl dark:border-violet-400/10 dark:bg-violet-400/[0.07]">
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                {unreadCount}
              </p>
              <p className="text-[8px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Unread
              </p>
            </div>
            <div>
            <Button
              disabled={!unreadCount || isMarkingAll}
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck />
              {isMarkingAll ? "Marking..." : "Mark all as read"}
            </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 min-w-0 flex-1 gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden h-full overflow-hidden rounded-[24px] border bg-card/90  backdrop-blur-xl lg:flex lg:flex-col">
          <div className="border-b p-5">
            <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              Browse
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Notifications
            </h2>
          </div>
          <nav
            className="flex-1 space-y-1.5 p-3"
            aria-label="Notification filters"
          >
            {(isAdmin ? ADMIN_FILTERS : USER_FILTERS).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                className={`h-11 w-full justify-between rounded-xl px-3.5 capitalize ${
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                <span className="flex items-center gap-2.5">
                  {filter === "unread" ? (
                    <Bell />
                  ) : filter === "tasks" ? (
                    <ListTodo />
                  ) : (
                    <Inbox />
                  )}
                  {filter}
                </span>
                {filter === "unread" ? (
                  <span className="text-xs">{unreadCount}</span>
                ) : null}
              </Button>
            ))}
          </nav>
          <div className="m-3 rounded-2xl border bg-muted/40 p-4">
            <MailOpen className="size-5 text-primary" />
            <p className="mt-2 text-xs font-semibold">You&apos;re in control</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Read or remove updates whenever you&apos;re done with them.
            </p>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border bg-card/90 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-3 border-b bg-muted/15 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
              {(isAdmin ? ADMIN_FILTERS : USER_FILTERS).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={activeFilter === filter ? "default" : "ghost"}
                  className="rounded-full px-4 capitalize"
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold tracking-[0.16em] text-primary uppercase">
                Activity feed
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight capitalize">
                {activeFilter} notifications
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {pageStart}-{pageEnd} of {filteredNotifications.length}
            </p>
          </div>

          <div className="min-h-0 space-y-3 bg-muted/10 p-3 sm:p-4 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            {isLoading ? (
              <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading notifications...
              </div>
            ) : visibleNotifications.length ? (
              visibleNotifications.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.title)
                const isBeingMarkedRead =
                  updatingNotification === notification.id
                const isBeingDeleted = deletingNotification === notification.id

                return (
                  <article
                    key={notification.id}
                    style={
                      isBeingMarkedRead || isBeingDeleted
                        ? { animationDelay: "300ms" }
                        : undefined
                    }
                    className={`group/item relative flex gap-4 overflow-hidden rounded-2xl border bg-background/90 p-4  transition-all hover:-translate-y-0.5 hover:border-primary/20  motion-reduce:transform-none motion-reduce:animate-none ${
                      isBeingMarkedRead || isBeingDeleted
                        ? "animate-out duration-400 fade-out slide-out-to-right-4"
                        : ""
                    }`}
                  >
                    {(isBeingMarkedRead || isBeingDeleted) && (
                      <div className="absolute inset-0 z-10 flex animate-in items-center justify-center bg-background/90 backdrop-blur-xl duration-200 fade-in">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <span
                            className={`grid size-9 place-items-center rounded-full text-white ${
                              isBeingMarkedRead
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          >
                            {isBeingMarkedRead ? (
                              <CircleCheck className="size-5" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </span>
                          {isBeingMarkedRead
                            ? "Marked as read"
                            : "Notification deleted"}
                        </div>
                      </div>
                    )}

                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 transition-transform group-hover/item:scale-105 ${
                        notification.read === false
                          ? "bg-violet-500/10 text-violet-700 ring-violet-500/15 dark:text-violet-300"
                          : "bg-muted text-muted-foreground ring-border"
                      }`}
                    >
                      <NotificationIcon className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2 className="text-sm font-semibold text-foreground">
                          {notification.title || "Notification"}
                        </h2>
                        {notification.read === false ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                            New
                          </span>
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(notification.TimeStamp)}
                        </span>
                      </div>
                      {notification.description ? (
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
                          {notification.description}
                        </p>
                      ) : null}
                      {notification.page ? (
                        <Link
                          href={`/${base_route}/${notification.page}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          View details
                          <ChevronRight className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-start gap-1">
                      {notification.read === false ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          disabled={Boolean(
                            updatingNotification || deletingNotification
                          )}
                          onClick={() => void markAsRead(notification.id)}
                          className="rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Bell className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete notification"
                        aria-label="Delete notification"
                        disabled={Boolean(
                          updatingNotification || deletingNotification
                        )}
                        onClick={() => void deleteNotification(notification.id)}
                        className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  {activeFilter === "engineering" ? (
                    <HardHat className="size-6" />
                  ) : activeFilter === "tasks" ? (
                    <ClipboardCheck className="size-6" />
                  ) : (
                    <Inbox className="size-6" />
                  )}
                </span>
                <p className="text-sm font-semibold">No notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  There are no notifications in this filter.
                </p>
              </div>
            )}
          </div>

          {!isLoading && filteredNotifications.length > PAGE_SIZE ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t bg-background/70 px-4 py-4 sm:flex-row sm:px-5">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (pageNumber) =>
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        Math.abs(pageNumber - page) <= 1
                    )
                    .map((pageNumber, index, pages) => (
                      <div key={pageNumber} className="flex items-center gap-1">
                        {index > 0 && pageNumber - pages[index - 1] > 1 ? (
                          <span className="px-1 text-xs text-muted-foreground">
                            …
                          </span>
                        ) : null}
                        <Button
                          size="icon-sm"
                          variant={page === pageNumber ? "default" : "ghost"}
                          aria-label={`Go to page ${pageNumber}`}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
