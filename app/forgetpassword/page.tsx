"use client"
import { ForgetPasswordForm } from "@/components/forgetpassword-form";
import Spinner from "@/components/ui/spinner";
import { UserContext } from "@/store/context/UserContext";
import { useContext } from "react";

export default function LoginPage() {

  const {loading : AuthLoading} = useContext(UserContext)

  if (AuthLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }


  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ForgetPasswordForm />
      </div>
    </div>
  );
}
