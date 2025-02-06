import AppSidebar from '@/components/app-sidebar';
import Header from '@/components/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import KBar from '@/components/kbar';



export default async function DashboardLayout({
  children
}) {

  return (
    <KBar>
      <SidebarProvider >
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* page main content */}
          <div className='flex flex-1 px-4'>
          {children}
          </div>
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
