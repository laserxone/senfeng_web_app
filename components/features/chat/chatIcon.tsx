"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { UserConversation } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { MessageCircle, Search } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { ProfilePicture } from "../users/profile-picture";

export default function UserChatIcon({
  myId,
  onChatSelected,
  className,
  active = null,
  conversations: providedConversations,
  loading: providedLoading,
}: {
  myId: number | string;
  onChatSelected: (val: UserConversation) => void;
  className?: string;
  active?: number | null;
  conversations?: UserConversation[];
  loading?: boolean;
}) {
  const [fetchedConversations, setFetchedConversations] =
    useState<UserConversation[]>([]);
  const [search, setSearch] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLocalLoading(true);
    try {
      const response = await axios.get(`/${myId}/chat`);
      const convs = response.data;

      setFetchedConversations(convs);
    } finally {
      setLocalLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    if (providedConversations || !myId) return;

    queueMicrotask(() => void fetchConversations());

    const unsub = onSnapshot(
      doc(db, "conversations_meta", myId.toString()),
      () => {
        fetchConversations();
      },
    );

    return () => unsub();
  }, [fetchConversations, myId, providedConversations]);

  const conversations = providedConversations ?? fetchedConversations;
  const loading = providedLoading ?? localLoading;

  const filtered = conversations.filter((item) =>
    item?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-xl bg-muted/35 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className={className}>
          {filtered.map((item, index) => (
            <button
              type="button"
              key={index}
              className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                active === item.id
                  ? "bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]"
                  : ""
              }`}
              onClick={() => onChatSelected(item)}
            >
              <div className="flex w-full items-center gap-3">
                <div className="relative shrink-0">
                  <ProfilePicture
                    img={item?.dp}
                    name={item?.name}
                    className="mr-0 size-10"
                  />
                  {item?.conversation?.unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {item?.name}
                    </p>
                    <p className="shrink-0 text-[10px] text-muted-foreground">
                      {item?.conversation?.last_updated
                        ? moment(
                            new Date(item.conversation.last_updated),
                          ).format("MMM D, h:mm A")
                        : ""}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {item?.conversation?.last_message
                        ? item.conversation.last_message
                        : "Start a conversation"}
                    </p>
                    <RenderReadCount unread={item?.conversation?.unreadCount} />
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <MessageCircle className="size-5" />
              </span>
              {loading ? (
                <p className="text-sm font-medium">Fetching users list...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">No users found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try another name.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </ScrollArea>
      </div>
    </div>
  );
}

const RenderReadCount = ({ unread }: { unread: number }) => {
  if (unread && Number(unread) > 0)
    return (
      <div className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
        {unread > 99 ? "99+" : unread}
      </div>
    );
};
