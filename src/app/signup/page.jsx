"use client"
import { SignupForm } from "@/components/signup-form";
import useCheckSession from "@/lib/checkSession"
import { useEffect } from "react"

export default function Page() {
  const checkSession = useCheckSession()
  useEffect(()=>{
      checkSession().then(()=>{
        console.log("logged in")
      })
    },[])
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <SignupForm />
      </div>
    </div>
  )
}