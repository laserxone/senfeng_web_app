"use client";

import { BellNotification } from "@/components/shared/notifications/NotificationBadge";
import { playNotificationSound } from "@/components/shared/notifications/playNotificationSound";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMessagesNotification } from "@/hooks/use-message-notification";
import useUserDetail from "@/hooks/use-user-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChatcnMessagePage from "./chatcn-message-page";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const { conversations, loading, unreadCount } = useMessagesNotification();
  const { base_route } = useUserDetail();

  useEffect(() => {
    if (unreadCount > 0) {
      playNotificationSound();
    }
  }, [unreadCount]);

  return (
    <>
      <Button
        asChild
        size="icon"
        variant="outline"
        className="relative rounded-xl"
        aria-label="Open messages page"
      >
        <Link href={`/${base_route}/messages`}>
          <BellNotification Icon={MessageCircle} count={unreadCount} />
        </Link>
      </Button>

      {/* <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="relative hidden rounded-xl md:inline-flex"
            aria-label="Open messages"
          >
            <BellNotification Icon={MessageCircle} count={unreadCount} />
          </Button>
        </SheetTrigger>

        <SheetContent
          showCloseButton={false}
          className="h-[88dvh] w-[calc(100vw-2rem)] max-w-[72rem] min-w-[72rem] gap-0 overflow-hidden rounded-l-2xl p-0 sm:max-w-[72rem]"
        >
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>Messages</SheetTitle>
            </SheetHeader>
          </VisuallyHidden>

          <ChatcnMessagePage
            embedded
            conversations={conversations}
            conversationsLoading={loading}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet> */}
    </>
  );
}
