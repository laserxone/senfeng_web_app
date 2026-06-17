import ThemeToggle from "./ThemeToggle/theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import NewsTicker from "./newsTicker";
import NotificationDropdown from "./notification-dropdown";
import SearchInput from "./search-input";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { UserNav } from "./user-nav";

export default function Header() {
  return (
    <header className="flex py-1 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-6" />
        <Breadcrumbs />
      </div>
      <div className="flex flex-1">
        <NewsTicker />
      </div>

      <div className="flex items-center gap-2 px-4">
        <div className="hidden md:flex">
          <SearchInput />
        </div>
        <ThemeToggle />
        <NotificationDropdown
        />
        <UserNav />
      </div>
    </header>
  );
}
