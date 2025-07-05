

import { useState, useEffect, useContext } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import axios from '@/lib/axios';
import { db } from '@/config/firebase';
import { UserContext } from '@/store/context/UserContext';

export function useMessages(conversationId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true)
    const { state: UserState } = useContext(UserContext)

    const fetchMessages = async () => {
        const response = await axios.get(`/${UserState.value.data?.id}/conversations/${conversationId}`);
        setMessages(response.data);
        setLoading(false)
    };

    useEffect(() => {
        if (!conversationId) {
            setMessages([])
            return
        }

        fetchMessages();

        const unsub = onSnapshot(
            doc(db, 'messages_meta', conversationId.toString()),
            () => fetchMessages()
        );

        return () => {
            unsub()
            setLoading(true)
        }

    }, [conversationId]);

    return { messages, loading };
}
