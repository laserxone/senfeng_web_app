import ThemeToggle from "@/components/core/theme/theme-toggle";
import { Breadcrumbs } from "@/components/core/navigation/breadcrumbs";
import FloatingChat from "@/components/features/chat/floating-chat";
import FloatingInformation from "@/components/shared/floating/floating-information";
import FloatingTodo from "@/components/shared/floating/floating-todo";
import NewsTicker from "@/components/shared/notifications/newsTicker";
import NotificationSheet from "@/components/shared/notifications/notification-dropdown";
import SearchInput from "@/components/shared/search/search-input";
import AppSearch from "@/components/shared/search/app-search";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/features/users/user-nav";

export default function Header() {
  return (
    <>
      <header className="flex py-1 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <Breadcrumbs />
        </div>
        <div className="hidden md:flex">
          <AppSearch />
        </div>
        <div className="flex items-center gap-2 px-4">

          <div className="hidden md:flex">
            <SearchInput />
          </div>
          <ThemeToggle />
          <NotificationSheet
          />

          <FloatingInformation />
          <FloatingTodo />
          <FloatingChat />

          <UserNav />
        </div>
      </header>
      <div className="flex flex-1">
        <NewsTicker />
      </div>
       <div className="flex md:hidden">
          <AppSearch />
        </div>
    </>
  );
}
