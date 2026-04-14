"use client"
import { ForgetPasswordForm } from "@/components/forgetpassword-form";
import useCheckSession from "@/lib/checkSession"
import { useEffect } from "react"
export default function LoginPage() {

  const checkSession = useCheckSession()
  
    useEffect(()=>{
      checkSession().then(()=>{
        console.log("logged in")
      })
    },[])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ForgetPasswordForm />
      </div>
    </div>
  );
}
