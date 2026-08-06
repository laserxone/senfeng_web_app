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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/config/firebase";
import { useProfileImage } from "@/hooks/use-profile-image";
import useUserDetail from "@/hooks/use-user-detail";
import { signOut } from "firebase/auth";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
export function UserNav() {
  const { base_route, name, email, designation } = useUserDetail();

  const profileImage = useProfileImage();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="group h-11 gap-2 px-2 pr-3">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              {profileImage && (
                <AvatarImage src={profileImage} alt={"user-dp"} />
              )}
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[140px] truncate text-xs leading-tight font-semibold">
                {name}
              </p>
              <p className="max-w-[140px] truncate text-[10px] leading-tight text-muted-foreground">
                {designation}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72 rounded-xl p-2 shadow-lg"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="rounded-lg bg-muted/40 p-3 font-normal">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {profileImage && (
                  <AvatarImage src={profileImage} alt={"user-dp"} />
                )}
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm leading-none font-semibold">
                  {name}
                </p>
                <p className="mt-1 truncate text-xs leading-none text-muted-foreground">
                  {email}
                </p>
                <p className="mt-2 w-fit rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {designation}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href={`/${base_route}/profile`}>
              <DropdownMenuItem className="gap-2 rounded-lg">
                <UserRound className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 rounded-lg text-red-600 focus:text-red-600"
            onClick={() => {
              signOut(auth);
              // localStorage.removeItem('user_email');
              // router.replace("/login")
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
