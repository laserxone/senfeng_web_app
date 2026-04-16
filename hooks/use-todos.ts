

import axios from '@/lib/axios';
import { useEffect, useState } from 'react';
import useUserDetail from './use-user-detail';

export function useTodos() {
     const [tasks, setTasks] = useState([]);

     const {userID} = useUserDetail()

    const fetchTasks = async () => {
        const response = await axios.get(`/${userID}/todo`);
        setTasks(response.data);
    };

    useEffect(() => {
        if (userID) {
           fetchTasks()
        }

    }, [userID]);

    return { tasks, setTasks, fetchTasks };
}
