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

export default function NotificationDropdown({ UserState, NotificationState }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-0">
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
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                >
                  <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <Link
                    href={`/${UserState.value.data?.base_route}/${notification.page}`}
                    className="text-sm text-gray-800 hover:underline truncate max-w-[16rem]"
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
            href={`/${UserState.value.data?.base_route}/notification`}
            className="text-sm text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
