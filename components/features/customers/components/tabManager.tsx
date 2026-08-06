"use client";

import { TabProps } from "@/lib/types";
import clsx from "clsx";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import Spinner from "@/components/ui/spinner";

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
    const params = new URLSearchParams(window.location.search);

    const current = params.get("tabs")?.split(",").filter(Boolean) || [];

    const updated = current.filter((t) => t !== id);

    const newActive = updated[updated.length - 1] || "dashboard";

    params.set("tabs", updated.join(","));
    params.set("active", newActive);

    window.history.pushState({}, "", `?${params.toString()}`);
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex overflow-x-auto border-b pt-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={clsx(
              "flex cursor-pointer items-center rounded-t-md border border-b-transparent px-3 py-1 text-muted-foreground",
              activeTabId === tab.id
                ? "border border-b-transparent bg-primary text-white dark:bg-gray-900"
                : "text-muted-foreground dark:bg-gray-700",
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
                <X className="h-4 w-4 hover:text-red-500" />
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
            className="h-full w-full"
          >
            {tab.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabManager;
