import { db } from "@/config/firebase";
import { UserContext } from "@/store/context/UserContext";
import { doc, onSnapshot } from "firebase/firestore";
import { useContext, useState, useEffect } from "react";
import axios from "@/lib/axios";


export function useMessagesNotification() {

    const { state: UserState } = useContext(UserContext)
    const [conversations, setConversations] = useState(0);


    useEffect(() => {
        if (!UserState.value.data?.id) return;

        fetchConversations();

        const unsub = onSnapshot(
            doc(db, "conversations_meta", UserState.value.data?.id.toString()),
            () => {
                fetchConversations();
            }
        );

        return () => unsub();
    }, [UserState]);

    const fetchConversations = async () => {
        const response = await axios.get(`/${UserState.value.data?.id}/chat`);
        let unreadConversationsCount = 0;
        const convs = response.data.map((c) => {
            if (Number(c.unreadCount) > 0) {
                unreadConversationsCount++;
            }
            return c;
        });

        setConversations(unreadConversationsCount);
    };

    return { conversations };

}