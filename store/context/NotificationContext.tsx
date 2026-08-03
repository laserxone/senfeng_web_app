"use client"

import { db } from "@/config/firebase"
import useUserDetail from "@/hooks/use-user-detail"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

export type NotificationItem = {
  id: string
  page?: string
  title?: string
  category?: string
  description?: string
  read?: boolean
  TimeStamp?: number
}

type NotificationContextType = {
  NotificationData: NotificationItem[]
  UnreadNotificationData: NotificationItem[]
  PopupNotifications: NotificationItem[]
  dismissPopupNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType>({
  NotificationData: [],
  UnreadNotificationData: [],
  PopupNotifications: [],
  dismissPopupNotification: () => {},
})

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [NotificationData, setNotificationData] = useState<NotificationItem[]>(
    []
  )

  const [UnreadNotificationData, setUnreadNotificationData] = useState<
    NotificationItem[]
  >([])

  const [PopupNotifications, setPopupNotifications] = useState<
    NotificationItem[]
  >([])

  const { userID } = useUserDetail()

  // Only documents created after this listener starts are foreground popups.
  // This avoids cached and server initial snapshots replaying old unread items.
  const unreadListenerStartedAt = useRef(0)
  const popupNotificationIds = useRef(new Set<string>())

  useEffect(() => {
    if (!userID) {
      setNotificationData([])
      return
    }

    const notificationQuery = query(
      collection(db, "Notification"),
      where("sendTo", "==", userID),
      where("read", "==", true),
      orderBy("TimeStamp", "desc"),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      notificationQuery,
      (querySnapshot) => {
        const list = querySnapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id,
        })) as NotificationItem[]

        setNotificationData(list)
      },
      (error) => {
        console.error("Read notification listener error:", error)
      }
    )

    return unsubscribe
  }, [userID])

  useEffect(() => {
    if (!userID) {
      setUnreadNotificationData([])
      setPopupNotifications([])
      popupNotificationIds.current.clear()
      unreadListenerStartedAt.current = 0
      return
    }

    unreadListenerStartedAt.current = Date.now()

    const unreadQuery = query(
      collection(db, "Notification"),
      where("sendTo", "==", userID),
      where("read", "==", false),
      orderBy("TimeStamp", "desc")
    )

    const unsubscribe = onSnapshot(
      unreadQuery,
      (querySnapshot) => {
        const unreadList = querySnapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id,
        })) as NotificationItem[]

        /*
         * Always update the header badge and notification page.
         */
        setUnreadNotificationData(unreadList)

        /*
         * Firestore can emit an initial cache snapshot followed by a server
         * snapshot. Both may report existing documents as "added", so the
         * timestamp baseline is required to exclude previously saved items.
         */
        const addedNotifications = querySnapshot
          .docChanges()
          .filter(
            (change) =>
              change.type === "added" &&
              Number(change.doc.data().TimeStamp) >=
                unreadListenerStartedAt.current
          )
          .map((change) => ({
            ...change.doc.data(),
            id: change.doc.id,
          })) as NotificationItem[]

        if (addedNotifications.length === 0) return

        /*
         * Do not show a popup when:
         * - another tab is active
         * - the browser is minimized
         * - the screen is locked
         */
        if (document.visibilityState !== "visible") return

        const notificationsToShow = addedNotifications.filter(
          (notification) => !popupNotificationIds.current.has(notification.id)
        )

        if (notificationsToShow.length === 0) return

        notificationsToShow.forEach((notification) =>
          popupNotificationIds.current.add(notification.id)
        )
        setPopupNotifications((current) => [...current, ...notificationsToShow])
      },
      (error) => {
        console.error("Unread notification listener error:", error)
      }
    )

    return unsubscribe
  }, [userID])

  const dismissPopupNotification = useCallback((id: string) => {
    setPopupNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    )
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        NotificationData,
        UnreadNotificationData,
        PopupNotifications,
        dismissPopupNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
