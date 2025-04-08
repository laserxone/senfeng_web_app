"use client"
import { redirect, useRouter } from "next/navigation";

export default function Page (){
    const router = useRouter()
    router.push("/superadmin/dashboard")
}

