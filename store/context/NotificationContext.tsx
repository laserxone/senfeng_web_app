"use client";

import { db } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

type NotificationItem = {
  id : string
  page:  string
  title : string
}

type NotificationContextType = {
    NotificationData: NotificationItem[]
};

const NotificationContext = createContext<NotificationContextType>({
    NotificationData: []
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {

    const [NotificationData, setNotificationData] = useState<NotificationItem[]>([])
    const {userID} = useUserDetail()

    useEffect(() => {
    if (userID) {
      const q = query(
        collection(db, "Notification"),
        where("sendTo", "==", userID),
        where("read", "==", false),
        orderBy("TimeStamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let list : any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });
        setNotificationData(list);
      });
      return () => unsubscribe();
    }
  }, [userID]);

    return (
        <NotificationContext.Provider value={{ NotificationData }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
