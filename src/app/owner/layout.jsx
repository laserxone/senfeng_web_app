import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import KBar from "@/components/kbar";
import UserContextProvider from "@/store/context/UserContext";
import { ownerNavItems } from "@/constants/data";

export default async function DashboardLayout({ children }) {
  return (
    <KBar>
      <UserContextProvider>
        <SidebarProvider>
          <AppSidebar/>
          <SidebarInset>
            <Header />
            <div className="flex flex-1">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </UserContextProvider>
    </KBar>
  );
}
