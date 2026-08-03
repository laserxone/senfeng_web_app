import axios from "@/lib/axios"
import { useEffect, useState } from "react"
import useUserDetail from "./use-user-detail"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/config/firebase"

export function useMachineDelivery() {
  const [pendingDelivery, setPendingDelivery] = useState(0)

  const { userID } = useUserDetail()

  const fetchData = async () => {
    const response = await axios.get(`/${userID}/delivery`)
    setPendingDelivery(response.data?.length || 0)
  }

  useEffect(() => {
    if (!userID) return
    fetchData()

    const unsub = onSnapshot(doc(db, "machine-delivery", "delivery"), () => {
      fetchData()
    })

    return () => unsub()
  }, [userID])

  return { pendingDelivery, setPendingDelivery, fetchData }
}
