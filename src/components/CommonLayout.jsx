import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import KBar from "@/components/kbar";
import UserContextProvider from "@/store/context/UserContext";
import NotificationContextProvider from "@/store/context/NotificationContext";
import OfficeContextProvider from "@/store/context/OfficeContext";

export default async function CommonLayout({ office, children }) {
  return (
    <UserContextProvider>
      <OfficeContextProvider>
        <KBar>
          <NotificationContextProvider>
            <SidebarProvider>
              <AppSidebar office={office} />
              <SidebarInset>
                <Header />
                <div className="flex flex-1">{children}</div>
              </SidebarInset>
            </SidebarProvider>
          </NotificationContextProvider>
        </KBar>
      </OfficeContextProvider>
    </UserContextProvider>
  );
}
