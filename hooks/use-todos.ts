import axios from "@/lib/axios"
import { useEffect, useState } from "react"
import useUserDetail from "./use-user-detail"

type TodoProps = {
  id: number
  title: string
  is_done: boolean
  created_at?: string
}

export function useTodos() {
  const [tasks, setTasks] = useState<TodoProps[]>([])

  const { userID } = useUserDetail()

  const fetchTasks = async () => {
    const response = await axios.get(`/${userID}/todo`)
    setTasks(response.data)
  }

  useEffect(() => {
    if (userID) {
      fetchTasks()
    }
  }, [userID])

  return { tasks, setTasks, fetchTasks }
}
