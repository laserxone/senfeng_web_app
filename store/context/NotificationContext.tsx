"use client";

import { db } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type NotificationItem = {
  id: string;
  page?: string;
  title?: string;
  category?: string;
  description?: string;
  read?: boolean;
  TimeStamp?: number;
};

type NotificationContextType = {
  NotificationData: NotificationItem[];
  UnreadNotificationData: NotificationItem[];
  PopupNotification: NotificationItem | null;
  closePopupNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  NotificationData: [],
  UnreadNotificationData: [],
  PopupNotification: null,
  closePopupNotification: () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [NotificationData, setNotificationData] = useState<
    NotificationItem[]
  >([]);

  const [UnreadNotificationData, setUnreadNotificationData] = useState<
    NotificationItem[]
  >([]);

  const [PopupNotification, setPopupNotification] =
    useState<NotificationItem | null>(null);

  const { userID } = useUserDetail();

  /*
   * This ref tracks whether the unread listener has received
   * its initial snapshot.
   */
  const unreadListenerInitialized = useRef(false);

  useEffect(() => {
    if (!userID) {
      setNotificationData([]);
      return;
    }

    const notificationQuery = query(
      collection(db, "Notification"),
      where("sendTo", "==", userID),
      where("read", "==", true),
      orderBy("TimeStamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      notificationQuery,
      (querySnapshot) => {
        const list = querySnapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id,
        })) as NotificationItem[];

        setNotificationData(list);
      },
      (error) => {
        console.error("Read notification listener error:", error);
      }
    );

    return unsubscribe;
  }, [userID]);

  useEffect(() => {
    if (!userID) {
      setUnreadNotificationData([]);
      setPopupNotification(null);
      unreadListenerInitialized.current = false;
      return;
    }

    /*
     * Reset whenever the logged-in user changes.
     * This ensures the new user's initial notifications do not create popups.
     */
    unreadListenerInitialized.current = false;

    const unreadQuery = query(
      collection(db, "Notification"),
      where("sendTo", "==", userID),
      where("read", "==", false),
      orderBy("TimeStamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (querySnapshot) => {
        const unreadList = querySnapshot.docs.map((document) => ({
          ...document.data(),
          id: document.id,
        })) as NotificationItem[];

        /*
         * Always update the header badge and notification page.
         */
        setUnreadNotificationData(unreadList);

        /*
         * Initial snapshot contains all existing unread notifications.
         * Store them in state, but do not show any popup.
         */
        if (!unreadListenerInitialized.current) {
          unreadListenerInitialized.current = true;
          return;
        }

        /*
         * Only documents added after the listener initialized
         * are considered new notifications for popup purposes.
         */
        const addedNotifications = querySnapshot
          .docChanges()
          .filter((change) => change.type === "added")
          .map((change) => ({
            ...change.doc.data(),
            id: change.doc.id,
          })) as NotificationItem[];

        if (addedNotifications.length === 0) return;

        /*
         * Do not show a popup when:
         * - another tab is active
         * - the browser is minimized
         * - the screen is locked
         */
        if (document.visibilityState !== "visible") return;

        setPopupNotification(addedNotifications[0]);
      },
      (error) => {
        console.error("Unread notification listener error:", error);
      }
    );

    return unsubscribe;
  }, [userID]);

  const closePopupNotification = () => {
    setPopupNotification(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        NotificationData,
        UnreadNotificationData,
        PopupNotification,
        closePopupNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);