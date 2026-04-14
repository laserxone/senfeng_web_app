"use client"
import SenfengLogoLoader from "@/components/senfengLogoLoader";
import useCheckSession from "@/lib/checkSession";
import { useEffect } from "react";

export default function Home() {
  const checkSession = useCheckSession()

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <SenfengLogoLoader />
  );
}
