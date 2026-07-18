"use client";

import useUserDetail from "@/hooks/use-user-detail";
import { useNotification } from "@/store/context/NotificationContext";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export default function NotificationPopup() {
    const {
        PopupNotification,
        closePopupNotification,
    } = useNotification();

    const lastShownNotificationId = useRef<string | null>(null);
    const { base_route } = useUserDetail()

    useEffect(() => {
        if (!PopupNotification) return;

        // Prevent the same notification from appearing more than once.
        if (lastShownNotificationId.current === PopupNotification.id) return;

        lastShownNotificationId.current = PopupNotification.id;

        toast.success(PopupNotification.title || "New notification", {
            id: PopupNotification.id,
            description:
                PopupNotification.description || "You have a new notification.",
            duration: 6000,
            action: PopupNotification.page
                ? <div className="flex flex-1 justify-end items-end">
                    <Link href={PopupNotification.page ? `/${base_route}/${PopupNotification.page}` : "#"}><Button size={"sm"} variant={"outline"} className="text-black">View</Button></Link></div>


                : undefined,
            onDismiss: closePopupNotification,
            onAutoClose: closePopupNotification,
        });
    }, [PopupNotification, closePopupNotification]);

    return null;
}