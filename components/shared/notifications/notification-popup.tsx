"use client"

import { db } from "@/config/firebase"
import useUserDetail from "@/hooks/use-user-detail"
import { useNotification } from "@/store/context/NotificationContext"
import { doc, updateDoc } from "firebase/firestore"
import { ArrowRight, Bell, Sparkles, X } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import { useCallback, useEffect, useState } from "react"

const NOTIFICATION_AUTO_DISMISS_MS = 5000
const NOTIFICATION_EXIT_ANIMATION_MS = 250
const MAX_VISIBLE_NOTIFICATIONS = 4

type PopupCardProps = {
  notification: ReturnType<typeof useNotification>["PopupNotifications"][number]
  baseRoute: string
  onDismiss: (id: string) => void
}

function PopupCard({ notification, baseRoute, onDismiss }: PopupCardProps) {
  const router = useRouter()
  const [isPaused, setIsPaused] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const dismissWithAnimation = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    window.setTimeout(
      () => onDismiss(notification.id),
      NOTIFICATION_EXIT_ANIMATION_MS
    )
  }, [isExiting, notification.id, onDismiss])

  useEffect(() => {
    if (isPaused || isOpening || isExiting) return

    const timeout = window.setTimeout(
      dismissWithAnimation,
      NOTIFICATION_AUTO_DISMISS_MS
    )

    return () => window.clearTimeout(timeout)
  }, [dismissWithAnimation, isExiting, isOpening, isPaused])

  const openNotification = async () => {
    if (isOpening) return
    setIsOpening(true)

    try {
      await updateDoc(doc(db, "Notification", notification.id), {
        read: true,
      })
    } catch (error) {
      console.error("Unable to mark notification as read:", error)
    }

    onDismiss(notification.id)

    if (notification.page) {
      const page = notification.page.replace(/^\/+/, "")
      const route = baseRoute.replace(/^\/+|\/+$/g, "")
      router.push(`/${route}/${page}`)
    }
  }

  return (
    <article
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group/popup pointer-events-auto relative w-full overflow-hidden rounded-[22px] border border-white/70 bg-white/90 p-4 text-slate-950 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.55),0_8px_24px_-14px_rgba(79,70,229,0.35)] ring-1 ring-slate-950/[0.04] backdrop-blur-2xl duration-300 dark:border-white/[0.09] dark:bg-slate-950/90 dark:text-white dark:ring-white/[0.06] ${
        isExiting
          ? "animate-out fade-out-0 slide-out-to-right-8"
          : "animate-in fade-in-0 slide-in-from-right-8"
      }`}
    >
      <div className="pointer-events-none absolute -top-20 -right-16 size-44 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/20" />
      <div className="pointer-events-none absolute -bottom-20 left-4 size-36 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />

      <div className="relative flex items-start gap-3.5">
        <div className="relative mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_10px_25px_-8px_rgba(124,58,237,0.8)] ring-1 ring-white/40">
          <div className="absolute inset-1 rounded-xl border border-white/15" />
          <Bell className="relative size-[18px] fill-white/15" />
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full border-2 border-white bg-emerald-400 shadow-sm dark:border-slate-950">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[0.2em] text-violet-600 uppercase dark:text-violet-300">
                <Sparkles className="size-3" />
                {notification.category || "New notification"}
              </p>
              <h3 className="mt-1 line-clamp-1 text-sm leading-5 font-bold tracking-[-0.01em]">
                {notification.title || "Notification"}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismissWithAnimation}
              className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full border border-transparent text-slate-400 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-800 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-[1.2rem] text-slate-600 dark:text-slate-300">
            {notification.description || "You have a new notification."}
          </p>

          {notification.page && (
            <button
              type="button"
              onClick={openNotification}
              disabled={isOpening}
              className="group mt-3 inline-flex h-8 items-center gap-2 rounded-full border border-white/25 bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 text-[11px] font-bold text-white shadow-[0_8px_22px_-9px_rgba(109,40,217,0.8)] transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_10px_26px_-9px_rgba(109,40,217,0.95)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 disabled:cursor-wait disabled:opacity-60 dark:from-violet-500 dark:to-indigo-500 dark:hover:from-violet-400 dark:hover:to-indigo-400"
            >
              {isOpening ? "Opening..." : "View notification"}
              {!isOpening && (
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-slate-200/60 dark:bg-white/5">
        <span
          aria-hidden="true"
          className="notification-popup-progress block h-full origin-left bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500"
          style={{
            animationDuration: `${NOTIFICATION_AUTO_DISMISS_MS}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>
    </article>
  )
}

export default function NotificationPopup() {
  const { PopupNotifications, dismissPopupNotification } = useNotification()
  const { base_route } = useUserDetail()
  const visibleNotifications = PopupNotifications.slice(
    0,
    MAX_VISIBLE_NOTIFICATIONS
  )

  if (visibleNotifications.length === 0) return null

  return (
    <aside
      aria-label="Notifications"
      className="pointer-events-none fixed top-3 right-3 z-[100] flex w-[calc(100vw-1.5rem)] max-w-[380px] flex-col gap-3 sm:top-6 sm:right-6"
    >
      {visibleNotifications.map((notification) => (
        <PopupCard
          key={notification.id}
          notification={notification}
          baseRoute={base_route}
          onDismiss={dismissPopupNotification}
        />
      ))}
      {PopupNotifications.length > MAX_VISIBLE_NOTIFICATIONS && (
        <div className="pointer-events-auto self-end rounded-full border border-white/70 bg-white/90 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-lg ring-1 ring-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-300">
          +{PopupNotifications.length - MAX_VISIBLE_NOTIFICATIONS} more
        </div>
      )}
    </aside>
  )
}
