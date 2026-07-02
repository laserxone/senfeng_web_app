"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import VisitTab from "@/components/users/addVisit";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import Reimbursement from "@/components/users/Reimbursement";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { CustomerExtraData } from "@/components/users/ExtraData";
import RenderFines from "@/components/users/render-fines";
import RenderReturnable from "@/components/users/render-returnable";
import SalaryRecord from "@/components/users/SalaryRecord";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { PendingDelivery, PendingPartsPayment, PendingPayment, SalesCustomer, SalesCustomerMachines, SalesDashboard, SalesMachine, SalesTodayTasks, SalesVisitTypes, TopFollow, UserAttendanceRecord, UserCallData, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { AlertCircle, BadgeAlert, Banknote, Building2, CalendarCheck, CheckCircle, Clock, Cpu, Gauge, Hash, MapPinned, MessageSquareText, MessageSquareWarning, PackageCheck, PhoneCall, ReceiptText, RotateCcw, Truck, UserPlus, UserRound, Users, Wallet, WalletCards } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, type ElementType } from "react";
import "./styles.css";
import { Progress } from "./ui/progress";
import AddFeedbackDialog from "./users/add-feedback";
import UserTabs from "./users/user-tabs";


export default function UserDashboard({ id: userID, }: { id: string | null }) {

  if (!userID) return null
  const { userID: ownerId, base_route } = useUserDetail();
  const [data, setData] = useState<SalesDashboard>();
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
  const [todayTasks, setTodayTasks] = useState<SalesTodayTasks | null>(null)
  const [showingAutoScroll, setShowingAutoScroll] = useState(false)
  const searchParams = useSearchParams()

  const { open } = useSidebar()
  useEffect(() => {
    if (ownerId && userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchVisitData(startDate, endDate);
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
      fetchCallData(startDate, endDate);
      const start = moment().startOf("day").toISOString();
      const end = moment().endOf("day").toISOString();
      fetchTasks(start, end)
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

  async function fetchCallData(startDate: string, endDate: string) {
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/call?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setCallData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchReimbursementData(startDate: string, endDate: string) {

    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          setReimbursementData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }

  async function fetchAttendanceData(startDate: string, endDate: string) {
    return new Promise<void | any>((res, rej) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          if (response.data.length > 0) {
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
          }
          res(true);
        })
        .catch((e) => {
          console.log(e);
          rej(null);
        });
    });
  }

  async function fetchTasks(start: string, end: string) {

    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/task?start_date=${start}&end_date=${end}`)
        .then((response) => {
          setTodayTasks({ total: response.data.length, data: response.data });
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchData() {
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/dashboard`)
        .then((response) => {
          setData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchVisitData(start: string, end: string) {
    return new Promise((res, rej) => {
      axios
        .get(`/${userID}/visit?start_date=${start}&end_date=${end}`)
        .then((response) => {
          setVisitData(response.data);
        })
        .finally(() => {
          res(true);
        });
    });
  }

  async function fetchExtraCustomerOptions() {
    axios.get(`/${userID}/dashboard/group`).then((response) => {
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
            onRefreshTask={fetchTasks}
            height="min-h-[calc(100dvh-420px)]"
            ownership={false}
            customer_data={
              selectedOption && extraData
                ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">]
                : []
            }
            task_data={todayTasks}
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
        height="h-[calc(100dvh-400px)]"
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
        onUpdatePurpose={(val) => {
          const newData = updateItemPurpose(reimbursementData, val);
          setReimbursementData(newData);
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
  return (
    <div className="flex flex-1 gap-4 bg-background  py-2">
      <div className="flex flex-1 flex-col gap-4">
        {/* <div className="flex items-center">
          <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
            <p className="text-muted-foreground">
              {data?.user?.designation}
            </p>
          </div>
        </div> */}
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

        {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MachinesSoldCard
            value={data?.machinesSoldThisMonth || 0}
            percentage={Number(data?.percentageChange || "0")}
            onClick={() => {
              setMachineData(data?.machinesSoldThisMonthDetail || []);
              setVisible(true);
            }}
          />

         
        </div> */}

        <ScrollArea className={`${tabsMaxWidth}`}>


          <UserTabs tabs={tabs} routeTo={routeTo} activeTab={activeTab}/>


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

      {/* <AutoScrollMembers onUpdate={setShowingAutoScroll} /> */}
      {/* <MachinesSold visible={visible} setVisible={setVisible} machineData={machineData} base_route={base_route} /> */}
      <SalesMetricDetailsDialog
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        baseRoute={base_route}
      />
    </div >
  );
}

type MetricDialogState =
  | {
    kind: "pending_payments";
    title: string;
    total: number;
    totalAmount?: number;
    data: PendingPayment[];
  }
  | {
    kind: "pending_parts_payments";
    title: string;
    total: number;
    totalAmount?: number;
    data: PendingPartsPayment[];
  }
  | {
    kind: "pending_deliveries";
    title: string;
    total: number;
    data: PendingDelivery[];
  }
  | {
    kind: "top_follow";
    title: string;
    total: number;
    data: TopFollow[];
  };

function SalesMetricDetailsDialog({
  metric,
  onClose,
  baseRoute,
}: {
  metric: MetricDialogState | null;
  onClose: () => void;
  baseRoute: string;
}) {
  const amountText =
    metric && "totalAmount" in metric && typeof metric.totalAmount === "number"
      ? formatMetricAmount(metric.totalAmount)
      : null;

  return (
    <Dialog open={!!metric} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {metric?.title || "Details"}
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {metric?.total || 0} records found
                  {amountText ? ` - ${amountText}` : ""}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit rounded-full bg-background px-3 py-1">
              Total: {metric?.total || 0}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-150px)]">
          <div className="space-y-3 p-5">
            {!metric || metric.data.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed bg-muted/15 p-6 text-center">
                <div>
                  <AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No records found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Records will appear here when available.
                  </p>
                </div>
              </div>
            ) : (
              metric.data.map((item) => (
                <MetricDetailCard
                  key={`${metric.kind}-${item.id}`}
                  item={item}
                  kind={metric.kind}
                  baseRoute={baseRoute}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function MetricDetailCard({
  item,
  kind,
  baseRoute,
}: {
  item: PendingPayment | PendingPartsPayment | PendingDelivery | TopFollow;
  kind: MetricDialogState["kind"];
  baseRoute: string;
}) {
  const customer = item.customer;
  const customerUrl = `/${baseRoute}/${customer?.member ? "member" : "customer"}/${customer?.id || item.customer_id}`;

  if (kind === "pending_parts_payments") {
    const parts = item as PendingPartsPayment;
    return (
      <MetricCardShell
        href={customerUrl}
        icon={ReceiptText}
        title={parts.customer?.name || parts.company || "Parts invoice"}
        subtitle={parts.customer?.owner || parts.name || "No owner"}
        badge={parts.status || "Pending"}
        details={[
          { icon: Hash, label: "Invoice", value: parts.invoicenumber || "N/A" },
          { icon: Building2, label: "Company", value: parts.company || "N/A" },
          { icon: Banknote, label: "Balance", value: formatMetricAmount(Number(parts.final_amount || 0) - Number(parts.total_paid || 0)) },
          { icon: UserRound, label: "Manager", value: parts.manager || "N/A" },
        ]}
      />
    );
  }

  if (kind === "top_follow") {
    const follow = item as TopFollow;
    return (
      <MetricCardShell
        href={customerUrl}
        icon={MessageSquareText}
        title={follow.customer?.name || "Follow up"}
        subtitle={follow.customer?.owner || "No owner"}
        badge={follow.status || "Follow up"}
        details={[
          { icon: CalendarCheck, label: "Next follow up", value: formatMetricDate(follow.next_followup) },
          { icon: ReceiptText, label: "Type", value: follow.followup_type || follow.type || "N/A" },
          { icon: MessageSquareText, label: "Feedback", value: follow.feedback || "N/A" },
        ]}
      />
    );
  }

  const payment = item as PendingPayment;
  const isDelivery = kind === "pending_deliveries";

  return (
    <MetricCardShell
      href={`/${baseRoute}/member/${payment.customer_id}/${payment.id}`}
      icon={isDelivery ? Truck : Wallet}
      title={payment.customer?.name || "No customer"}
      subtitle={payment.customer?.owner || payment.serial_no || "No owner"}
      badge={isDelivery ? "Delivery" : payment.type || "Machine"}
      details={[
        { icon: Cpu, label: "Serial No", value: payment.serial_no || "N/A" },
        { icon: Hash, label: "Order No", value: payment.order_no_arr?.join(", ") || payment.order_no || "N/A" },
        { icon: Banknote, label: isDelivery ? "Price" : "Pending", value: formatMetricAmount(isDelivery ? Number(payment.price || 0) : Number(payment.pending_amount || 0)) },
        { icon: isDelivery ? PackageCheck : Cpu, label: isDelivery ? "Delivery Date" : "Power", value: isDelivery ? formatMetricDate(payment.delivery_date || payment.delivery_request_date) : payment.power || "N/A" },
      ]}
    />
  );
}

function MetricCardShell({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  details,
}: {
  href: string;
  icon: ElementType;
  title: string;
  subtitle: string;
  badge: string;
  details: { icon: ElementType; label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm transition hover:bg-muted/15">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Link href={href} target="_blank" className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block break-words text-base font-bold hover:underline">
              {title}
            </span>
            <span className="mt-1 block break-words text-sm text-muted-foreground">
              {subtitle}
            </span>
          </span>
        </Link>

        <Badge variant="outline" className="w-fit rounded-full bg-muted/20 px-2.5 py-1">
          {badge}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
        {details.map((detail) => {
          const DetailIcon = detail.icon;

          return (
            <span
              key={`${detail.label}-${detail.value}`}
              className="inline-flex min-w-0 items-start gap-2 rounded-xl border bg-muted/10 px-3 py-2"
            >
              <DetailIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {detail.label}
                </span>
                <span className="block whitespace-pre-wrap break-words font-semibold text-foreground">
                  {detail.value}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function formatMetricAmount(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatMetricDate(value: string | Date | null) {
  return value ? moment(new Date(value)).format("YYYY-MM-DD") : "N/A";
}

function SalesMetricCard({
  title,
  value,
  icon: Icon,
  accent,
  iconClassName,
  onClick,
  description = "Current Total",
}: {
  title: string;
  value: number;
  icon: ElementType;
  accent: string;
  iconClassName: string;
  onClick?: () => void;
  description?: string;
}) {

  const getChartColor = (className: string) => {
    if (className.includes("rose")) return "#e11d48"
    if (className.includes("blue")) return "#2563eb"
    if (className.includes("emerald")) return "#059669"
    if (className.includes("amber")) return "#d97706"
    if (className.includes("violet")) return "#7c3aed"
    if (className.includes("indigo")) return "#4f46e5"
    if (className.includes("cyan")) return "#0891b2"
    if (className.includes("orange")) return "#ea580c"
    if (className.includes("red")) return "#dc2626"

    return "#334155"
  }

  const chartColor = getChartColor(iconClassName)

  const chartId = useId()

  return (
    <div

      className={`
      group relative flex h-full min-h-[118px] w-full overflow-hidden
      rounded-lg border border-white/60 bg-gradient-to-br ${accent}
      p-4 ring-1 ring-black/5
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
    `}
    >
      {/* soft background glow only */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

      {/* glass shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-slate-800">
              {title}
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-600">
              {description}
            </p>
          </div>

          <div
            className={`
            grid size-11 shrink-0 place-items-center rounded-lg text-white
            ring-1 ring-white/40 ${iconClassName}
          `}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
              disabled={!onClick}
              className={`
              text-left text-3xl font-black leading-none tracking-tight text-slate-950
              ${onClick ? "cursor-pointer transition hover:text-blue-700 hover:underline" : "cursor-default"}
            `}
            >
              {value?.toLocaleString?.() ?? value}
            </button>
          </div>

          <div className="flex h-11 w-28 items-center justify-center">
            <svg
              viewBox="0 0 60 44"
              fill="none"
              className="h-10 w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={`${chartId}-line`}
                  x1="6"
                  y1="26"
                  x2="90"
                  y2="6"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor={chartColor} stopOpacity="0.35" />
                  <stop offset="0.45" stopColor={chartColor} stopOpacity="0.9" />
                  <stop offset="1" stopColor={chartColor} stopOpacity="1" />
                </linearGradient>

                <linearGradient
                  id={`${chartId}-area`}
                  x1="48"
                  y1="8"
                  x2="48"
                  y2="38"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor={chartColor} stopOpacity="0.16" />
                  <stop offset="1" stopColor={chartColor} stopOpacity="0" />
                </linearGradient>

                <filter id={`${chartId}-glow`} x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* area */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6 L86 38 L6 38 Z"
                fill={`url(#${chartId}-area)`}
              />

              {/* glow line */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6"
                stroke={chartColor}
                strokeOpacity="0.1"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${chartId}-glow)`}
              />

              {/* main line */}
              <path
                d="M6 26 L14 18 L22 24 L30 16 L38 22 L48 13 L58 19 L68 10 L78 25 L86 6"
                stroke={`url(#${chartId}-line)`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* end point */}
              <circle
                cx="86"
                cy="6"
                r="3"
                fill="white"
                stroke={chartColor}
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomersTab({
  data,
  height = "h-[calc(100dvh-250px)]",
}: {
  data: SalesCustomer[]
  height?: string
}) {
  console.log(data)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Machines Sold</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh]">
          <div className="flex flex-1 flex-col gap-2">
            <div className="grid grid-cols-3 font-semibold border-b pb-2">
              <div>Serial No</div>
              <div>Company</div>
              <div>Owner</div>
            </div>

            {machineData.map((item, index) => (
              <Link
                key={index}
                target="_blank"
                href={`/${base_route}/member/${item.customer_id}/${item.id}`}
                className="grid grid-cols-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
              >
                <div>{item.serial_no}</div>
                <div>{item.customer_name || "-"}</div>
                <div>{item.customer_owner || "-"}</div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
