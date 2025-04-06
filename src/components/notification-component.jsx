"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { db } from "@/config/firebase";
import { NotificationContext } from "@/store/context/NotificationContext";
import { UserContext } from "@/store/context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { Bell, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useContext } from "react";

export default function Notification() {
  const { state: NotificationState } = useContext(NotificationContext);
  const {state : UserState} = useContext(UserContext)

  const markAsRead = async (id) => {
    await updateDoc(doc(db, "Notification", id), {
      read: true,
    });
  };

  const markAllAsRead = async () => {
    await Promise.all(
      NotificationState.value.data.map((eachNotification) =>
        updateDoc(doc(db, "Notification", eachNotification.id), {
          read: true,
        })
      )
    );
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Notification"
          description="Check out all your notifications"
        />
      </div>
      <div className="flex flex-col space-y-4 p-4 w-full">
        {NotificationState.value.data.length > 0 ? (
          <>
            <Button onClick={markAllAsRead} className="self-end" variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark all as read
            </Button>
            {NotificationState.value.data.map((notification) => (
              <Card
                key={notification.id}
                className="border p-3 flex items-center justify-between"
              >
                <CardContent className="flex items-center space-x-3 p-0">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <Link href={`/${UserState.value.data?.base_route}/${notification.page}`}>
                  <span
                    className={
                      notification.read ? "text-gray-500" : "text-black font-medium"
                    }
                  >
                    {notification.title}
                  </span>
                  </Link>
                </CardContent>
                {!notification.read && (
                  <Button
                    onClick={() => markAsRead(notification.id)}
                    size="sm"
                    variant="outline"
                  >
                    Mark as read
                  </Button>
                )}
              </Card>
            ))}
          </>
        ) : (
          <div className="text-center text-gray-500">No new notifications</div>
        )}
      </div>
    </div>
  );
}
