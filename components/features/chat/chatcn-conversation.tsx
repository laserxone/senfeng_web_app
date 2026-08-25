"use client";

import { ChatComposer, ChatMessages, ChatProvider } from "@/components/ui/chat";
import { useMessages } from "@/hooks/use-messages";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TriggerFirebase } from "@/lib/triggerFirebase";
import { Messages, UserConversation } from "@/lib/types";
import type { ChatMessageData } from "@/components/ui/chat";
import { useEffect, useMemo, useState } from "react";

type Props = { conversationId: number; user: UserConversation };

export default function ChatcnConversation({ conversationId, user }: Props) {
  const { userID, name, userDp } = useUserDetail();
  const { messages, loading } = useMessages(conversationId);
  const [replyingTo, setReplyingTo] = useState<ChatMessageData | null>(null);
  const [pending, setPending] = useState<ChatMessageData[]>([]);

  const chatMessages = useMemo(() => {
    const mapMessage = (message: Messages): ChatMessageData => ({
      id: String(message.id),
      senderId: String(message.sender_id),
      senderName:
        Number(message.sender_id) === Number(userID)
          ? name || "You"
          : user.name,
      senderAvatar:
        Number(message.sender_id) === Number(userID) ? userDp : user.dp,
      text: message.message,
      timestamp: new Date(message.created_at),
      status: message.pending ? "sending" : "sent",
      replyTo: message.reply_to
        ? {
            id: String(message.reply_to.id),
            senderName:
              Number(message.reply_to.sender_id) === Number(userID)
                ? name || "You"
                : user.name,
            text: message.reply_to.message,
          }
        : undefined,
      reactions: message.reactions?.map((reaction) => ({
        emoji: reaction.emoji,
        userIds: reaction.userIds.map(String),
        count: reaction.userIds.length,
      })),
    });
    return [...messages.map(mapMessage), ...pending];
  }, [messages, name, pending, user, userDp, userID]);

  useEffect(() => {
    const hasUnread = messages.some(
      (message) =>
        Number(message.sender_id) !== Number(userID) && !message.is_read,
    );
    if (hasUnread)
      void axios.put(`/${userID}/conversations/${conversationId}/read`, {
        userId: user.id,
      });
  }, [conversationId, messages, user.id, userID]);

  const refresh = async () => {
    await TriggerFirebase(String(conversationId), String(user.id));
    await TriggerFirebase("", String(userID));
  };

  const send = async (text: string) => {
    const replyId = replyingTo?.id;
    const optimistic: ChatMessageData = {
      id: `pending-${Date.now()}`,
      senderId: String(userID),
      senderName: name || "You",
      senderAvatar: userDp,
      text,
      timestamp: new Date(),
      status: "sending",
      replyTo:
        replyingTo?.replyTo ??
        (replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.senderName,
              text: replyingTo.text || "",
            }
          : undefined),
    };
    setPending((current) => [...current, optimistic]);
    setReplyingTo(null);
    try {
      await axios.post(`/${userID}/conversations/${conversationId}`, {
        senderId: userID,
        message: text,
        created_at: new Date(),
        replyToMessageId: replyId,
      });
      await refresh();
      setPending((current) =>
        current.filter((message) => message.id !== optimistic.id),
      );
    } catch {
      setPending((current) =>
        current.filter((message) => message.id !== optimistic.id),
      );
    }
  };

  const react = async (messageId: string, emoji: string, remove: boolean) => {
    await axios({
      method: remove ? "delete" : "post",
      url: `/${userID}/conversations/${conversationId}/reactions`,
      data: { messageId, userId: userID, emoji },
    });
    await refresh();
  };

  if (loading)
    return (
      <div className="grid h-full place-items-center text-sm text-[var(--chat-text-secondary)]">
        Loading messages…
      </div>
    );

  return (
    <ChatProvider
      currentUser={{ id: String(userID), name: name || "You", avatar: userDp }}
      theme="lunar"
      onReply={setReplyingTo}
      onReactionAdd={(messageId, emoji) => void react(messageId, emoji, false)}
      onReactionRemove={(messageId, emoji) =>
        void react(messageId, emoji, true)
      }
      className="flex h-full min-h-0 flex-col"
    >
      <ChatMessages messages={chatMessages} />
      <ChatComposer
        onSend={(text) => void send(text)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={!userID}
      />
    </ChatProvider>
  );
}
