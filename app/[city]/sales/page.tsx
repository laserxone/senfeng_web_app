"use client";
import useUserDetail from "@/hooks/use-user-detail";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { userID, base_route } = useUserDetail();

  useEffect(() => {
    if (userID && base_route) {
      redirect(`/${base_route}/dashboard`);
    }
  }, [userID, base_route]);
}
