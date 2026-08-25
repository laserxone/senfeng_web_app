"use client";

import { ChatConversationItem } from "@/components/ui/chat";
import { Input } from "@/components/ui/input";
import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { UserConversation } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { Search } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  userId: number | string;
  activeId?: number | null;
  onSelect: (user: UserConversation) => void;
  conversations?: UserConversation[];
  loading?: boolean;
};

export default function ChatcnUserList({
  userId,
  activeId,
  onSelect,
  conversations: supplied,
  loading: suppliedLoading,
}: Props) {
  const [fetched, setFetched] = useState<UserConversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFetched((await axios.get(`/${userId}/chat`)).data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (supplied || !userId) return;
    void refresh();
    return onSnapshot(
      doc(db, "conversations_meta", String(userId)),
      () => void refresh(),
    );
  }, [refresh, supplied, userId]);

  const users = supplied ?? fetched;
  const visible = useMemo(
    () =>
      users.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );
  const isLoading = suppliedLoading ?? loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--chat-text-tertiary)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
            className="h-9 rounded-[10px] border-[var(--chat-border)] bg-[var(--chat-bg-main)] pl-9 text-[13px]"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {visible.map((user) => (
          <ChatConversationItem
            key={user.id}
            isActive={activeId === user.id}
            onClick={() => onSelect(user)}
            convo={{
              id: String(user.id),
              title: user.name,
              avatar: user.dp,
              lastMessage:
                user.conversation?.last_message || "Start a conversation",
              lastMessageTime: user.conversation?.last_updated
                ? moment(user.conversation.last_updated).format("MMM D, h:mm A")
                : undefined,
              unreadCount: user.conversation?.unreadCount,
            }}
          />
        ))}
        {!visible.length && (
          <p className="px-4 py-8 text-center text-sm text-[var(--chat-text-secondary)]">
            {isLoading ? "Loading users…" : "No users found"}
          </p>
        )}
      </div>
    </div>
  );
}
