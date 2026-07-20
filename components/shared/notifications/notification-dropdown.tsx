"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { db } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import { useNotification } from "@/store/context/NotificationContext";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import {
  Banknote,
  Bell,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Cog,
  FileText,
  HardHat,
  Inbox,
  ListTodo,
  MessageSquareText,
  PackageCheck,
  Settings,
  Trash2,
  UserRound,
  Wrench,
  X,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BellNotification } from "@/components/shared/notifications/NotificationBadge";
import { Button } from "@/components/ui/button";
import { useRouter } from "nextjs-toploader/app";

const ADMIN_FILTERS = ["unread", "all", "sales", "engineering", "tasks"] as const;
const USER_FILTERS = ["unread", "all"] as const;
const MAX_SHEET_NOTIFICATIONS = 20;
type NotificationFilter = (typeof ADMIN_FILTERS)[number];

function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return null;

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Just now";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? "hr" : "hrs"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
}

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
  [["quotation"], FileText]
];

function getNotificationIcon(title?: string) {
  const normalizedTitle = title?.toLowerCase() ?? "";
  return (
    notificationIconRules.find(([keywords]) =>
      keywords.some((keyword) => normalizedTitle.includes(keyword))
    )?.[1] ?? Bell
  );
}

function getViewLabel(title?: string) {
  const normalizedTitle = title?.toLowerCase() ?? "";
  const labels: Array<[string[], string]> = [
    [["loan"], "Loan application"],
    [["customer"], "Customer"],
    [["complaint"], "Complaint"],
    [["repair"], "Repairing task"],
    [["task"], "Task"],
    [["commission"], "Commission"],
    [["delivery"], "Delivery"],
    [["backup"], "Backup application"],
    [["payment"], "Payment"],
    [["machine"], "Machine"],
    [["part"], "Part"],
    [["feedback"], "Feedback"],
    [["quotation"], "Quotation"]
  ];

  return (
    labels.find(([keywords]) =>
      keywords.some((keyword) => normalizedTitle.includes(keyword))
    )?.[1] ?? "Notification"
  );
}

export default function NotificationSheet() {
  const { base_route, isAdmin } = useUserDetail();
  const { NotificationData, UnreadNotificationData } = useNotification();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("unread");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [openingNotification, setOpeningNotification] = useState<string | null>(null);
  const [updatingNotification, setUpdatingNotification] = useState<string | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [, refreshRelativeTimes] = useState(0);

  useEffect(() => {
    if (!sheetOpen) return;

    const interval = window.setInterval(
      () => refreshRelativeTimes((current) => current + 1),
      60_000
    );

    return () => window.clearInterval(interval);
  }, [sheetOpen]);

  

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") {
      return [...NotificationData, ...UnreadNotificationData].sort((a,b)=>  (b?.TimeStamp ?? 0) - (a.TimeStamp ?? 0));
    }

    if (activeFilter === "unread") {
      return UnreadNotificationData;
    }

    return UnreadNotificationData.filter((notification) => {
      

      if (activeFilter === "tasks") {
        return (
          notification.category?.toLowerCase() === "tasks" ||
          notification.title?.toLowerCase().includes("task")
        );
      }

      return notification.category?.toLowerCase() === activeFilter;
    });
  }, [NotificationData, activeFilter, UnreadNotificationData]);

  const visibleNotifications = filteredNotifications.slice(
    0,
    MAX_SHEET_NOTIFICATIONS
  );
  const hasMoreNotifications =
    filteredNotifications.length > MAX_SHEET_NOTIFICATIONS;

  const markAllAsRead = async () => {
    if (!UnreadNotificationData.length || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await Promise.all(
        UnreadNotificationData.map((notification) =>
          updateDoc(doc(db, "Notification", notification.id), {read : true})
        )
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (updatingNotification) return;

    setUpdatingNotification(notificationId);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      await updateDoc(doc(db, "Notification", notificationId), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      toast.error("Unable to mark notification as read");
    } finally {
      setUpdatingNotification(null);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (deletingNotification) return;

    setDeletingNotification(notificationId);
    try {
      // Allow the row's delete animation to finish before removing the document.
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      await deleteDoc(doc(db, "Notification", notificationId));
    } catch (error) {
      console.error("Failed to delete notification", error);
      toast.error("Unable to delete notification");
    } finally {
      setDeletingNotification(null);
    }
  };

  const openNotification = async (notificationId: string, page: string) => {
    if (openingNotification) return;

    setOpeningNotification(notificationId);
    try {
      await updateDoc(doc(db, "Notification", notificationId), { read: true });
      setSheetOpen(false);

      const targetPath = `/${base_route}/${page}`;
      const targetUrl = new URL(targetPath, window.location.origin);

      if (window.location.pathname === targetUrl.pathname) {
        window.history.pushState({}, "", targetUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        router.push(targetPath);
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      toast.error("Unable to open notification");
    } finally {
      setOpeningNotification(null);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative rounded-xl"
          aria-label="Open notifications"
        >
          <BellNotification count={UnreadNotificationData.length} />
        </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <SheetTitle className="text-lg font-semibold tracking-tight">
                Notifications
              </SheetTitle>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {UnreadNotificationData.length}
              </span>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close notifications">
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <SheetDescription className="text-xs">
              Your latest updates in one place
            </SheetDescription>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary"
              disabled={!UnreadNotificationData.length || isMarkingAll}
              onClick={markAllAsRead}
            >
              <CheckCheck />
              {isMarkingAll ? "Marking..." : "Mark all as read"}
            </Button>
          </div>
        </SheetHeader>

        <div className="border-b px-4 py-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(isAdmin ? ADMIN_FILTERS : USER_FILTERS).map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={activeFilter === filter ? "default" : "ghost"}
                className="rounded-full px-3 capitalize"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="divide-y px-4">
            {filteredNotifications.length > 0 ? (
              visibleNotifications.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.title);
                const viewLabel = getViewLabel(notification.title);
                const relativeTime = formatRelativeTime(notification.TimeStamp);
                const isBeingMarkedRead = updatingNotification === notification.id;
                const isBeingDeleted = deletingNotification === notification.id;

                return (
                  <div
                    key={notification.id}
                    style={
                      isBeingMarkedRead || isBeingDeleted
                        ? { animationDelay: "350ms" }
                        : undefined
                    }
                    className={`relative flex gap-3 overflow-hidden rounded-xl py-4 transition-colors motion-reduce:animate-none ${
                      isBeingMarkedRead
                        ? "animate-out fade-out slide-out-to-right-4 bg-emerald-500/10 duration-500"
                        : isBeingDeleted
                          ? "animate-out fade-out slide-out-to-right-4 bg-destructive/10 duration-500"
                          : ""
                    }`}
                  >
                    {(isBeingMarkedRead || isBeingDeleted) && (
                      <div
                        className="absolute inset-0 z-10 flex items-center justify-center border border-border/70 bg-background/90 px-5 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none dark:bg-background/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.35)]"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`grid size-10 shrink-0 place-items-center rounded-full text-white ring-4 shadow-md ${
                              isBeingMarkedRead
                                ? "bg-emerald-500 ring-emerald-500/15 shadow-emerald-500/20"
                                : "bg-red-500 ring-red-500/15 shadow-red-500/20"
                            }`}
                          >
                            {isBeingMarkedRead ? (
                              <CircleCheck className="size-5" strokeWidth={2.5} />
                            ) : (
                              <Trash2 className="size-4.5" strokeWidth={2.5} />
                            )}
                          </span>
                          <span className="text-[15px] font-semibold tracking-tight text-foreground">
                            {isBeingMarkedRead
                              ? "Marked as read"
                              : "Notification deleted"}
                          </span>
                        </div>
                      </div>
                    )}
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                      <NotificationIcon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {notification.title ? (
                        <p className="text-sm font-semibold leading-5 text-foreground">
                          {notification.title}
                        </p>
                      ) : null}
                      {notification.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {notification.description}
                        </p>
                      ) : null}
                     
                      {notification.page ? (
                        <Link
                          href={`/${base_route}/${notification.page}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/75"
                          aria-disabled={openingNotification === notification.id}
                          onClick={(event) => {
                            event.preventDefault();
                            void openNotification(notification.id, notification.page!);
                          }}
                        >
                          {openingNotification === notification.id ? "Opening..." : `View ${viewLabel}`}
                          <ChevronRight className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-1 pt-0.5">
                       {relativeTime ? (
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground/80">
                          {relativeTime}
                        </p>
                      ) : null}
                      {notification.read === false ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          disabled={isBeingMarkedRead || isBeingDeleted}
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          {isBeingMarkedRead ? (
                            <CheckCheck className="size-4 animate-in zoom-in-50 spin-in-12 duration-300 motion-reduce:animate-none" />
                          ) : (
                            <Bell className="size-4" />
                          )}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Delete notification"
                        aria-label="Delete notification"
                        disabled={isBeingDeleted || isBeingMarkedRead}
                        onClick={() => void deleteNotification(notification.id)}
                        className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2
                          className={`size-4 ${
                            isBeingDeleted
                              ? "animate-in zoom-in-50 spin-in-12 duration-300 motion-reduce:animate-none"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                );
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
                  There are no {activeFilter === "all" ? "new" : activeFilter} updates.
                </p>
              </div>
            )}
            {hasMoreNotifications ? (
              <div className="flex justify-center py-4">
                <Link
                  href={`/${base_route}/notification`}
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  View all notifications
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
