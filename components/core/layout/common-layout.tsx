import AppSidebar from "@/components/core/navigation/app-sidebar";
import Header from "@/components/core/layout/header";
import KBar from "@/components/core/command-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default async function CommonLayout({
  office,
  children,
}: {
  office: string;
  children: ReactNode;
}) {
  return (
    <KBar>
      <SidebarProvider>
        <AppSidebar office={office} />
        <SidebarInset className="h-svh min-h-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="w-full shrink-0">
              <Header />
            </div>
            <div className="flex min-h-0 flex-1">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
