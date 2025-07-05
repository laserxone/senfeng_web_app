"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Spinner from "./ui/spinner";

const TabManager = ({
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
  loading,
}) => {
  const closeTab = (tabId) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    setActiveTabId((prevActive) => {
      if (prevActive === tabId) {
        const remaining = tabs.filter((t) => t.id !== tabId);
        return remaining.length ? remaining[0].id : null;
      }
      return prevActive;
    });
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      {/* Tab bar */}
      <div className="flex pt-2 border-b bg-muted overflow-x-auto">
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
              <Spinner size={16}/>
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

      {/* Tab content */}
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
