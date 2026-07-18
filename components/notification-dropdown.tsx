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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BellNotification } from "./NotificationBadge";
import { Button } from "./ui/button";
import { useRouter } from "nextjs-toploader/app";

const ADMIN_FILTERS = ["unread", "all", "sales", "engineering", "tasks"] as const;
const USER_FILTERS = ["unread", "all"] as const;
type NotificationFilter = (typeof ADMIN_FILTERS)[number];

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

export default function NotificationDropdown() {
  const { base_route, isAdmin } = useUserDetail();
  const { NotificationData, UnreadNotificationData } = useNotification();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("unread");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [openingNotification, setOpeningNotification] = useState<string | null>(null);
  const [updatingNotification, setUpdatingNotification] = useState<string | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);

  

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

  const markAllAsRead = async () => {
    if (!UnreadNotificationData.length || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await Promise.all(
        UnreadNotificationData.map((notification) =>
          updateDoc(doc(db, "Notification", notification.id), {read : true})
          // deleteDoc(doc(db, "Notification", notification.id))
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
                {UnreadNotificationData.length > 99 ? "99+" : UnreadNotificationData.length}
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
              filteredNotifications.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.title);
                const viewLabel = getViewLabel(notification.title);

                return (
                  <div key={notification.id} className="flex gap-3 py-4">
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
                    <div className="flex shrink-0 items-center gap-1 pt-0.5">
                      {notification.read === false ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          disabled={updatingNotification === notification.id}
                          onClick={() => void markAsRead(notification.id)}
                          className="rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Bell className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Delete notification"
                        aria-label="Delete notification"
                        disabled={deletingNotification === notification.id}
                        onClick={() => void deleteNotification(notification.id)}
                        className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
