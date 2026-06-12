"use client";
import {
  FeedbackTakenCard,
  MachinesSoldCard,
  VisitsDoneCard,
} from "@/components/dashboardCards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitTab from "@/components/users/addVisit";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import Reimbursement from "@/components/users/Reimbursement";
import { Scrollbar } from "@radix-ui/react-scroll-area";

import AppCalendar from "@/components/appCalendar";
import { RequiredStar } from "@/components/RequiredStar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import RenderFines from "@/components/users/render-fines";
import RenderReturnable from "@/components/users/render-returnable";
import SalaryRecord from "@/components/users/SalaryRecord";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { SalesCustomer, SalesCustomerMachines, SalesDashboard, SalesMachine, SalesVisitTypes, UserAttendanceRecord, UserCallData, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { AlertCircle, Building2, CheckCircle, Clock, Cpu, Gauge, MessageSquareText, PhoneCall, Star, UserRound } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import { CustomerExtraData } from "@/components/users/ExtraData";
import AutoScrollMembers from "@/components/autoScroll";

export default function Page() {
  const [data, setData] = useState<SalesDashboard>();
  const { userID, base_route } = useUserDetail();
  const [visitData, setVisitData] = useState<SalesVisitTypes[]>([]);
  const [extraData, setExtraData] = useState<UserExtraTypes>();
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [callData, setCallData] = useState<UserCallData[]>([]);
  const [machineData, setMachineData] = useState<SalesMachine[]>([]);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("newCustomers");
  const isMobile = useIsMobile()

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchVisitData(startDate, endDate);
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
      fetchCallData(startDate, endDate);
      // fetchScrollData()
    }
  }, [userID]);

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
       <div className="overflow-hidden w-full">
          <ScrollArea className={`h-[calc(100dvh-350px)] w-full pr-2`}>
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
      </ScrollArea>
      </div>
    );
  }, [visitData]);

  const RenderNewCustomer = useCallback(() => {
    return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
  <div className="w-full shrink-0 lg:w-[280px]">
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
      height="min-h-[calc(100dvh-370px)]"
      ownership={false}
      customer_data={
        selectedOption && extraData
          ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">]
          : []
      }
      onRefresh={() => {
        fetchData()
        fetchExtraCustomerOptions()
      }}
    />
  </div>
</div>
    );
  }, [userID, data, extraData, selectedOption]);

   const RenderMembers = useCallback(() => {
      return (
        <Card className="flex flex-1 p-0">
          <CardContent className="p-0 flex flex-1">
            <CustomersTab
              height="h-[calc(100dvh-400px)]"
              data={
                data?.customers.filter((customer) => customer.sales.length > 0) ||
                []
              }
            />
          </CardContent>
        </Card>
      );
    }, [userID, data]);

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
          <Reimbursement
            id={userID}
            height="min-h-[calc(100dvh-530px)]"
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
        </CardContent>
      </Card>
    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (
      <Card className="flex flex-1 p-0">
        <CardContent className="pt-0 flex flex-1">
          <Attendance
            height="min-h-[calc(100dvh-470px)]"
            passingData={attendanceData}
            onFilterReturn={async (start, end) => {
              await fetchAttendanceData(start, end)
            }}
          />
        </CardContent>
      </Card>
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

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center">
          <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
            <p className="text-muted-foreground">
              {data?.user?.designation}
            </p>
          </div>
        </div>
        <div className="flex justify-between gap-4 flex-wrap">

          <MachinesSoldCard
            value={data?.machinesSoldThisMonth || 0}
            percentage={Number(data?.percentageChange || "0")}
            onClick={() => {
              setMachineData(data?.machinesSoldThisMonthDetail || []);
              setVisible(true);
            }}
          />

          <FeedbackTakenCard
            value={data?.feedbacksTakenThisMonth || 0}
            total={data?.totalCustomersWithSale || 0}
            remaining={data?.remainingFeedbacks || 0}
          />

          <VisitsDoneCard
            value={data?.totalVisits || 0}
            total={15}
            remaining={Math.max(15 - (data?.totalVisits || 0), 0)}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="relative flex w-full flex-1 flex-col"
        >
          <ScrollArea
            className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-45px)]"}`}
          >
            <TabsList className="justify-start">
              <TabsTrigger value="newCustomers">New Customers</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>

              <TabsTrigger value="visit">Visit</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="issued">Returnable</TabsTrigger>
              <TabsTrigger value="fines">Fines</TabsTrigger>
            </TabsList>
            <Scrollbar orientation="horizontal" />
          </ScrollArea>

          <div hidden={activeTab !== "newCustomers"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderNewCustomer />
          </div>
          <div hidden={activeTab !== "members"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderMembers />
          </div>
          <div hidden={activeTab !== "reimbursement"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderReimbursement />
          </div>
          <div hidden={activeTab !== "visit"}>
            <RenderVisitTab />
          </div>
          <div hidden={activeTab !== "calls"}>
            <RenderCallTab />
          </div>
          <div hidden={activeTab !== "attendance"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderAttendance />
          </div>
          <div hidden={activeTab !== "salary"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>

            <Card className="flex flex-1 p-0">
              <CardContent className="pt-0 flex flex-1">
                <SalaryRecord id={userID} height="min-h-[calc(100dvh-420px)]" />
              </CardContent>
            </Card>

          </div>
          <div hidden={activeTab !== "issued"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderReturnable height="min-h-[calc(100dvh-420px)]" />
          </div>
          <div hidden={activeTab !== "fines"} className={`${isMobile && "max-w-[calc(100vw-45px)]"}`}>
            <RenderFines height="min-h-[calc(100dvh-480px)]" />
          </div>

        </Tabs>
      </div>

      <AutoScrollMembers />
      <MachinesSold visible={visible} setVisible={setVisible} machineData={machineData} base_route={base_route} />
    </div>
  );
}

function CustomersTab({
  data,
  height = "h-[calc(100dvh-250px)]",
}: {
  data: SalesCustomer[]
  height?: string
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

    const isCompleted =
      Number(machine.price) === totalPayments &&
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
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 px-4 py-3 dark:bg-zinc-900/70">
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

      <ScrollArea className={`${height} w-full`}>
        <Accordion type="single" collapsible className="w-full space-y-2 p-3">
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
              className="w-[calc(100vw-80px)] border-none sm:w-full"
              value={`customer-${customer.id}`}
            >
              <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10 p-0">
                <AccordionTrigger className="hover:no-underline sm:px-4">
                  <div className="flex w-full min-w-0 flex-col gap-3 pr-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`/${base_route}/${customer.member ? "member" : "customer"
                        }/${customer.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold hover:underline sm:text-base">
                          {customer.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{customer.member ? "Member" : "Customer"}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span>{customer.sales.length} machines</span>
                        </span>
                      </span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant="outline" className="h-6 rounded-full bg-background px-2 text-[10px]">
                        <Gauge className="mr-1 h-3 w-3" />
                        {customer.overall}% profile
                      </Badge>

                      <Badge
                        className="h-6 rounded-full px-2 text-[10px]"
                        variant={
                          customer.sales.length === 0 ? "secondary" : "default"
                        }
                      >
                        {customer.sales.length === 0 ? "Assigned" : "Purchased"}
                      </Badge>
                    </div>
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
      </ScrollArea>
    </div>
  )
}

function Calls({ data, onRefresh }: { data: UserCallData[], onRefresh: () => Promise<void> }) {
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UserCallData | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const [satisfactory, setSatisfactory] = useState(false);
  const [next, setNext] = useState<Date | undefined>(undefined);
  const [top, setTop] = useState(false);
  const { userID } = useUserDetail();

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${userID}/feedback`, {
        feedback: feedback,
        type: "feedback",
        customer_id: selectedCustomer?.id,
        user_id: userID,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const RenderEachCall = ({ call }: { call: UserCallData }) => {
    return (
      <Card key={call.id} className="group overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {call.name || call.owner || "Unnamed customer"}
                  </p>
                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                    Pending call
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{call.number?.join(", ") || "No number"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              <Button
                onClick={() => {
                  setSelectedCustomer(call)
                  setVisible(true)
                }}
                className="h-8 w-full rounded-lg px-3 sm:w-auto"
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
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 px-4 py-3 dark:bg-zinc-900/70">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PhoneCall className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold leading-none">Call Queue</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow up customers and record feedback
            </p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full bg-background px-2.5 text-[11px]">
          {data.length} remaining
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100dvh-410px)]">
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
      </ScrollArea>

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b bg-slate-50/90 px-4 py-3 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Add Feedback
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedCustomer?.name || selectedCustomer?.owner || "Customer"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 p-4">
            <div className="rounded-lg border bg-slate-50/70 px-3 py-2 dark:bg-zinc-900/70">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>{selectedCustomer?.number?.join(", ") || "No number"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Enter Feedback <RequiredStar />
              </Label>
              <Input
                placeholder="Write call feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="h-10 rounded-lg bg-slate-50/70 dark:bg-zinc-900/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next Follow Up <RequiredStar />
              </Label>
              <AppCalendar date={next} onChange={setNext} min={new Date()} max={""} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex h-10 items-center justify-between rounded-lg border bg-slate-50/70 px-3 text-sm dark:bg-zinc-900/70">
                <span className="inline-flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Top Follow Up
                </span>
                <Checkbox
                  checked={top}
                  onCheckedChange={(checked) => {
                    setTop(checked === true);
                  }}
                />
              </label>

              <label className="flex h-10 items-center justify-between rounded-lg border bg-slate-50/70 px-3 text-sm dark:bg-zinc-900/70">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Satisfactory
                </span>
                <Checkbox
                  checked={satisfactory}
                  onCheckedChange={(checked) => {
                    setSatisfactory(checked === true);
                  }}
                />
              </label>
            </div>

            <Button
              className="h-9 w-full rounded-lg"
              disabled={!next || !feedback}
              onClick={() => {
                handleSaveFeedback();
              }}
            >
              {loading && <Spinner />} Save Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
