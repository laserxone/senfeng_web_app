"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { db } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import { useNotification } from "@/store/context/NotificationContext";
import { deleteDoc, doc } from "firebase/firestore";
import { Bell, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Notification() {
  const { NotificationData } = useNotification()
  const { base_route } = useUserDetail()

  const markAsRead = async (id: string) => {
    await deleteDoc(doc(db, "Notification", id));
  };

  const markAllAsRead = async () => {
    await Promise.all(
      NotificationData.map(
        async (eachNotification) =>
          await deleteDoc(doc(db, "Notification", eachNotification.id))
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
        {NotificationData.length > 0 ? (
          <>
            <Button
              onClick={markAllAsRead}
              className="self-end"
              variant="outline"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark all as read
            </Button>
            {NotificationData.map((notification) => (
              <Card
                key={notification.id}
                className="border p-3"
              >
                <CardContent className="flex justify-between items-center space-x-3 p-0">

                  <div className="flex gap-2 items-center">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <Link
                      href={`/${base_route}/${notification.page}`}
                    >
                      <span>{notification.title}</span>
                    </Link>
                  </div>

                  <Button
                    onClick={() => markAsRead(notification.id)}
                    size="sm"
                    variant="outline"
                  >
                    Mark as read
                  </Button>
                </CardContent>
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
