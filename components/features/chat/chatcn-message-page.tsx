"use client";

import { ChatComposer, ChatMessages, ChatProvider } from "@/components/ui/chat";
import type { ChatMessageData } from "@/components/ui/chat";
import { useMessages } from "@/hooks/use-messages";
import { useMessagesNotification } from "@/hooks/use-message-notification";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TriggerFirebase } from "@/lib/triggerFirebase";
import { ConversationType, Messages, UserConversation } from "@/lib/types";
import { ChevronLeft, Search, X } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageContentViewer } from "./message-content-viewer";

type Props = {
  embedded?: boolean;
  onClose?: () => void;
  conversations?: UserConversation[];
  conversationsLoading?: boolean;
};
type StructuredContent = { content?: unknown[]; type?: string };

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function ChatcnMessagePage({
  embedded = false,
  onClose,
  conversations: supplied,
  conversationsLoading: suppliedLoading,
}: Props) {
  const { userID, name } = useUserDetail();
  const { conversations: fetched, loading: fetchedLoading } =
    useMessagesNotification();
  const conversations = supplied ?? fetched;
  const [selected, setSelected] = useState<ConversationType | null>(null);
  const [opening, setOpening] = useState<UserConversation | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageData | null>(null);
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedContent, setSelectedContent] =
    useState<StructuredContent | null>(null);
  const { messages, hasMore, loadOlder } = useMessages(selected?.id);
  const [pendingMessages, setPendingMessages] = useState<ChatMessageData[]>([]);
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<string, NonNullable<ChatMessageData["reactions"]>>
  >({});

  const openConversation = useCallback(
    async (person: UserConversation) => {
      if (!userID) return;
      setSelected(null);
      setOpening(person);
      try {
        const response = await axios.post(`/${userID}/conversations`, {
          user1: userID,
          user2: person.id,
        });
        if (response.data.id) {
          setSelected({ id: response.data.id, user: response.data.otherUser });
        }
      } finally {
        setOpening(null);
      }
    },
    [userID],
  );

  useEffect(() => {
    if (embedded || !userID) return;
    const sync = () => {
      const chatId = new URLSearchParams(window.location.search).get("chat");
      const person = conversations.find((item) => String(item.id) === chatId);
      if (
        person &&
        String(selected?.user.id) !== String(person.id) &&
        String(opening?.id) !== String(person.id)
      ) {
        void openConversation(person);
      } else if (!chatId) {
        setSelected(null);
        setOpening(null);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [conversations, embedded, openConversation, opening, selected, userID]);

  useEffect(() => {
    setPendingMessages((current) => {
      const remaining = [...messages];
      return current.filter((pending) => {
        const matchIndex = remaining.findIndex(
          (message) =>
            String(message.sender_id) === pending.senderId &&
            message.message === pending.text &&
            Math.abs(
              new Date(message.created_at).getTime() -
                new Date(pending.timestamp).getTime(),
            ) < 5_000,
        );
        if (matchIndex < 0) return true;
        remaining.splice(matchIndex, 1);
        return false;
      });
    });

    setReactionOverrides((current) => {
      const remaining = { ...current };
      for (const [messageId, optimistic] of Object.entries(current)) {
        const saved = messages.find(
          (message) => String(message.id) === messageId,
        );
        if (
          saved &&
          JSON.stringify(
            [...(saved.reactions ?? [])]
              .map((reaction) => ({
                ...reaction,
                userIds: [...reaction.userIds].map(String).sort(),
              }))
              .sort((first, second) => first.emoji.localeCompare(second.emoji)),
          ) ===
            JSON.stringify(
              [...optimistic]
                .map((reaction) => ({
                  ...reaction,
                  userIds: [...reaction.userIds].sort(),
                }))
                .sort((first, second) =>
                  first.emoji.localeCompare(second.emoji),
                ),
            )
        ) {
          delete remaining[messageId];
        }
      }
      return remaining;
    });
  }, [messages]);

  useEffect(() => {
    if (
      !selected ||
      !messages.some(
        (item) => Number(item.sender_id) !== Number(userID) && !item.is_read,
      )
    )
      return;
    void axios.put(`/${userID}/conversations/${selected.id}/read`, {
      userId: selected.user.id,
    });
  }, [messages, selected, userID]);

  const chatMessages = useMemo(
    () =>
      [
        ...messages.map((message: Messages): ChatMessageData => ({
          id: String(message.id),
          senderId: String(message.sender_id),
          text: message.message,
          data: typeof message.data === "string" ? message.data : undefined,
          linkPreview: message.link_preview ?? undefined,
          senderName:
            Number(message.sender_id) === Number(userID)
              ? name || "You"
              : selected?.user.name || "User",
          timestamp: new Date(message.created_at),
          status: message.is_read ? "read" : "sent",
          replyTo: message.reply_to
            ? {
                id: String(message.reply_to.id),
                senderName:
                  Number(message.reply_to.sender_id) === Number(userID)
                    ? name || "You"
                    : selected?.user.name || "User",
                text: message.reply_to.message,
              }
            : undefined,
          reactions: message.reactions?.map((reaction) => ({
            emoji: reaction.emoji,
            userIds: reaction.userIds.map(String),
            count: reaction.userIds.length,
          })),
        })),
        ...pendingMessages,
      ].map((message) => ({
        ...message,
        reactions: reactionOverrides[message.id] ?? message.reactions,
      })),
    [messages, name, pendingMessages, reactionOverrides, selected, userID],
  );

  const visibleMessages = messageSearch.trim()
    ? chatMessages.filter((message) =>
        message.text
          ?.toLowerCase()
          .includes(messageSearch.trim().toLowerCase()),
      )
    : chatMessages;

  const refresh = async () => {
    if (!selected) return;
    await TriggerFirebase(String(selected.id), String(selected.user.id));
    await TriggerFirebase("", String(userID));
  };

  const send = async (text: string) => {
    if (!selected) return;
    const createdAt = new Date();
    const pendingId = `pending-${createdAt.getTime()}`;
    const replyTo = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text || "",
        }
      : undefined;
    setPendingMessages((current) => [
      ...current,
      {
        id: pendingId,
        senderId: String(userID),
        senderName: name || "You",
        text,
        timestamp: createdAt,
        status: "sending",
        replyTo,
      },
    ]);
    setReplyingTo(null);
    try {
      await axios.post(`/${userID}/conversations/${selected.id}`, {
        senderId: userID,
        message: text,
        created_at: createdAt,
        replyToMessageId: replyingTo?.id,
      });
      await refresh();
    } catch {
      setPendingMessages((current) =>
        current.filter((message) => message.id !== pendingId),
      );
    }
  };

  const react = async (messageId: string, emoji: string, remove: boolean) => {
    if (!selected) return;
    const message = chatMessages.find((item) => item.id === messageId);
    const previous = message?.reactions ?? [];
    const optimistic = previous
      .map((reaction) => ({ ...reaction, userIds: [...reaction.userIds] }))
      .filter((reaction) => reaction.emoji !== emoji);
    const matching = previous.find((reaction) => reaction.emoji === emoji);
    const userId = String(userID);
    const userIds = new Set(matching?.userIds ?? []);
    if (remove) userIds.delete(userId);
    else userIds.add(userId);
    if (userIds.size) {
      optimistic.push({ emoji, userIds: [...userIds], count: userIds.size });
    }
    setReactionOverrides((current) => ({
      ...current,
      [messageId]: optimistic,
    }));
    try {
      await axios({
        method: remove ? "delete" : "post",
        url: `/${userID}/conversations/${selected.id}/reactions`,
        data: { messageId, userId: userID, emoji },
      });
      await refresh();
    } catch {
      setReactionOverrides((current) => ({
        ...current,
        [messageId]: previous,
      }));
    }
  };

  const choose = async (person: UserConversation) => {
    if (person.id === selected?.user.id) return;
    if (!embedded) {
      const url = new URL(window.location.href);
      url.searchParams.set("chat", String(person.id));
      window.history.pushState({}, "", url);
    }
    setReplyingTo(null);
    setPendingMessages([]);
    setReactionOverrides({});
    await openConversation(person);
  };

  const visibleConversations = conversations.filter((person) =>
    person.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const isOpen = Boolean(selected || opening);
  const isLoading = suppliedLoading ?? fetchedLoading;

  return (
    <ChatProvider
      currentUser={{ id: String(userID), name: name || "You" }}
      theme="lunar"
      onReply={setReplyingTo}
      onReactionAdd={(id, emoji) => void react(id, emoji, false)}
      onReactionRemove={(id, emoji) => void react(id, emoji, true)}
      onContentOpen={(message) => {
        try {
          const content = JSON.parse(message.data || "") as StructuredContent;
          setSelectedContent(content);
        } catch {
          setSelectedContent(null);
        }
      }}
      className={`${embedded ? "h-full" : "h-[calc(100dvh-70px)]"} flex min-h-0 overflow-hidden rounded-xl border border-[var(--chat-border-strong)] bg-[var(--chat-bg-app)] w-full`}
    >
      <aside
        className={`${isOpen ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[var(--chat-border-strong)] bg-[var(--chat-bg-sidebar)] md:w-[300px]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--chat-border)] px-4 py-3">
          <span className="text-[15px] font-semibold text-[var(--chat-text-primary)]">
            Messages
          </span>
          {onClose ? (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-[var(--chat-text-secondary)] hover:bg-[var(--chat-accent-soft)]"
              aria-label="Close messages"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="px-3 py-2">
          <label className="flex items-center gap-2 rounded-lg bg-[var(--chat-bg-main)] px-3 py-1.5">
            <Search className="size-3.5 text-[var(--chat-text-tertiary)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--chat-text-primary)] outline-none placeholder:text-[var(--chat-text-tertiary)]"
            />
            {search ? (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X className="size-3 text-[var(--chat-text-tertiary)]" />
              </button>
            ) : null}
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {visibleConversations.map((person) => (
            <button
              key={person.id}
              onClick={() => void choose(person)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--chat-accent-soft)]"
              style={{
                background:
                  selected?.user.id === person.id
                    ? "var(--chat-accent-soft)"
                    : "transparent",
              }}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--chat-bubble-incoming)] text-[11px] font-semibold text-[var(--chat-text-primary)]">
                {initials(person.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-[var(--chat-text-primary)]">
                    {person.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-[var(--chat-text-tertiary)]">
                    {person.conversation?.last_updated
                      ? moment(person.conversation.last_updated).format(
                          "h:mm A",
                        )
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="truncate text-[12px] text-[var(--chat-text-secondary)]">
                    {person.conversation?.last_message ||
                      "Start a conversation"}
                  </span>
                  {Number(person.conversation?.unreadCount) > 0 ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--chat-accent)] text-[10px] font-semibold text-white">
                      {person.conversation.unreadCount > 99
                        ? "99+"
                        : person.conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
          {!visibleConversations.length ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--chat-text-secondary)]">
              {isLoading ? "Loading conversations…" : "No conversations found"}
            </p>
          ) : null}
        </div>
      </aside>
      <main
        className={`${isOpen ? "flex" : "hidden md:flex"} min-h-0 flex-1 flex-col bg-[var(--chat-bg-main)]`}
      >
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-[var(--chat-border)] bg-[var(--chat-bg-header)] px-4 py-3">
              <button
                onClick={() => {
                  if (!embedded) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("chat");
                    window.history.replaceState({}, "", url);
                  }
                  setSelected(null);
                  setOpening(null);
                }}
                className="text-[var(--chat-text-secondary)] md:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--chat-bubble-incoming)] text-sm font-semibold text-[var(--chat-text-primary)]">
                {initials(selected.user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[var(--chat-text-primary)]">
                  {selected.user.name}
                </p>
                <p className="text-[12px] text-[var(--chat-text-secondary)]">
                  Direct message
                </p>
              </div>
              <label className="hidden items-center gap-1.5 rounded-lg bg-[var(--chat-bg-main)] px-2 py-1 md:flex">
                <Search className="size-3.5 text-[var(--chat-text-tertiary)]" />
                <input
                  value={messageSearch}
                  onChange={(event) => setMessageSearch(event.target.value)}
                  placeholder="Search messages"
                  className="w-32 bg-transparent text-[12px] text-[var(--chat-text-primary)] outline-none placeholder:text-[var(--chat-text-tertiary)]"
                />
                {messageSearch ? (
                  <button
                    onClick={() => setMessageSearch("")}
                    aria-label="Clear message search"
                  >
                    <X className="size-3 text-[var(--chat-text-tertiary)]" />
                  </button>
                ) : null}
              </label>
            </header>
            <ChatMessages
              messages={visibleMessages}
              hasMore={!messageSearch.trim() && hasMore}
              onLoadMore={loadOlder}
            />
            <ChatComposer
              className="w-full"
              onSend={(text) => void send(text)}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : opening ? (
          <div className="grid flex-1 place-items-center text-[14px] text-[var(--chat-text-secondary)]">
            <span>Opening conversation with {opening.name}…</span>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center text-[14px] text-[var(--chat-text-secondary)]">
            Select a conversation
          </div>
        )}
      </main>
      <MessageContentViewer
        visible={!!selectedContent}
        data={selectedContent?.content ?? []}
        type={selectedContent?.type ?? ""}
        onClose={() => setSelectedContent(null)}
      />
    </ChatProvider>
  );
}
