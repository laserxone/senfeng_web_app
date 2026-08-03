import { db } from "@/config/firebase"
import axios from "@/lib/axios"
import { doc, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import useUserDetail from "./use-user-detail"
import { Messages } from "@/lib/types"

export function useMessages(conversationId: number | string | undefined) {
  const [messages, setMessages] = useState<Messages[]>([])
  const [loading, setLoading] = useState(true)
  const { userID } = useUserDetail()

  const fetchMessages = async () => {
    const response = await axios.get(
      `/${userID}/conversations/${conversationId}`
    )
    setMessages(response.data)
    setLoading(false)
  }

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    fetchMessages()

    const unsub = onSnapshot(
      doc(db, "messages_meta", conversationId.toString()),
      () => fetchMessages()
    )

    return () => {
      unsub()
      setLoading(true)
    }
  }, [conversationId])

  return { messages, loading }
}
