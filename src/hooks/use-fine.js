

import { db } from '@/config/firebase';
import axios from '@/lib/axios';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import useUserDetail from './use-user-detail';

export function useFines() {
    const [fine, setFine] = useState({})
    const { userID } = useUserDetail()

    const fetchFines = async () => {
        const response = await axios.get(`/${userID}/fine?LIMIT=1`);
        setFine(response.data)
    };

    useEffect(() => {
        if (!userID)
            return
        const unsub = onSnapshot(
            doc(db, 'fine_notification', userID.toString()),
            () => fetchFines()
        );
        return () => {
            unsub()
        }

    }, [userID]);

    return { fine };
}
