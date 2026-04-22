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
import { auth } from "@/config/firebase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfileImage } from "@/hooks/use-profile-image";
import useUserDetail from "@/hooks/use-user-detail";
import { setUserOffice } from "@/lib/axios";

import { useMachineDelivery } from "@/hooks/use-machine-delivery";
import { OfficeContext } from "@/store/context/OfficeContext";
import { UserContext } from "@/store/context/UserContext";
import { signOut } from "firebase/auth";
import { ChevronRight, ChevronsUpDown, CreditCard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";
import { ScrollArea } from "./ui/scroll-area";

export const company = {
  name: "SENFENG",
  logo: "/logo.png",
  plan: "Pakistan",
};

export default function AppSidebar({ office }: { office: string }) {
  const pathname = usePathname();

  const { state: UserState, setUser } = useContext(UserContext);
  const { state: OfficeState, setOffice } = useContext(OfficeContext)
  const profileImage = useProfileImage();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const { userID, isAdmin, name, email, base_route, nav_items } = useUserDetail()
  const { pendingDelivery } = useMachineDelivery()


  useEffect(() => {
    if (office) {
      setUserOffice(`/${office}`);
      setOffice(office);
    }
  }, [office]);


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
        <ScrollArea>
          <SidebarGroup>
            <SidebarMenu>
              {
                nav_items.map((item, index) => {
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
                            <span className="text-[14px]">{item.title}</span>
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
                                      if (subItem.title === "POS")
                                        toggleSidebar();
                                    }}
                                    href={`/${base_route}${subItem.url}`}
                                  >
                                    <span className="text-[14px]">
                                      {subItem.title} {subItem.title === "Machine Delivery" && pendingDelivery > 0 && <NotificationBadge count={pendingDelivery} className="ml-3 bg-red-600 text-white rounded-full px-3 py-1 text-sm font-bold shadow-sm" />}
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
                          href={`/${base_route}${item.url}`}
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
        </ScrollArea>
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
                      {name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="truncate font-semibold">
                        {name}
                      </span>
                    </div>

                    <span className="truncate text-xs">
                      {email}
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
                        {name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {name}
                      </span>
                      <span className="truncate text-xs">
                        {" "}
                        {email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  {isAdmin && (
                    <>
                      <Link
                        href={`${pathname.includes("karachi")
                          ? pathname.replace("karachi", "lahore")
                          : pathname.replace("lahore", "karachi")
                          }`}
                      >
                        <DropdownMenuItem>
                          <CreditCard />
                          Switch to{" "}
                          {pathname.includes("karachi")
                            ? "lahore"
                            : "karachi"}{" "}
                          Dashboard
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <Link href={`/${base_route}/profile`}>
                    <DropdownMenuItem>
                      <CreditCard />
                      Profile
                    </DropdownMenuItem>
                  </Link>



                </DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    signOut(auth);
                    // localStorage.removeItem("user_email");
                    // router.replace("/login");
                  }}
                >
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
