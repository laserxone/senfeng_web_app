"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/config/firebase";
import { useProfileImage } from "@/hooks/use-profile-image";
import { UserContext } from "@/store/context/UserContext";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext } from "react";
export function UserNav() {
  const { state: UserState } = useContext(UserContext);
  const router = useRouter();
  const profileImage = useProfileImage()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage} alt={"user-dp"} />
            <AvatarFallback>
              {UserState?.value?.data?.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {UserState?.value?.data?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {UserState?.value?.data?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
        <Link href={`/${UserState?.value?.data?.base_route}/profile`}>
          <DropdownMenuItem>
            
              Profile
           
          </DropdownMenuItem>
          </Link>
          <Link href={`/${UserState?.value?.data?.base_route}/notification`}>
          <DropdownMenuItem>Notifications</DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(auth)}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
