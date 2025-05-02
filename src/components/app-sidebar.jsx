"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { Icons } from "@/components/icons";
import { auth, db } from "@/config/firebase";
import { useProfileImage } from "@/hooks/use-profile-image";
import useCheckSession from "@/lib/checkSession";
import { NotificationContext } from "@/store/context/NotificationContext";
import { UserContext } from "@/store/context/UserContext";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  Bell,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBadge from "./NotificationBadge";
import NotificationBadgeWithoutCount from "./NotificationBadgeWithoutCount";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContext, useEffect } from "react";

export const company = {
  name: "SENFENG",
  logo: "/logo.png",
  plan: "Pakistan",
};

export default function AppSidebar() {
  const pathname = usePathname();
  const checkSession = useCheckSession();
  const { state: UserState, setUser } = useContext(UserContext);
  const { state: NotificationState, setNotification } =
    useContext(NotificationContext);
  const profileImage = useProfileImage();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkSession().then((val) => {
      if (val?.user) {
        setUser(val.user);
      }
    });
  }, []);

  useEffect(() => {
    if (UserState?.value?.data?.email) {
      const q = query(
        collection(db, "Notification"),
        where("sendTo", "==", UserState.value.data.id),
        where("read", "==", false),
        orderBy("TimeStamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });
        setNotification(list);
      });
      return () => unsubscribe();
    }
  }, [UserState]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex w-full align-center justify-center">
          <img
            src={company.logo}
            alt="SENFENG LOGO"
            className="w-full h-full object-cover"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup> 
          <SidebarMenu>
            {UserState.value.data?.nav_items &&
              UserState.value.data?.nav_items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname.includes(item.url)}
                        >
                          {item.icon && <Icon />}
                          <span className="text-[12px]">{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname.includes(subItem.url)}
                              >
                                <Link
                                  onClick={() => {
                                    if (isMobile) toggleSidebar();
                                  }}
                                  href={`/${UserState.value.data?.base_route}${subItem.url}`}
                                >
                                  <span className="text-[12px]">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname.includes(item.url)}
                    >
                      <Link
                        onClick={() => {
                          if (isMobile) toggleSidebar();
                            }}
                        href={`/${UserState.value.data?.base_route}${item.url}`}
                      >
                        <Icon />
                        <span className="text-[14px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profileImage} alt={"User-dp"} />
                    <AvatarFallback className="rounded-lg">
                      {UserState?.value?.data?.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="truncate font-semibold">
                        {UserState?.value?.data?.name}
                      </span>
                      <NotificationBadgeWithoutCount
                        count={NotificationState?.value?.data?.length}
                      />
                    </div>

                    <span className="truncate text-xs">
                      {UserState?.value?.data?.email}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profileImage} alt={"User-dp"} />
                      <AvatarFallback className="rounded-lg">
                        {UserState?.value?.data?.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {UserState?.value?.data?.name}
                      </span>
                      <span className="truncate text-xs">
                        {" "}
                        {UserState?.value?.data?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <Link href={`/${UserState?.value?.data?.base_route}/profile`}>
                    <DropdownMenuItem>
                      <CreditCard />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link
                    href={`/${UserState?.value?.data?.base_route}/notification`}
                  >
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                      <NotificationBadge
                        count={NotificationState?.value?.data.length}
                      />
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut(auth)}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
