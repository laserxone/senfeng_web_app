import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import KBar from "@/components/kbar";
import UserContextProvider from "@/store/context/UserContext";
import NotificationContextProvider from "@/store/context/NotificationContext";

export default async function CommonLayout({ children }) {
  return (
    <KBar>
      <UserContextProvider>
        <NotificationContextProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <div className="flex flex-1">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </NotificationContextProvider>
      </UserContextProvider>
    </KBar>
  );
}
