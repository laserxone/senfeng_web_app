

import { db } from '@/config/firebase';
import axios from '@/lib/axios';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import useUserDetail from './use-user-detail';
import { UserFine } from '@/lib/types';

export function useFines() {
    const [fine, setFine] = useState<UserFine | null>()
    const { userID, isAdmin } = useUserDetail()

    const fetchFines = async () => {
        const response = await axios.get(`/${userID}/fine?LIMIT=1`);
        if (response.data.length > 0) {
            setFine(response.data[0])
        }

    };

    useEffect(() => {

        if (!userID || isAdmin) return;

        const unsub = onSnapshot(
            doc(db, 'fine_notification', userID.toString()),
            () => fetchFines()
        );
        return () => {
            unsub()
        }

    }, [userID, isAdmin]);

    return { fine };
}
