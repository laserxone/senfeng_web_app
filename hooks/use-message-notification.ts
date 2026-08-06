import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";

export function useMessagesNotification() {
  const { userID } = useUserDetail();
  const [conversations, setConversations] = useState(0);

  useEffect(() => {
    if (!userID) return;

    fetchConversations();

    const unsub = onSnapshot(
      doc(db, "conversations_meta", userID.toString()),
      () => {
        fetchConversations();
      },
    );

    return () => unsub();
  }, [userID]);

  const fetchConversations = async () => {
    const response = await axios.get(`/${userID}/chat`);
    let unreadConversationsCount = 0;
    const convs = response.data.map((c: { unreadCount: number }) => {
      if (Number(c.unreadCount) > 0) {
        unreadConversationsCount++;
      }
      return c;
    });

    setConversations(unreadConversationsCount);
  };

  return { conversations };
}
