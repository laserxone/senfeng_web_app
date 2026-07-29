"use client";
import Attendance from "@/components/features/attendance/attendance";
import AddFeedbackDialog from "@/components/features/customer-relations/add-feedback";
import CustomerEmployee from "@/components/features/customer-relations/customer";
import VisitTab from "@/components/features/customer-relations/visit-tab";
import RenderFines from "@/components/features/employee-finance/render-fines";
import RenderReturnable from "@/components/features/employee-finance/render-returnable";
import SalaryRecord from "@/components/features/employee-finance/salary-record";
import Reimbursement from "@/components/features/reimbursements/Reimbursement";
import ChequeClearanceAlert from "@/components/features/sales/cheque-alert";
import { CustomerInsights } from "@/components/features/sales/customer-insights";
import SalesQuickActions from "@/components/features/sales/quick-actions";
import RecentQuotations from "@/components/features/sales/recent-quotations";
import { MetricDialogState, SalesMetricCard, SalesMetricDetailsDialog } from "@/components/features/sales/sales-metric";
import TargetOverview from "@/components/features/sales/target-overview";
import RenderTodayTasks from "@/components/features/sales/today-task";
import MyTasks from "@/components/features/tasks/my-tasks";
import { CustomerExtraData } from "@/components/features/users/extra-data";
import UserTabs from "@/components/features/users/user-tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { SalesCustomer, SalesCustomerMachines, SalesDashboard, SalesMachine, SalesTodayTasks, SalesVisitTypes, UserAttendanceRecord, UserCallData, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { AlertCircle, ArrowUpRight, BadgeAlert, Building2, CalendarCheck, CheckCircle, Clock, Cpu, Gauge, MapPinned, MessageSquareWarning, PhoneCall, ReceiptText, RotateCcw, Truck, UserPlus, UserRound, Users, Wallet, WalletCards } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function SalesDashboardPage({ id: userID, }: { id: string | number }) {

  const [data, setData] = useState<SalesDashboard>();
  const { base_route } = useUserDetail();
  const [visitData, setVisitData] = useState<SalesVisitTypes[]>([]);
  const [extraData, setExtraData] = useState<UserExtraTypes>();
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [callData, setCallData] = useState<UserCallData[]>([]);
  const [activeTab, setActiveTab] = useState("newCustomers");
  const isMobile = useIsMobile()
  const [allFines, setAllFines] = useState(0)
  const [allReturnables, setAllReturnables] = useState(0)
  const [selectedMetric, setSelectedMetric] = useState<MetricDialogState | null>(null)
  const [machinesSoldDialogOpen, setMachinesSoldDialogOpen] = useState(false)
  const [todayTasks, setTodayTasks] = useState<SalesTodayTasks | null>(null)
  const [showingAutoScroll, setShowingAutoScroll] = useState(false)
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [dashboardSkeletonLoading, setDashboardSkeletonLoading] = useState(true)
  const pendingRequests = useRef(0)

  const { open } = useSidebar()

  useEffect(() => {
    if (userID) {
      let cancelled = false;
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      const start = moment().startOf("day").toISOString();
      const end = moment().endOf("day").toISOString();

      setDashboardSkeletonLoading(true);

      Promise.allSettled([
        fetchData(),
        fetchVisitData(startDate, endDate),
        fetchExtraCustomerOptions(),
        fetchReimbursementData(startDate, endDate),
        fetchAttendanceData(startDate, endDate),
        fetchCallData(startDate, endDate),
        fetchTasks(start, end),
      ]).finally(() => {
        if (!cancelled) {
          setDashboardSkeletonLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }
  }, [userID]);

  useEffect(() => {
    const paramTab = searchParams.get("p");
    if (paramTab) {
      setActiveTab(paramTab);
    }

  }, [searchParams]);


  function routeTo(targetTab: string) {
    window.history.pushState({}, "", `${window.location.pathname}?p=${targetTab}`)
  }

  function startDashboardLoading() {
    pendingRequests.current += 1;
    setLoading(true);
  }

  function stopDashboardLoading() {
    pendingRequests.current = Math.max(0, pendingRequests.current - 1);

    if (pendingRequests.current === 0) {
      setLoading(false);
    }
  }

  async function withDashboardLoading<T>(request: () => Promise<T>) {
    startDashboardLoading();

    try {
      return await request();
    } catch (error) {
      console.error("Dashboard request failed:", error);
      return undefined as T;
    } finally {
      stopDashboardLoading();
    }
  }

  async function fetchCallData(startDate: string, endDate: string) {
    return withDashboardLoading(async () => {
      const response = await axios.get(
        `/${userID}/call?start_date=${startDate}&end_date=${endDate}`
      );

      setCallData(response.data);
    });
  }

  async function fetchReimbursementData(startDate: string, endDate: string) {
    return withDashboardLoading(async () => {
      const response = await axios.get(
        `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}`
      );

      setReimbursementData(response.data);
    });
  }

  async function fetchAttendanceData(startDate: string, endDate: string) {
    return withDashboardLoading(async () => {
      const response = await axios.get(
        `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`
      );

      const apiData = response.data.map((item: UserAttendanceRecord) => {
        let status = item?.leave_status
          ? `Leave ${item?.leave_status}`
          : "Absent";

        if (item?.time_in) {
          const checkInTime = new Date(item.time_in);
          const threshold = new Date(item.time_in);
          threshold.setHours(10, 10, 0, 0);

          if (checkInTime > threshold) {
            status = "Late";
          } else {
            status = "Present";
          }
        }

        return {
          ...item,
          date: item?.time_in || item?.leave_date,
          status,
        };
      });

      setAttendanceData(apiData);
    });
  }

  async function fetchTasks(start: string, end: string) {
    return withDashboardLoading(async () => {
      const response = await axios.get(`/${userID}/task?start_date=${start}&end_date=${end}`);
      setTodayTasks({ total: response.data.length, data: response.data });
    });
  }

  async function fetchData() {
    return withDashboardLoading(async () => {
      const response = await axios.get(`/${userID}/dashboard`);
      setData(response.data);
    });
  }

  async function fetchVisitData(start: string, end: string) {
    return withDashboardLoading(async () => {
      const response = await axios.get(`/${userID}/visit?start_date=${start}&end_date=${end}`);
      setVisitData(response.data);
    });
  }

  async function fetchExtraCustomerOptions() {
    return withDashboardLoading(async () => {
      const response = await axios.get(`/${userID}/dashboard/group`);
      setExtraData(response.data);
    });
  }


  const RenderVisitTab = useCallback(() => {
    return (
      <div className="w-full">

        <VisitTab
          id={userID}
          data={visitData}
          onRefresh={async () => {
            const startDate = moment().startOf("month").toISOString();
            const endDate = moment().endOf("month").toISOString();
            await fetchVisitData(startDate, endDate);
            await fetchData();
          }}
          onFetchData={async (start, end) => {
            await fetchVisitData(start, end);
          }}
        />

      </div>
    );
  }, [visitData]);

  const RenderNewCustomer = useCallback(() => {
    return (
      <div className="relative flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:z-10 lg:h-fit lg:w-[280px] lg:self-start">
          <CustomerExtraData
            showold={false}
            data={extraData || {}}
            option={selectedOption}
            onSelect={(val) => {
              setSelectedOption(val)
            }}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <CustomerEmployee

            height="min-h-[calc(100dvh-420px)]"
            ownership={false}
            customer_data={
              selectedOption && extraData
                ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">]
                : []
            }

            newly_assigned={data?.new_entries?.newly_assigned_customers || null}
            onRefresh={async () => {
              await fetchData()
              await fetchExtraCustomerOptions()
            }}
          />
        </div>
      </div>
    )
  }, [userID, data, extraData, selectedOption])

  const RenderMembers = useCallback(() => {
    return (

      <CustomersTab
        data={
          data?.customers.filter((customer) => customer.sales.length > 0) ||
          []
        }
      />

    );
  }, [userID, data]);

  const RenderReimbursement = useCallback(() => {
    return (

      <Reimbursement
        id={userID}
        passingData={reimbursementData || []}
        onAddRefresh={async () => {
          const startDate = moment().startOf("month").toISOString();
          const endDate = moment().endOf("month").toISOString();
          await fetchReimbursementData(startDate, endDate);
        }}
        onFilterReturn={async (start, end) => { await fetchReimbursementData(start, end) }
        }
        onReset={async (start: string, end: string) => {
          await fetchReimbursementData(start, end);
        }}
      />

    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (

      <Attendance
        // height="min-h-[calc(100dvh-350px)]"
        passingData={attendanceData}
        onFilterReturn={async (start, end) => {
          await fetchAttendanceData(start, end)
        }}
      />

    );
  }, [attendanceData]);

  const RenderCallTab = useCallback(() => {
    return (
      <Card className="flex flex-1 p-0">
        <CardContent className="pt-0 flex flex-1 p-0">
          <Calls
            data={callData}
            onRefresh={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchData();
              await fetchCallData(startDate, endDate);
            }}
          />
        </CardContent>
      </Card>
    );
  }, [callData]);


  const tabs = [
    {
      value: "newCustomers",
      label: "New Customers",
      icon: UserPlus,
      count: data?.new_entries?.newly_assigned_customers?.total || 0,

    },
    {
      value: "members",
      label: "Members",
      icon: Users,
      count: data?.customers?.filter((customer) => customer.sales.length > 0).length || 0,

    },
    {
      value: "reimbursement",
      label: "Reimbursement",
      icon: ReceiptText,
      count: reimbursementData?.length || 0,

    },
    {
      value: "visit",
      label: "Visit",
      icon: MapPinned,
      count: visitData?.length || 0,

    },
    {
      value: "calls",
      label: "Calls",
      icon: PhoneCall,
      count: callData?.length || 0,

    },
    {
      value: "attendance",
      label: "Attendance",
      icon: CalendarCheck,
      count: attendanceData?.filter((item) => item.status !== 'Absent').length || 0,

    },
    {
      value: "salary",
      label: "Salary",
      icon: Wallet,
      count: null,

    },
    {
      value: "issued",
      label: "Returnable",
      icon: RotateCcw,
      count: allReturnables,

    },
    {
      value: "fines",
      label: "Fines",
      icon: BadgeAlert,
      count: allFines,
    },
  ]

  const cityInsightItems = useMemo(
    () => buildCustomerInsightItems(data?.customers, "location", "Unknown City"),
    [data?.customers]
  );

  const industryInsightItems = useMemo(
    () => buildCustomerInsightItems(data?.customers, "industry", "Unspecified Industry"),
    [data?.customers]
  );

  const tabsMaxWidth =
    isMobile
      ? "max-w-[calc(100dvw-35px)]"
      : showingAutoScroll
        ? open
          ? "max-w-[calc(100dvw-550px)]"
          : "max-w-[calc(100dvw-340px)]"
        :
        open ? "max-w-[calc(100dvw-290px)]"
          : "max-w-[calc(100dvw-80px)]"

  if (dashboardSkeletonLoading) {
    return (
      <div className="flex flex-1 gap-4 bg-background py-2">
        <div className="flex flex-1 flex-col gap-4">
          <SalesDashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-4 bg-background  py-2">
      <div className="flex flex-1 flex-col gap-4">
        {loading && (
          <div className="sticky top-0 z-20 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SalesMetricCard
            title="Pending Payments"
            value={data?.new_entries?.pending_payments?.total || 0}
            icon={WalletCards}
            accent="from-blue-50 via-sky-50 to-white text-blue-700 ring-blue-100"
            iconClassName="bg-blue-600"
            description="Machine payments"
            onClick={() =>
              setSelectedMetric({
                kind: "pending_payments",
                title: "Pending Payments",
                total: data?.new_entries?.pending_payments?.total || 0,
                totalAmount: data?.new_entries?.pending_payments?.total_amount,
                data: data?.new_entries?.pending_payments?.data || [],
              })
            }
          />

          <SalesMetricCard
            title="Pending Parts Payments"
            value={data?.new_entries?.pending_parts_payments?.total || 0}
            icon={ReceiptText}
            accent="from-violet-50 via-purple-50 to-white text-violet-700 ring-violet-100"
            iconClassName="bg-violet-600"
            description="Parts invoices"
            onClick={() =>
              setSelectedMetric({
                kind: "pending_parts_payments",
                title: "Pending Parts Payments",
                total: data?.new_entries?.pending_parts_payments?.total || 0,
                totalAmount: data?.new_entries?.pending_parts_payments?.total_amount,
                data: data?.new_entries?.pending_parts_payments?.data || [],
              })
            }
          />

          <SalesMetricCard
            title="Pending Deliveries"
            value={data?.new_entries?.pending_deliveries?.total || 0}
            icon={Truck}
            accent="from-amber-50 via-orange-50 to-white text-amber-700 ring-amber-100"
            iconClassName="bg-amber-600"
            description="Ready / awaiting"
            onClick={() =>
              setSelectedMetric({
                kind: "pending_deliveries",
                title: "Pending Deliveries",
                total: data?.new_entries?.pending_deliveries?.total || 0,
                data: data?.new_entries?.pending_deliveries?.data || [],
              })
            }
          />

          <SalesMetricCard
            title="Follow up Required"
            value={data?.new_entries?.top_follow?.total || 0}
            icon={MessageSquareWarning}
            accent="from-rose-50 via-red-50 to-white text-rose-700 ring-rose-100"
            iconClassName="bg-rose-600"
            description="Priority follow ups"
            onClick={() =>
              setSelectedMetric({
                kind: "top_follow",
                title: "Follow up Required",
                total: data?.new_entries?.top_follow?.total || 0,
                data: data?.new_entries?.top_follow?.data || [],
              })
            }
          />

          <SalesMetricCard
            title="Calls This Month"
            value={data?.feedbacksTakenThisMonth || 0}
            icon={PhoneCall}
            accent="from-emerald-50 via-teal-50 to-white text-emerald-700 ring-emerald-100"
            iconClassName="bg-emerald-600"
            description={`of ${data?.totalCustomersWithSale || 0}`}
          />

          <SalesMetricCard
            title="Visits This Month"
            value={data?.totalVisits || 0}
            icon={MapPinned}
            accent="from-indigo-50 via-blue-50 to-white text-indigo-700 ring-indigo-100"
            iconClassName="bg-indigo-600"
            description="of 15"
          />
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-2 xl:auto-rows-[300px]">

            <CustomerInsights
              cities={cityInsightItems}
              industries={industryInsightItems}
            />

            <TargetOverview
              data={data?.target}
              onClick={() => setMachinesSoldDialogOpen(true)}
            />

            <SalesQuickActions onRefreshVisit={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchVisitData(startDate, endDate);
              await fetchData();
            }}
              onRefreshReimbursement={async () => {
                const startDate = moment().startOf("month").toISOString();
                const endDate = moment().endOf("month").toISOString();
                await fetchReimbursementData(startDate, endDate);

              }}
              onRefreshCustomer={async () => {
                await fetchData()
                await fetchExtraCustomerOptions()
              }}
              onRefreshFeedback={async () => {
                await fetchData()
                await fetchExtraCustomerOptions()
              }}
              onRefreshQuotation={async () => {
                await fetchData()
              }}
              onRefreshTask={async () => {

                await fetchData()
                const start = moment().startOf("day").toISOString();
                const end = moment().endOf("day").toISOString();
                await fetchTasks(start, end)
              }} />
            <MyTasks data={data?.allTasks} />

          </div>
          <div className="min-h-0 xl:col-span-1 xl:h-[616px]">
            <RecentQuotations data={data?.recentQuotations} />
          </div>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <div className="min-h-0 xl:col-span-2">
            <RenderTodayTasks data={todayTasks} onRefresh={async () => {
              await fetchData()
              const start = moment().startOf("day").toISOString();
              const end = moment().endOf("day").toISOString();
              await fetchTasks(start, end)
            }} />
          </div>
          <div className="min-h-0 xl:col-span-1 xl:h-[600px]">
            <ChequeClearanceAlert />
          </div>
        </div>

        <ScrollArea className={`${tabsMaxWidth}`}>
          <UserTabs tabs={tabs} routeTo={routeTo} activeTab={activeTab} />
          <ScrollBar orientation="horizontal" />

        </ScrollArea>


        <div hidden={activeTab !== "newCustomers"} className={`${isMobile && "max-w-[calc(100vw-30px)]"}`}>
          <RenderNewCustomer />
        </div>
        <div hidden={activeTab !== "members"} >
          <RenderMembers />
        </div>
        <div hidden={activeTab !== "reimbursement"} >
          <RenderReimbursement />
        </div>
        <div hidden={activeTab !== "visit"}>
          <RenderVisitTab />
        </div>
        <div hidden={activeTab !== "calls"} >
          <RenderCallTab />
        </div>
        <div hidden={activeTab !== "attendance"} >
          <RenderAttendance />
        </div>
        <div hidden={activeTab !== "salary"} >


          <SalaryRecord id={userID} height="min-h-[calc(100dvh-420px)]" />


        </div>
        <div hidden={activeTab !== "issued"} >
          <RenderReturnable userID={userID} height="min-h-[calc(100dvh-420px)]" onUpdateTotal={(val) => setAllReturnables(val)} />
        </div>
        <div hidden={activeTab !== "fines"} >
          <RenderFines userID={userID} height="min-h-[calc(100dvh-480px)]" onUpdateTotal={(val) => setAllFines(val)} />
        </div>
      </div>
      <MachinesSold
        visible={machinesSoldDialogOpen}
        setVisible={setMachinesSoldDialogOpen}
        machineData={data?.machinesSoldThisMonthDetail || []}
        base_route={base_route}
      />
      <SalesMetricDetailsDialog
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        baseRoute={base_route}
      />
    </div >
  );
}

function SalesDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-2 xl:auto-rows-[300px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <DashboardPanelSkeleton key={index} />
          ))}
        </div>

        <div className="min-h-0 xl:col-span-1 xl:h-[616px]">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="flex-1 space-y-0 overflow-hidden">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[52px_1fr_96px_74px] items-center gap-3 border-b px-4 py-3"
                >
                  <Skeleton className="h-4 w-8" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-full max-w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-32 shrink-0 rounded-lg" />
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPanelSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      <div className="mt-5 flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3 border-t pt-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}


function buildCustomerInsightItems(
  customers: SalesCustomer[] | undefined,
  key: "location" | "industry",
  fallback: string
) {
  const counts = new Map<string, number>();

  (customers || []).forEach((customer) => {
    const label = normalizeInsightLabel(customer[key], fallback);
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}


function normalizeInsightLabel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();
  if (["n/a", "na", "nil", "nill", "null", "none", "undefined"].includes(normalized)) {
    return fallback;
  }

  return trimmed;
}





function CustomersTab({
  data
}: {
  data: SalesCustomer[]
}) {
  const [localData, setLocalData] = useState<
    (SalesCustomer & { overall: string })[]
  >([])
  const { base_route } = useUserDetail()

  useEffect(() => {
    if (data.length > 0) {
      const temp = data.map((customer) => {
        const customerCompletion = Number(customer.profile_completion) || 0
        const machines = customer.sales || []

        const totalMachineCompletion = machines.reduce(
          (sum, item) => sum + Number(item.percentage_completion || 0),
          0
        )

        const overallCompletion =
          (customerCompletion + totalMachineCompletion) / (machines.length + 1)

        return { ...customer, overall: overallCompletion.toFixed(0) }
      })

      setLocalData(temp)
    } else {
      setLocalData([])
    }
  }, [data])

  const RenderEachMachine = ({
    machine,
    customer_id,
  }: {
    machine: SalesCustomerMachines
    customer_id: number
  }) => {
    const totalPayments = machine.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    )

    console.log(totalPayments)
    console.log(machine.price)

    const isCompleted =
      (Number(machine.price) - Number(machine.speed_money_amount)) === totalPayments &&
      Number(machine?.percentage_completion) === 100

    return (
      <div className="flex w-full flex-col gap-2 rounded-lg border bg-background px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${base_route}/member/${customer_id}/${machine.id}`}
          className="flex min-w-0 items-center gap-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <Cpu className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold hover:underline">
              {machine.serial_no}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Machine record
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <Badge variant="outline" className="h-6 rounded-full bg-slate-50 px-2 text-[10px] dark:bg-zinc-900">
            {machine?.percentage_completion || 0}% data
          </Badge>

          {isCompleted ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
          )}

          <Badge
            className="h-6 rounded-full px-2 text-[10px]"
            variant={Number(machine.price) === totalPayments ? "default" : "destructive"}
          >
            {Number(machine.price) === totalPayments ? "Paid" : "Balance"}
          </Badge>
        </div>
      </div>
    )
  }



  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 px-4 py-3 dark:bg-zinc-900/70 rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold leading-none">Member Workspace</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Assigned customers, members, and machine activity
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="rounded-full bg-background px-2.5 text-[11px]">
            {localData.length} customers
          </Badge>
          <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
            {localData.reduce((sum, item) => sum + item.sales.length, 0)} machines
          </Badge>
        </div>
      </div>


      <Accordion type="single" collapsible className="w-full space-y-2 px-1 mt-2">
        {localData.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-slate-50 p-6 text-center dark:bg-zinc-900/50">
            <div>
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-muted-foreground dark:bg-zinc-800">
                <AlertCircle className="h-5 w-5" />
              </span>
              <Label className="mt-3 block text-sm font-medium">
                No data found
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Customer records will appear here when assigned
              </p>
            </div>
          </div>
        ) : (
          localData.map((customer) => (
            <AccordionItem
              key={customer.id}
              className="w-[calc(100vw-60px)] border-none sm:w-full"
              value={`customer-${customer.id}`}
            >
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10 p-0">
                <AccordionTrigger className="hover:no-underline sm:px-4">
                  <div className="w-full">
                    <div className="flex w-full min-w-0 flex-col gap-3 pr-2 sm:flex-row sm:items-center sm:justify-between">
                      <div

                        className="flex min-w-0 items-center gap-3"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 text-left">
                          <Link href={`/${base_route}/${customer.member ? "member" : "customer"
                            }/${customer.id}`}>
                            <span className="block truncate text-sm font-semibold hover:underline sm:text-base">
                              {customer.name}
                            </span>
                          </Link>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{customer.member ? "Member" : "Customer"}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            <span>{customer.sales.length} machines</span>
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-col flex-wrap items-center gap-2 sm:justify-end">
                        <Badge
                          className="text-[10px]"
                          variant={
                            customer.sales.length === 0 ? "secondary" : "default"
                          }
                        >
                          {customer.sales.length === 0 ? "Assigned" : "Purchased"}
                        </Badge>
                        <div className="flex text-[10px] font-light">
                          <Gauge className="mr-1 h-3 w-3" />
                          {customer.overall}% profile
                        </div>


                      </div>
                    </div>
                    <Progress value={Number(customer.overall || 0)} className="mt-2" />
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <CardContent className="border-t bg-slate-50/60 px-3 py-3 sm:px-4 dark:bg-zinc-900/50">
                    {customer.sales.length > 0 ? (
                      <div className="space-y-2">
                        {customer.sales.map((machine) => (
                          <RenderEachMachine
                            key={machine.id}
                            machine={machine}
                            customer_id={customer.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-16 items-center justify-center gap-2 rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        No machines purchased yet
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))
        )}
      </Accordion>

    </div>
  )
}

function Calls({ data, onRefresh }: { data: UserCallData[], onRefresh: () => Promise<void> }) {
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UserCallData | null>(null);
  const { userID } = useUserDetail();

  const RenderEachCall = ({ call }: { call: UserCallData }) => {
    return (
      <Card key={call.id} className="group overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold sm:text-base">
                    {call.name || call.owner || "Unnamed customer"}
                  </p>
                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                    Pending call
                  </Badge>
                </div>
                <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{call.number?.join(", ") || "No number"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 md:w-auto md:justify-end">
              <Button
                onClick={() => {
                  setSelectedCustomer(call)
                  setVisible(true)
                }}
                className="h-9 w-full rounded-lg px-3 md:w-auto"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900/70">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PhoneCall className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-none">Call Queue</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow up customers and record feedback
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit rounded-full bg-background px-2.5 text-[11px]">
          {data.length} remaining
        </Badge>
      </div>


      {data.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center p-6">
          <div className="text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle className="h-5 w-5" />
            </span>
            <Label className="mt-3 block text-sm font-medium">
              No calls remaining
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Everything is clear for this period
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {data.map((call) => (
            <RenderEachCall call={call} key={call.id} />
          ))}
        </div>
      )}


      <AddFeedbackDialog customer_id={selectedCustomer?.id} onClose={() => {
        setSelectedCustomer(null)
        setVisible(false)
      }}
        onRefresh={onRefresh}
        open={visible}
        user_id={userID} />
    </div>
  );
}

function MachinesSold({ visible, setVisible, machineData, base_route }: { visible: boolean, setVisible: (val: boolean) => void, machineData: SalesMachine[], base_route: string }) {
 
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="w-full max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground transition-all duration-300 sm:max-w-xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Machines Sold This Month
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select a machine to open its complete record in a new tab.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="ml-auto w-fit shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px]">
              {machineData.length} {machineData.length === 1 ? "machine" : "machines"}
            </Badge>
          </div>
        </DialogHeader>
        
         <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
          <div className="space-y-3 p-3.5 pt-0">
            {machineData.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed bg-muted/15 p-6 text-center">
                <div>
                  <AlertCircle className="mx-auto size-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No machines sold yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This month&apos;s machine sales will appear here.
                  </p>
                </div>
              </div>
            ) : machineData.map((item) => (
              <Link
                key={item.id}
                target="_blank"
                href={`/${base_route}/member/${item.customer_id}/${item.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-background px-3 py-2.5 hover:bg-muted/40 dark:border-white/10"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cpu className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.serial_no || "Machine record"}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.customer_name || "Unknown customer"}
                    {item.customer_owner ? ` - ${item.customer_owner}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xs font-semibold tabular-nums">
                    {Number(item.price || 0).toLocaleString("en-US")}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {item.contract_date ? moment(item.contract_date).format("DD MMM YYYY") : "-"}
                  </span>
                </span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          
          </div>
        </ScrollArea>
       
      </DialogContent>
    </Dialog>
  )
}
