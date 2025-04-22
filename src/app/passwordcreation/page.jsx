"use client"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { auth } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { confirmPasswordReset } from "firebase/auth";
import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState([false, false]);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (password.length > 7) {
      if (validation[0] == false)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[0] = true;
          return newState;
        });
    } else {
      if (validation[0] == true)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[0] = false;
          return newState;
        });
    }

    if (!/[0-9]/.test(password)) {
      if (validation[1] == true)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[1] = false;
          return newState;
        });
    } else {
      if (validation[1] == false)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[1] = true;
          return newState;
        });
    }

    if (password == confirmPassword) {
      if (matched == false) setMatched(true);
    } else {
      if (matched == true) setMatched(false);
    }
  }, [password, confirmPassword]);

  async function handlePasswordCreation() {
    setLoading(true)
    try {
      const oobCode = new URLSearchParams(window.location.search).get(
        "oobCode"
      );
      const mode = new URLSearchParams(window.location.search).get("mode");
      const continueUrl = new URLSearchParams(window.location.search).get(
        "continueUrl"
      );
      confirmPasswordReset(auth, oobCode, password)
        .then(() => {
          setLoading(false); 
          toast({
            title: "Successs",
            description: "Password creation successfull, login to continue",
          });
          router.replace(continueUrl);
        })
        .catch((e) => {
            console.log(e)
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: e?.message || "Error password creation",
          });
        });
    } catch (error) {
        console.log(error)
    }
    // setShowSuccessfull(true);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create new password</CardTitle>
              <CardDescription>
                Enter credentials for new password
              </CardDescription>
            </CardHeader>
            <CardContent>
             
                <div className="grid gap-6">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="*********"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Confirm password</Label>
                      </div>
                      <Input
                        placeholder="*********"
                        id="confirmpassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 items-center">
                        <CircleCheck
                          color={validation[0] ? "#66b2b2" : "#CED3DB"}
                        />
                        <Label style={{color :validation[0] ? "green" : "#475467"}}>
                          Must be at least 8 characters
                        </Label>
                      </div>
                      <div className="flex flex-row gap-2 items-center">
                        <CircleCheck
                          color={validation[1] ? "#66b2b2" : "#CED3DB"}
                        />
                        <Label style={{color :validation[1] ? "green" : "#475467"}} >
                          Must contain one number
                        </Label>
                      </div>
                    </div>

                    <Button onClick={handlePasswordCreation} disabled={!validation[0] || !validation[1] || !matched} type="submit" className="w-full">
                      {loading && <Spinner />}
                      Proceed
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                      Login
                    </a>
                  </div>
                </div>
            
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
