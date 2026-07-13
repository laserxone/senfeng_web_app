"use client";
import { useMessagesNotification } from "@/hooks/use-message-notification";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ConversationType, UserConversation } from "@/lib/types";
import { ArrowLeft, Maximize2, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCount, BellNotification } from "../NotificationBadge";
import { playNotificationSound } from "../playNotificationSound";
import Chatcomponent from "./chat-component";
import UserChatIcon from "./chatIcon";
import { Button } from "../ui/button";



export default function FloatingChat() {
  const { userID, base_route } = useUserDetail();
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loading, setLoading] = useState(false);
  const { conversations } = useMessagesNotification();

  const handleStartConversation = async (item: UserConversation) => {
    axios.post(`/${userID}/conversations`, {
      user1: userID,
      user2: item.id,
    }).then((response) => {
      if (response.data.id) {
        setSelectedConversation({
          id: response.data.id,
          user: response.data?.otherUser,
        });
      } else {
        setSelectedConversation(null)
      }
    })


  };

  useEffect(() => {
    if (conversations > 0) {
      playNotificationSound();
    }
  }, [conversations]);

  return (
    <>

    <Button size="icon" variant="outline" onClick={()=>setOpen((prev) => !prev)}>
      <BellNotification Icon={MessageCircle} count={conversations} />
    </Button>

      <div
        className={`absolute bottom-0 right-0 z-99  w-[calc(100vw-30px)] sm:w-96 h-[600px]
    bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col
    overflow-hidden border transition-all duration-200 z-10 sm:mx-0 ${open ? "block" : "hidden"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            {selectedConversation && (
              <div
                onClick={() => setSelectedConversation(null)}
                className="cursor-pointer hover:text-primary"
              >
                <ArrowLeft size={18} />
              </div>
            )}
            <p className="font-semibold text-sm">
              {selectedConversation
                ? selectedConversation.user?.name
                : "Messages"}
            </p>
          </div>

          <div className="flex gap-2 items-center">

          {selectedConversation &&
            <Link href={`/${base_route}/messages?chat=${selectedConversation.user.id}`}>
              <Maximize2 size={18}/>
            </Link>}
          <div
            className="cursor-pointer hover:text-red-500"
            onClick={() => {
              setOpen(false);
              setSelectedConversation(null);
            }}
          >
            <X size={18} />
          </div>
          </div>
        </div>

        <div className="flex-1">
          <div className={`${selectedConversation ? "hidden" : "block"}`}>
            <UserChatIcon
              className="h-[calc(100dvh-300px)]"
              myId={userID}
              onChatSelected={(item) => {
                if (item?.id === selectedConversation?.user?.id) return;
                setLoading(true);
                setSelectedConversation({
                  id: item.id,
                  user: {
                    name: item.name,
                    dp: item.dp,
                    id: item.id,
                    conversation: {
                      last_message: item.conversation.last_message,
                      last_updated: item.conversation.last_updated,
                      unreadCount: item.conversation.unreadCount
                    }
                  }
                });
                handleStartConversation(item);
              }}
            />
          </div>

          <div
            className={`${loading ? "block" : !selectedConversation ? "hidden" : "block"} h-full`}
          >
            <Chatcomponent

              id={selectedConversation?.id}
              user={selectedConversation?.user}
              stateLoading={loading}
              onSetLoading={(val) => setLoading(val)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
