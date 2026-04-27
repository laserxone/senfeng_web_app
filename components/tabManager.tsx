"use client";

import { TabProps } from "@/lib/types";
import clsx from "clsx";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import Spinner from "./ui/spinner";


type TabManagerProps = {
  tabs: TabProps[];
  activeTabId: string | number | null;
  setActiveTabId: Dispatch<SetStateAction<string | number | null>>;
  loading: (string | number)[];
};

const TabManager = ({
  tabs,
  activeTabId,
  setActiveTabId,
  loading,
}: TabManagerProps) => {
const searchParams = useSearchParams();

const tabsParam = searchParams.get("tabs");
 const closeTab = (id: string) => {
  const currentTabs = tabsParam?.split(",") || [];

  const newTabs = currentTabs.filter((t) => t !== id);
  const newActive = newTabs[0] || "dashboard";
  window.history.pushState({}, "", `?tabs=${newTabs.join(",")}&active=${newActive}`);
 
};

  return (
    <div className="w-full flex flex-1 flex-col">
   
      <div className="flex pt-2 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={clsx(
              "px-3 py-1 flex items-center rounded-t-md cursor-pointer text-muted-foreground border border-b-transparent",
              activeTabId === tab.id
                ? "bg-primary dark:bg-gray-900 border border-b-transparent text-white"
                : "dark:bg-gray-700 text-muted-foreground"
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="mr-2 text-sm">{tab.title}</span>
            {loading.filter((item) => item === tab.id).length > 0 && (
              <Spinner />
            )}
            {tab.closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-4 h-4 hover:text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-1 py-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: activeTabId === tab.id ? "flex" : "none" }}
            className="w-full h-full"
          >
            {tab.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabManager;
