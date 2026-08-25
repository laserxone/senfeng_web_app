"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ConversationType, UserConversation } from "@/lib/types";
import { ArrowLeft, Maximize2, MessageCircleMore, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfilePicture } from "../users/profile-picture";
import ChatcnConversation from "./chatcn-conversation";
import ChatcnUserList from "./chatcn-user-list";

type Props = {
  embedded?: boolean;
  onClose?: () => void;
  conversations?: UserConversation[];
  conversationsLoading?: boolean;
};

// Kept separate from the legacy MessagePage so both messengers can coexist.
export default function ChatcnMessagePage({
  embedded = false,
  onClose,
  conversations,
  conversationsLoading,
}: Props) {
  const { userID, base_route } = useUserDetail();
  const [selected, setSelected] = useState<ConversationType | null>(null);
  const [opening, setOpening] = useState<UserConversation | null>(null);

  const openConversation = useCallback(
    async (otherUserId: string | number) => {
      if (!userID) return;
      const response = await axios.post(`/${userID}/conversations`, {
        user1: userID,
        user2: otherUserId,
      });
      setSelected(
        response.data.id
          ? { id: response.data.id, user: response.data.otherUser }
          : null,
      );
    },
    [userID],
  );

  useEffect(() => {
    if (embedded || !userID) return;
    const sync = () => {
      const chatId = new URLSearchParams(window.location.search).get("chat");
      if (chatId) void openConversation(chatId);
      else setSelected(null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [embedded, openConversation, userID]);

  const choose = async (person: UserConversation) => {
    if (person.id === selected?.user?.id || person.id === opening?.id) return;
    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.set("chat", String(person.id));
      window.history.pushState({}, "", url);
    }
    setSelected(null);
    setOpening(person);
    try {
      await openConversation(person.id);
    } finally {
      setOpening(null);
    }
  };

  const clear = () => {
    setSelected(null);
    setOpening(null);
    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({}, "", url);
    }
  };

  const activeUser = selected?.user ?? opening;
  const isOpen = Boolean(activeUser);
  const action = embedded ? (
    <div className="flex items-center gap-1">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Open full messages page"
      >
        <Link href={`/${base_route}/messages?chat=${activeUser?.id ?? ""}`}>
          <Maximize2 />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Close messages"
      >
        <X />
      </Button>
    </div>
  ) : null;

  return (
    <div
      data-chat-theme="lunar"
      className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-background shadow-sm md:grid-cols-[340px_minmax(0,1fr)] ${embedded ? "h-full rounded-none border-0" : "h-[calc(100dvh-70px)]"}`}
    >
      <aside
        className={`${isOpen ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r bg-muted/20`}
      >
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b bg-background px-5">
          <div>
            <p className="text-base font-semibold tracking-tight">Messages</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your conversations
            </p>
          </div>
          {action}
        </header>
        <ChatcnUserList
          activeId={activeUser?.id ?? null}
          userId={userID}
          conversations={conversations}
          loading={conversationsLoading}
          onSelect={(person) => void choose(person)}
        />
      </aside>
      <main
        className={`${isOpen ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-muted/30`}
      >
        {isOpen ? (
          <>
            <header className="flex h-[76px] shrink-0 items-center justify-between border-b bg-background px-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={clear}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft />
                </Button>
                <ProfilePicture
                  img={activeUser?.dp}
                  name={activeUser?.name}
                  className="mr-0 size-10"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {activeUser?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Direct message
                  </p>
                </div>
              </div>
              {action}
            </header>
            <div className="min-h-0 flex-1">
              {selected ? (
                <ChatcnConversation
                  conversationId={selected.id}
                  user={selected.user}
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" /> Opening conversation…
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid min-h-0 flex-1 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                <MessageCircleMore className="size-7" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">
                Select a conversation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose someone from the sidebar to begin.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
