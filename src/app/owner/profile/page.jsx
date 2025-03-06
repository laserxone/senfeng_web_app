"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
  const { state: UserState } = useContext(UserContext);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      setName(UserState.value.data.name);
      setImage(UserState.value.data.dp);
    }
  }, [UserState?.value?.data]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // setLoading(true)
    console.log("pressed")
   
  };

  function checkStatus() {
    return (
      name !== UserState?.value?.data?.name ||
      image !== UserState?.value?.data?.dp
    );
  }

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({
        description: "Password changed successfully"
      });
    } catch (error) {
        console.log(error.message)
        toast({
            variant: "destructive",
            title: "Error",
            description: error?.message || "Error updating password"
          });
      
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
                <AvatarImage src={image} alt={name} />
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
            <Button
              disabled={!checkStatus()}
              onClick={handleSave}
              className="w-full"
            >
              {loading && <Loader2 className="animate-spin" />}
              Save Changes
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Change Password</DialogTitle>
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
                  {passwordLoading && <Loader2 className="animate-spin" />}{" "}
                  Submit
                </Button>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
