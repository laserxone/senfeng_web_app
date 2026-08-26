import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import useUserDetail from "./use-user-detail";
import { Messages } from "@/lib/types";

export function useMessages(conversationId: number | string | undefined) {
  const [messages, setMessages] = useState<Messages[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const { userID } = useUserDetail();
  const requestId = useRef(0);
  const hasLoadedInitialPage = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !userID) return;
    const currentRequest = ++requestId.current;
    const response = await axios.get(
      `/${userID}/conversations/${conversationId}?limit=30`,
    );
    if (currentRequest !== requestId.current) return;
    const page = response.data as { messages: Messages[]; hasMore: boolean };
    const isInitialPage = !hasLoadedInitialPage.current;
    hasLoadedInitialPage.current = true;
    setMessages((current) => {
      if (isInitialPage) return page.messages;
      const latestIds = new Set(
        page.messages.map((message) => String(message.id)),
      );
      return [
        ...current.filter((message) => !latestIds.has(String(message.id))),
        ...page.messages,
      ].sort(
        (first, second) =>
          new Date(first.created_at).getTime() -
            new Date(second.created_at).getTime() ||
          Number(first.id) - Number(second.id),
      );
    });
    setHasMore((current) =>
      isInitialPage ? page.hasMore : current && page.hasMore,
    );
    setLoading(false);
  }, [conversationId, userID]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !userID || loadingOlder || !hasMore || !messages[0])
      return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const response = await axios.get(
        `/${userID}/conversations/${conversationId}?limit=30&beforeCreatedAt=${encodeURIComponent(new Date(oldest.created_at).toISOString())}&beforeId=${oldest.id}`,
      );
      const page = response.data as { messages: Messages[]; hasMore: boolean };
      setMessages((current) => {
        const existing = new Set(current.map((message) => String(message.id)));
        return [
          ...page.messages.filter(
            (message) => !existing.has(String(message.id)),
          ),
          ...current,
        ];
      });
      setHasMore(page.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, loadingOlder, messages, userID]);

  useEffect(() => {
    if (!conversationId) {
      requestId.current += 1;
      hasLoadedInitialPage.current = false;
      setMessages([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    requestId.current += 1;
    hasLoadedInitialPage.current = false;
    setMessages([]);
    setHasMore(false);
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void fetchMessages(), 100);
    };

    const unsub = onSnapshot(
      doc(db, "messages_meta", conversationId.toString()),
      refresh,
    );

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsub();
      setLoading(true);
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    hasMore,
    loadingOlder,
    loadOlder,
    refreshMessages: fetchMessages,
  };
}
