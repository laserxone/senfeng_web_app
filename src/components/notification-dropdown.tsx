"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import Link from "next/link";
import { BellNotification } from "./NotificationBadge";
import { Button } from "./ui/button";
import useUserDetail from "@/hooks/use-user-detail";

export default function NotificationDropdown({ NotificationState }) {
  const { base_route } = useUserDetail()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="relative">
          <BellNotification count={NotificationState?.value?.data?.length} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-0 w-96">
        <ScrollArea className="h-60 w-full">
          <div className="p-2 space-y-2">
            {NotificationState?.value?.data
              ?.slice(0, 10)
              .map((notification) => (
                <div
                  key={notification.id}
                  className="
    flex items-center gap-2 p-2 rounded-md 
    hover:bg-gray-200 dark:hover:bg-gray-700
    transition-colors
  "
                >
                  <Bell
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                  />
                  <Link
                    href={`/${base_route}/${notification.page}`}
                    className="
      text-sm hover:underline truncate max-w-[16rem]
      text-gray-800 dark:text-gray-200
    "
                    title={notification.title}
                  >
                    {notification.title}
                  </Link>
                </div>

              ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-gray-200 text-center">
          <Link
            href={`/${base_route}/notification`}
            className="text-sm text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
