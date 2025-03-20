
"use client";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  router.push("/crm/dashboard");
}
