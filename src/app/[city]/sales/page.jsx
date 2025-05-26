"use client";
import { UserContext } from "@/store/context/UserContext";
import { redirect, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

export default function Page() {
  const { state: UserState } = useContext(UserContext);

  const router = useRouter();

  useEffect(() => {
    if (UserState.value.data?.id) {
      redirect(`/${UserState.value.data?.base_route}/dashboard`);
    }
  }, [UserState]);
}
