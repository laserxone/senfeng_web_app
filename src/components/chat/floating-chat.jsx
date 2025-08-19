"use client";
import { useState, useContext } from "react";
import { X, ArrowLeft, MessageCircle } from "lucide-react";
import { UserContext } from "@/store/context/UserContext";
import { Button } from "../ui/button";
import UserChatIcon from "./chatIcon";
import Chatcomponent from "./chat-component";
import axios from "@/lib/axios";
import { BadgeCount } from "../NotificationBadge";
import { useMessagesNotification } from "@/hooks/use-message-notification";

export default function FloatingChat() {
  const { state: UserState } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { conversations } = useMessagesNotification();

  const handleStartConversation = async (item) => {
    const response = await axios.post(
      `/${UserState.value.data?.id}/conversations`,
      {
        user1: UserState.value.data?.id,
        user2: item.id,
      }
    );

    if (response.data.id) {
      setSelectedConversation({
        id: response.data.id,
        user: response.data?.otherUser,
      });
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <BadgeCount count={conversations} offset={{ top: 0, right: 0 }}>
          <div
            onClick={() => setOpen((prev) => !prev)}
            className="cursor-pointer
             bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
             text-white h-[50px] w-[50px] shadow-2xl flex items-center justify-center
             hover:scale-90 active:scale-95 transition-transform duration-200 ease-in-out
             rounded-full rounded-bl-2xl relative"
          >
            <MessageCircle size={26} className="relative z-10 drop-shadow-lg" />
          </div>
        </BadgeCount>
      </div>

      <div
        className={`fixed bottom-20 right-6 w-96 h-[600px] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl flex flex-col overflow-hidden border transition-all duration-200 ${
          open ? "block" : "hidden"
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

        <div className="flex-1 overflow-hidden">
          <div
            className={`${selectedConversation ? "hidden" : "block"}`}
          >
            <UserChatIcon
              myId={UserState.value.data?.id}
              onChatSelected={(item) => {
                if (item?.id === selectedConversation?.user?.id) return;
                setLoading(true);
                handleStartConversation(item);
              }}
            />
          </div>
 
          <div
            className={`${!selectedConversation ? "hidden" : "block"} h-full`}
          >
            <Chatcomponent
              id={selectedConversation?.id}
              user={selectedConversation?.user}
              stateLoading={loading}
              onSetLoading={() => setLoading(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
