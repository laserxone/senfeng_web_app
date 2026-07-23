"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";

import useUserDetail from "@/hooks/use-user-detail";
import { UserContext } from "@/store/context/UserContext";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const { state: UserState } = useContext(UserContext);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) {
      setName(UserState.value.data?.name ?? "");
      setImage(UserState.value.data?.dp ?? "");
    }
  }, [userID]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function checkStatus() {
    return (
      name !== UserState.value.data?.name || image !== UserState.value.data?.dp
    );
  }

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user?.email) return
    const credential = EmailAuthProvider.credential(
      user?.email,
      currentPassword
    );

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password changed successfully");
    } catch (error: any) {
      console.log(error.message);
      toast.error(error?.message || "Error updating password");
    }
    setPasswordLoading(false);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Profile</CardTitle>
            <CardDescription>Edit your profile here</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <label htmlFor="profile-pic" className="cursor-pointer">
              <Avatar className="h-20 w-20">
               {image && <AvatarImage src={image} alt={name} />}
                <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </label>
            <input
              id="profile-pic"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
                <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3"><DialogTitle className="text-sm font-semibold text-foreground">Change Password</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="space-y-3 p-3.5 pb-4">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                />
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading && <Spinner />}
                  Submit
                </Button>
                </div></ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
