"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
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
  conversations?: UserConversation[];
  conversationsLoading?: boolean;
};

export default function MessagePage({
  embedded = false,
  onClose,
  conversations,
  conversationsLoading,
}: MessagePageProps) {
  const { userID, base_route } = useUserDetail();
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [openingUser, setOpeningUser] =
    useState<UserConversation | null>(null);
  const [loading, setLoading] = useState(false);

  const getConversation = useCallback(
    async (otherUserId: string | number) => {
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
    },
    [userID],
  );

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

    return () =>
      window.removeEventListener("popstate", syncConversationFromUrl);
  }, [embedded, getConversation, userID]);

  const selectUser = async (item: UserConversation) => {
    if (
      item.id === selectedConversation?.user?.id ||
      item.id === openingUser?.id
    ) {
      return;
    }

    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.set("chat", String(item.id));
      window.history.pushState({}, "", url);
    }

    setSelectedConversation(null);
    setOpeningUser(item);
    try {
      await getConversation(item.id);
    } finally {
      setOpeningUser(null);
    }
  };

  const clearSelection = () => {
    setSelectedConversation(null);
    setOpeningUser(null);

    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({}, "", url);
    }
  };

  const activeUser = selectedConversation?.user ?? openingUser;
  const conversationOpen = Boolean(activeUser);

  return (
    <div
      className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)] ${embedded ? "h-full" : "h-[calc(100dvh-70px)] rounded-xl border bg-background"}`}
    >
      <aside
        className={`${conversationOpen ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r bg-background`}
      >
        <div className="flex h-[69px] shrink-0 items-center justify-between gap-3 border-b px-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
            <p className="text-xs text-muted-foreground">
              Select a user to start messaging
            </p>
          </div>
          {!conversationOpen ? (
            <MessagePanelActions
              embedded={embedded}
              onClose={onClose}
              href={`/${base_route}/messages`}
            />
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <UserChatIcon
            active={activeUser?.id ?? null}
            className={
              embedded ? "h-[calc(88dvh-113px)]" : "h-[calc(100dvh-182px)]"
            }
            myId={userID}
            conversations={conversations}
            loading={conversationsLoading}
            onChatSelected={(item) => void selectUser(item)}
          />
        </div>
      </aside>

      <main
        className={`${conversationOpen ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-muted/20`}
      >
        {!conversationOpen ? (
          <EmptyChat />
        ) : (
          <>
            <div className="flex h-[69px] shrink-0 items-center justify-between gap-3 border-b bg-background px-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={clearSelection}
                  aria-label="Back to users"
                >
                  <MessagesSquare />
                </Button>
                <ProfilePicture
                  img={activeUser?.dp}
                  name={activeUser?.name}
                  className="mr-0 size-9"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {activeUser?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Conversation</p>
                </div>
              </div>

              <MessagePanelActions
                embedded={embedded}
                onClose={onClose}
                href={`/${base_route}/messages?chat=${activeUser?.id}`}
              />
            </div>

            <div className="min-h-0 flex-1">
              {selectedConversation ? (
                <Chatcomponent
                  id={selectedConversation.id}
                  user={selectedConversation.user}
                  stateLoading={loading}
                  onSetLoading={setLoading}
                />
              ) : (
                <OpeningConversation />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MessagePanelActions({
  embedded,
  href,
  onClose,
}: {
  embedded: boolean;
  href: string;
  onClose?: () => void;
}) {
  if (!embedded) return null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        aria-label="Open full messages page"
        onClick={onClose}
      >
        <Link href={href}>
          <Maximize2 />
        </Link>
      </Button>
      {onClose ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close messages"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <Send className="size-8" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          No chat selected
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a user from the list to start or continue a conversation.
        </p>
      </div>
    </div>
  );
}

function OpeningConversation() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="size-5" />
      <p className="text-sm font-medium">Opening conversation...</p>
    </div>
  );
}
