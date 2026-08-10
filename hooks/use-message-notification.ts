import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { UserConversation } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import useUserDetail from "./use-user-detail";

export function useMessagesNotification() {
  const { userID } = useUserDetail();
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!userID) return;

    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/chat`);
      setConversations(response.data);
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    if (!userID) {
      setConversations([]);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void fetchConversations(), 150);
    };

    const unsub = onSnapshot(
      doc(db, "conversations_meta", userID.toString()),
      refresh,
    );

    refresh();
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [fetchConversations, userID]);

  const unreadCount = useMemo(
    () =>
      conversations.filter(
        (conversation) => Number(conversation.conversation?.unreadCount) > 0,
      ).length,
    [conversations],
  );

  return { conversations, loading, unreadCount };
}
