

import axios from '@/lib/axios';
import { UserContext } from '@/store/context/UserContext';
import { useContext, useEffect, useState } from 'react';

export function useTodos() {
     const [tasks, setTasks] = useState([]);
    const { state: UserState } = useContext(UserContext)

    const fetchTasks = async () => {
        const response = await axios.get(`/${UserState.value.data?.id}/todo`);
        setTasks(response.data);
    };

    useEffect(() => {
        if (UserState.value.data?.id) {
           fetchTasks()
        }

    }, [UserState]);

    return { tasks, setTasks, fetchTasks };
}
