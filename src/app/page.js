"use client"
import useCheckSession from "@/lib/checkSession";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  const checkSession = useCheckSession()

  useEffect(() => {
    checkSession()
  }, [])
  return (
    <div className="flex flex-1 justify-center items-center min-h-screen">
      <Loader2 className="animate-spin" />
    </div>
  );
}
