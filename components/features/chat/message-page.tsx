"use client";

import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ConversationType, UserConversation } from "@/lib/types";
import { Maximize2, MessagesSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfilePicture } from "../users/profile-picture";
import Chatcomponent from "./chat-component";
import UserChatIcon from "./chatIcon";

type MessagePageProps = {
  embedded?: boolean;
  onClose?: () => void;
};

export default function MessagePage({ embedded = false, onClose }: MessagePageProps) {
  const { userID, base_route } = useUserDetail();
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loading, setLoading] = useState(false);

  const getConversation = useCallback(async (otherUserId: string | number) => {
    if (!userID) return;

    setLoading(true);
    try {
      const response = await axios.post(`/${userID}/conversations`, {
        user1: userID,
        user2: otherUserId,
      });

      if (response.data.id) {
        setSelectedConversation({
          id: response.data.id,
          user: response.data?.otherUser,
        });
      } else {
        setSelectedConversation(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    if (embedded || !userID) return;

    const syncConversationFromUrl = () => {
      const chatId = new URLSearchParams(window.location.search).get("chat");
      if (chatId) {
        void getConversation(chatId);
      } else {
        setSelectedConversation(null);
      }
    };

    syncConversationFromUrl();
    window.addEventListener("popstate", syncConversationFromUrl);

    return () => window.removeEventListener("popstate", syncConversationFromUrl);
  }, [embedded, getConversation, userID]);

  const selectUser = async (item: UserConversation) => {
    if (item.id === selectedConversation?.user?.id) return;

    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.set("chat", String(item.id));
      window.history.pushState({}, "", url);
    }

    setSelectedConversation((prevState)=>{
      if(!prevState) return prevState
      const newState = {...prevState}
      newState.user.name = item.name
      newState.user.dp = item.dp
      return newState
    })

    await getConversation(item.id);
  };

  const clearSelection = () => {
    setSelectedConversation(null);

    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <div className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)] ${embedded ? "h-full" : "h-[calc(100dvh-70px)] rounded-xl border bg-background"}`}>
      <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r bg-background`}>
        <div className="flex h-[69px] shrink-0 items-center justify-between gap-3 border-b px-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
            <p className="text-xs text-muted-foreground">Select a user to start messaging</p>
          </div>
          {embedded && onClose ? (
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onClose} aria-label="Close messages">
              <X />
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <UserChatIcon
            active={selectedConversation?.user?.id ?? null}
            className={embedded ? "h-[calc(88dvh-113px)]" : "h-[calc(100dvh-182px)]"}
            myId={userID}
            onChatSelected={(item) => void selectUser(item)}
          />
        </div>
      </aside>

      <main className={`${selectedConversation ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-muted/20`}>
        {!selectedConversation ? (
          <EmptyChat embedded={embedded} onClose={onClose} />
        ) : (
          <>
            <div className="flex h-[69px] shrink-0 items-center justify-between gap-3 border-b bg-background px-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={clearSelection} aria-label="Back to users">
                  <MessagesSquare />
                </Button>
                <ProfilePicture
                  img={selectedConversation.user?.dp}
                  name={selectedConversation.user?.name}
                  className="mr-0 size-9"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{selectedConversation.user?.name}</p>
                  <p className="text-xs text-muted-foreground">Conversation</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {embedded ? (
                  <Button asChild variant="ghost" size="icon-sm" aria-label="Open full messages page">
                    <Link href={`/${base_route}/messages?chat=${selectedConversation.user.id}`}>
                      <Maximize2 />
                    </Link>
                  </Button>
                ) : null}
                {embedded && onClose ? (
                  <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close messages">
                    <X />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <Chatcomponent
                id={selectedConversation.id}
                user={selectedConversation.user}
                stateLoading={loading}
                onSetLoading={setLoading}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyChat({ embedded, onClose }: { embedded: boolean; onClose?: () => void }) {
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8 text-center">
      {embedded && onClose ? (
        <Button variant="ghost" size="icon-sm" className="absolute right-4 top-4" onClick={onClose} aria-label="Close messages">
          <X />
        </Button>
      ) : null}
      <div className="max-w-sm">
        <span className="mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <Send className="size-8" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">No chat selected</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a user from the list to start or continue a conversation.
        </p>
      </div>
    </div>
  );
}
