"use client";

import { SidebarIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "./themeSwitcher";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [bread, setBread] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      const paths = pathname.split("/").filter((path) => path);
      setBread(paths);
    }
  }, [pathname]);

  return (
    <header className="fle sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {bread.map((eachBread, ind) => (
              <div
                key={ind}
                className="flex items-center"
                style={{ gap: "0.625rem" }}
              >
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`${
                      list.find((item) => item.match === eachBread)?.link
                    }`}
                  >
                    {`${list.find((item) => item.match === eachBread)?.name}`}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {ind !== bread.length - 1 && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div style={{position:'absolute', right:5}}>
        <ModeToggle />
        </div>
      </div>
     
    </header>
  );
}

const list = [
  {
    name: "Owner",
    link: "/owner/dashboard",
    match: "owner",
  },
  {
    name: "Team",
    link: "/owner/team",
    match: "team",
  },
  {
    name: "Dashboard",
    link: "/owner/dashboard",
    match: "dashboard",
  },
  {
    name: "Branch Expenses",
    link: "/owner/expense",
    match: "expense",
  },
  {
    name: "Task",
    link: "/owner/task",
    match: "task",
  },
];
