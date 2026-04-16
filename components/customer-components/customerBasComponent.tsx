"use client";
import CustomerMainPage from "@/components/customer-components/customer/main-page";
import MemberDetail from "@/components/customer-components/detail/member-detail";
import Machine from "@/components/customer-components/machine/machine-component";
import TabManager from "@/components/tabManager";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function CustomerBaseComponent({base}) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState("dashboard");
  const [loading, setLoading] = useState([]);
  const isMobile = useIsMobile();
  const {base_route} = useUserDetail()
  const router = useRouter();

  const openTab = useCallback((tab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.id === tab.id);
      return exists ? prev : [...prev, tab];
    });
    setActiveTabId(tab.id);
  }, []);

  const dashboardComponent = useMemo(() => {
    return (
      <CustomerMainPage
        onReturn={(cid) => {
          if (isMobile) {
          
            router.push(`/${base_route}/customer/${cid}`);
          } else {
            const id = `customer-${cid}`;
            openTab({
              id,
              title: `Customer ${cid}`,
              closable: true,
              component: (
                <MemoizedCustomerTab
                base={base}
                  onLoading={(val) => {
                    if (val) {
                      setLoading((prevState) => {
                        const newState = [...prevState];
                        newState.push(id);
                        return newState;
                      });
                    } else {
                      setLoading((prevState) => {
                        const newState = prevState.filter(
                          (item) => item !== id
                        );
                        return newState;
                      });
                    }
                  }}
                  customerId={cid}
                  onReturn={(mid, type = "Machine") => {
                    
                    if (isMobile) {
                  
                      router.push(
                        `/${base_route}/member/${cid}/${mid}`
                      );
                    } else {
                      const id = `machine-${mid}`;
                      openTab({
                        id,
                        title: `${type} ${mid}`,
                        closable: true,
                        component: (
                          <MemoizedMachineTab
                          base={base}
                            machineId={mid}
                            onLoading={(val) => {
                              if (val) {
                                setLoading((prevState) => {
                                  const newState = [...prevState];
                                  newState.push(id);
                                  return newState;
                                });
                              } else {
                                setLoading((prevState) => {
                                  const newState = prevState.filter(
                                    (item) => item !== id
                                  );
                                  return newState;
                                });
                              }
                            }}
                          />
                        ),
                      });
                    }
                  }}
                />
              ),
            });
          }
        }}
      />
    );
  }, [openTab]);

  useEffect(() => {
    setTabs([
      {
        id: "dashboard",
        title: "Customer",
        closable: false,
        component: dashboardComponent,
      },
    ]);
  }, [dashboardComponent]);

  return (
    <div className="w-full flex flex-1">
      <TabManager
        loading={loading}
        tabs={tabs}
        setTabs={setTabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
      />
    </div>
  );
}

const MemoizedCustomerTab = ({ customerId, onReturn, onLoading, base }) => {
  return useMemo(() => {
    return (
      <div className="flex flex-1 w-full">
        <MemberDetail
        height={"h-[calc(100dvh-350px)]"}
          onReturn={onReturn}
          from="customer"
          ownership={true}
          customer_id={customerId}
          base={base}
          onLoading={onLoading}
        />
      </div>
    );
  }, [customerId, base]);
};

const MemoizedMachineTab = ({ machineId, onLoading, base }) => {
  return useMemo(() => {
    return <Machine id={machineId} onLoading={onLoading} base={base}/>;
  }, [machineId, base]);
};
