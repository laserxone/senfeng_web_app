import { cn } from "@/lib/utils";
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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/config/firebase";
import { Loader2 } from "lucide-react";

export function ForgetPasswordForm({ className, ...props }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetEmail(event) {
    setLoading(true);
    event.preventDefault();
    await sendPasswordResetEmail(auth, email, {
      url : `https://senfeng-web.vercel.app/login`
    })
      .then(() => {
        toast({
          title: "Email sent",
          description: "Check your email for reset link.",
        });
      })
      .catch((err) => {
        console.log(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: err?.message || "Error sending reset link",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgor your password?</CardTitle>
          <CardDescription>
            Enter your credentials to receive password resest link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetEmail}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {loading && <Loader2 className="animate-spin" />}
                  Reset
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  );
}
