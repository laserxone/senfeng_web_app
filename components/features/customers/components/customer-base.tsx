"use client";
import CustomerMainPage from "@/components/features/customers/components/customer/main-page";
import MemberDetail from "@/components/features/customers/components/detail/member-detail";
import Machine from "@/components/features/machines/machine-component";
import TabManager from "@/components/features/customers/components/tabManager";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import { TabProps } from "@/lib/types";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function CustomerBaseComponent() {
  const [tabs, setTabs] = useState<TabProps[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | number | null>(
    "dashboard",
  );
  const [loading, setLoading] = useState<(string | number)[]>([]);
  const isMobile = useIsMobile();
  const { base_route } = useUserDetail();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabsParam = searchParams.get("tabs");
  const activeParam = searchParams.get("active");

  const tabsFromUrl = useMemo(() => {
    if (!tabsParam) return [];

    return tabsParam
      .split(",")
      .map((id) => {
        if (id.startsWith("customer-")) {
          const cid = id.split("-")[1];

          return {
            id,
            title: `Customer ${cid}`,
            closable: true,
            component: (
              <MemoizedCustomerTab
                onLoading={(val) => {
                  if (val) {
                    setLoading((prevState) => {
                      const newState = [...prevState];
                      newState.push(id);
                      return newState;
                    });
                  } else {
                    setLoading((prevState) => {
                      const newState = prevState.filter((item) => item !== id);
                      return newState;
                    });
                  }
                }}
                customerId={Number(cid)}
                onReturn={(mid, type = "Machine") => {
                  if (isMobile) {
                    router.push(`/${base_route}/member/${cid}/${mid}`);
                  } else {
                    const id = `machine-${mid}`;
                    openTab(id);
                  }
                }}
              />
            ),
          };
        }

        if (id.startsWith("machine-")) {
          const mid = id.split("-")[1];

          return {
            id,
            title: `Machine ${mid}`,
            closable: true,
            component: (
              <MemoizedMachineTab
                machineId={Number(mid)}
                onLoading={(val) => {
                  if (val) {
                    setLoading((prevState) => {
                      const newState = [...prevState];
                      newState.push(id);
                      return newState;
                    });
                  } else {
                    setLoading((prevState) => {
                      const newState = prevState.filter((item) => item !== id);
                      return newState;
                    });
                  }
                }}
              />
            ),
          };
        }

        return null;
      })
      .filter((tab) => tab !== null);
  }, [tabsParam]);

  const openTab = (id: string) => {
    const currentTabs = tabsParam ? tabsParam.split(",") : [];

    if (!currentTabs.includes(id)) {
      currentTabs.push(id);
    }

    window.history.pushState(
      {},
      "",
      `?tabs=${currentTabs.join(",")}&active=${id}`,
    );
  };

  const dashboardComponent = useMemo(() => {
    return (
      <CustomerMainPage
        onReturn={(cid) => {
          if (isMobile) {
            router.push(`/${base_route}/customer/${cid}`);
          } else {
            const id = `customer-${cid}`;
            openTab(id);
          }
        }}
      />
    );
  }, [openTab, isMobile]);

  useEffect(() => {
    setTabs([
      {
        id: "dashboard",
        title: "Customer",
        closable: false,
        component: dashboardComponent,
      },
      ...tabsFromUrl,
    ]);

    setActiveTabId(activeParam || "dashboard");
  }, [tabsFromUrl, activeParam, isMobile]);

  return (
    <div className="flex w-full flex-1">
      <TabManager
        loading={loading}
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
      />
    </div>
  );
}

const MemoizedCustomerTab = ({
  customerId,
  onReturn,
  onLoading,
}: {
  customerId: number;
  onReturn: (id: number) => void;
  onLoading: (val: boolean) => void;
}) => {
  return useMemo(() => {
    return (
      <div className="flex w-full flex-1">
        <MemberDetail
          height={"h-[calc(100dvh-350px)]"}
          onReturn={onReturn}
          from="customer"
          ownership={true}
          customer_id={customerId}
          onLoading={onLoading}
        />
      </div>
    );
  }, [customerId]);
};

const MemoizedMachineTab = ({
  machineId,
  onLoading,
}: {
  machineId: number;
  onLoading: (id: boolean) => void;
}) => {
  return useMemo(() => {
    return <Machine id={machineId} onLoading={onLoading} />;
  }, [machineId]);
};
