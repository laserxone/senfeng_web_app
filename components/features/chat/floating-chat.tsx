"use client"

import { BellNotification } from "@/components/shared/notifications/NotificationBadge"
import { playNotificationSound } from "@/components/shared/notifications/playNotificationSound"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useMessagesNotification } from "@/hooks/use-message-notification"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import MessagePage from "./message-page"

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const { conversations } = useMessagesNotification()

  useEffect(() => {
    if (conversations > 0) {
      playNotificationSound()
    }
  }, [conversations])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative rounded-xl"
          aria-label="Open messages"
        >
          <BellNotification Icon={MessageCircle} count={conversations} />
        </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className="h-[88dvh] w-[calc(100vw-2rem)] max-w-[72rem] min-w-[72rem] gap-0 overflow-hidden rounded-l-2xl p-0 sm:max-w-[72rem] sm:min-w-[rem]"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Messages</SheetTitle>
          </SheetHeader>
        </VisuallyHidden>

        <MessagePage embedded onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
