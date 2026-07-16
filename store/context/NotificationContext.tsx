"use client";

import { db } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

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
  NotificationData: NotificationItem[]
  UnreadNotificationData: NotificationItem[]
};

const NotificationContext = createContext<NotificationContextType>({
  NotificationData: [],
  UnreadNotificationData: []
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {

  const [NotificationData, setNotificationData] = useState<NotificationItem[]>([])
  const [UnreadNotificationData, setUnreadNotificationData] = useState<NotificationItem[]>([])
  const { userID } = useUserDetail()

  useEffect(() => {
    if (userID) {
      const q = query(
        collection(db, "Notification"),
        where("sendTo", "==", userID),
        where("read", "==", true),
        orderBy("TimeStamp", "desc"),
        limit(50)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const list: NotificationItem[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as NotificationItem);
        });
        setNotificationData(list);
      });
      return () => unsubscribe();
    }
  }, [userID]);

  useEffect(() => {
    if (userID) {
      const q = query(
        collection(db, "Notification"),
        where("sendTo", "==", userID),
        where("read", "==", false),
        orderBy("TimeStamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const list: NotificationItem[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as NotificationItem);
        });
        setUnreadNotificationData(list);
      });
      return () => unsubscribe();
    }
  }, [userID]);

  return (
    <NotificationContext.Provider value={{ NotificationData, UnreadNotificationData }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
