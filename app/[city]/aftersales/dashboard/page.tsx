"use client";
import AddCustomerDialog from "@/components/addCustomer";
import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import { RequiredStar } from "@/components/RequiredStar";
import TeamTask from "@/components/teamTask";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import FilterSheet from "@/components/users/filterSheet";
import OldRecordSheet from "@/components/users/old-record-sheet";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import RenderFines from "@/components/users/render-fines";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { ArrowUpDown, BadgeAlert, CalendarCheck, Filter, ReceiptText, TrendingDown, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import "./styles.css";
import { MyCustomer, MyCustomerResolved, UserAttendanceRecord, UserDashboard, UserReimbursementType } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import AutoScrollMembers from "@/components/autoScroll";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type WithFeedbackProps = MyCustomerResolved & {
  feedback_date: string
  user_name ?: string
}

type DashboardData = {
  user: UserDashboard
  withFeedback: WithFeedbackProps[]
  withoutFeedback: MyCustomerResolved[]
}

type CustomerEmployeeAfterSalesProps = {
  onRefresh: () => Promise<void>,
  user_id: number,
  data: DashboardData | null,
  onFilterData: (a: string, b: string) => void,
  handleClear: () => void,
  selectedOption: string,
  setSelectedOption: Dispatch<SetStateAction<string>>,
  height ?:string
}

type DataKeys = Exclude<keyof DashboardData, "user">;

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [filterData, setFilterData] = useState<DashboardData | null>(null);
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [filter, setFilter] = useState<{ start: any; end: any }>({
    start: null,
    end: null,
  });
  const [selectedOption, setSelectedOption] =
    useState<string>("withoutFeedback");
 
  const { userID } = useUserDetail();

    const [activeTab, setActiveTab] = useState("newCustomers");
  const [allFines, setAllFines] = useState(0)
  const [allTeamTasks, setAllTeamTasks] = useState(0)

  const { open } = useSidebar()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
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
  

  async function fetchReimbursementData(startDate: string, endDate: string) {
    return new Promise<boolean>((resolve, reject) => {
      axios
        .get(
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}`,
        )
        .then((response) => {
          setReimbursementData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(false);
        });
    });
  }

  async function fetchAttendanceData(startDate: string, endDate: string) {
    return new Promise<boolean>((res, rej) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`,
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
          rej(false);
        });
    });
  }

  async function fetchData() {
    return new Promise<boolean>(async (resolve) => {
      try {
        const response = await axios.get(`/${userID}/dashboard`);

        const withFeedbackFixed = response.data.withFeedback.map(
          (item: MyCustomer) => ({
            ...item,
            number: Array.isArray(item?.number)
              ? item.number.join(", ")
              : item.number,
          }),
        );

        const withoutFeedbackFixed = response.data.withoutFeedback.map(
          (item: MyCustomer) => ({
            ...item,
            number: Array.isArray(item?.number)
              ? item.number.join(", ")
              : item.number,
          }),
        );

        setData({
          user: response.data?.user,
          withFeedback: withFeedbackFixed,
          withoutFeedback: withoutFeedbackFixed,
        });
      } finally {
        resolve(true);
      }
    });
  }

  useEffect(() => {
    if (filter.start) {
      const temp: any = {};
      const startDate = moment(new Date(filter.start));
      const endDate = moment(new Date(filter.end));

      temp.user = data?.user;
      temp.withoutFeedback = [...(data?.withoutFeedback || [])];
      temp.withFeedback = [...(data?.withFeedback || [])].filter(
        (item: WithFeedbackProps) => {
          const feedbackDate = moment(new Date(item.feedback_date));
          return (
            feedbackDate.isSameOrAfter(startDate) &&
            feedbackDate.isSameOrBefore(endDate)
          );
        },
      );

      setFilterData(temp);
    } else {
      setFilterData(data);
    }
  }, [filter, data]);

  const RenderNewCustomer = useCallback(() => {
    return (
    
            <CustomerEmployeeAfterSales
             height="min-h-[calc(100dvh-400px)]"
              data={filterData ? filterData : data}
              user_id={data?.user?.id as any}
              onRefresh={async () => {
                await fetchData();
              }}
              onFilterData={(start, end) => {
                setFilter({ start: moment(start), end: moment(end) });
              }}
              handleClear={() => setFilter({ start: null, end: null })}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
            />
       
    );
  }, [data, filterData, selectedOption]);

  const RenderReimbursement = useCallback(() => {
    return (
    <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
          <Reimbursement
            id={userID}
              height="min-h-[calc(100dvh-420px)]"
            passingData={reimbursementData || []}
            onAddRefresh={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchReimbursementData(startDate, endDate);
            }}
            onReset={async (start, end) => {
              await fetchReimbursementData(start, end);
            }}
            onFilterReturn={async (start, end) => { await fetchReimbursementData(start, end) }
            }
            onUpdatePurpose={(val: any) => {
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
          height="min-h-[calc(100dvh-360px)]"
            passingData={attendanceData}
            onFilterReturn={async (start, end) => {
              await fetchAttendanceData(start, end);
            }}
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);


  const tabTriggerBase =
      "h-8 gap-1.5 rounded-md px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-md cursor-pointer"
  
    const tabs = [
      {
        value: "newCustomers",
        label: "Members",
        icon: UserPlus,
        count: null,
        className: "bg-blue-600 hover:bg-blue-700 data-[state=active]:bg-blue-700 data-[state=active]:ring-blue-300",
        badgeClassName: "text-blue-700",
      },
      {
        value: "attendance",
        label: "Attendance",
        icon: CalendarCheck,
        count: attendanceData?.filter((item) => item.status !== 'Absent').length || 0,
        className: "bg-cyan-600 hover:bg-cyan-700 data-[state=active]:bg-cyan-700 data-[state=active]:ring-cyan-300",
        badgeClassName: "text-cyan-700",
      },
  
      {
        value: "task",
        label: "Team Task",
        icon: Users,
        count: allTeamTasks,
        className: "bg-orange-500 hover:bg-orange-600 data-[state=active]:bg-orange-600 data-[state=active]:ring-orange-300",
        badgeClassName: "text-orange-600",
      },
  
      {
        value: "reimbursement",
        label: "Reimbursement",
        icon: ReceiptText,
        count: reimbursementData?.length || 0,
        className: "bg-orange-500 hover:bg-orange-600 data-[state=active]:bg-orange-600 data-[state=active]:ring-orange-300",
        badgeClassName: "text-orange-600",
      },
  
  
      {
        value: "salary",
        label: "Salary",
        icon: Wallet,
        count: null,
        className: "bg-amber-500 hover:bg-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:ring-amber-300",
        badgeClassName: "text-amber-700",
      },
  
      {
        value: "fines",
        label: "Fines",
        icon: BadgeAlert,
        count: allFines,
        className: "bg-red-600 hover:bg-red-700 data-[state=active]:bg-red-700 data-[state=active]:ring-red-300",
        badgeClassName: "text-red-700",
      },
    ]
  
    const tabsMaxWidth =
      isMobile
        ? "max-w-[calc(100dvw-35px)]"
        :
        open ? "max-w-[calc(100dvw-290px)]"
          : "max-w-[calc(100dvw-80px)]"

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex justify-between flex-wrap">
          <div className="flex items-center ">
            <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
            <div>
              <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
              <p className="text-muted-foreground">{data?.user?.designation}</p>
            </div>
          </div>
        </div>

        <ScrollArea className={`${tabsMaxWidth}`}>


          <div className="flex gap-2 pb-4 py-2">

            {tabs.map((tab) => {
              const Icon = tab.icon

              return (
                <div
                  key={tab.value}
                  onClick={() => routeTo(tab.value)}
                  className={`${tabTriggerBase} ${tab.className} flex gap-1 items-center ${activeTab === tab.value && "-translate-y-1"}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />

                  <span className="whitespace-nowrap">{tab.label}</span>

                  {tab.count !== null && tab.count !== undefined && (
                    <Badge
                      className={`ml-0.5 h-5 rounded-full bg-white px-1.5 text-[10px] font-bold hover:bg-white ${tab.badgeClassName}`}
                    >
                      {tab.count > 999 ? "999+" : tab.count}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>


          <ScrollBar orientation="horizontal" />

        </ScrollArea>


        <div hidden={activeTab !== "newCustomers"} className={`${isMobile && "max-w-[calc(100vw-30px)]"}`}>
          <RenderNewCustomer />
        </div>

        <div hidden={activeTab !== "reimbursement"} >
          <RenderReimbursement />
        </div>

        <div hidden={activeTab !== "attendance"} >
          <RenderAttendance />
        </div>
        <div hidden={activeTab !== "salary"} >
          <SalaryRecord id={userID} />
        </div>

        <div hidden={activeTab !== 'task'}>
          <TeamTask onUpdateTotal={(val) => setAllTeamTasks(val)} />
        </div>

        <div hidden={activeTab !== "fines"} >
          <RenderFines userID={userID} onUpdateTotal={(val) => setAllFines(val)} />
        </div>

      </div>

      {/* <AutoScrollMembers /> */}
    </div>
  );
}

const CustomerEmployeeAfterSales = ({
  onRefresh,
  user_id,
  data,
  onFilterData,
  handleClear,
  selectedOption,
  setSelectedOption,
  height
}: CustomerEmployeeAfterSalesProps) => {
  const { base_route, customer_add_access, designation, route_branch } =
    useUserDetail();
  const [addCustomer, setAddCustomer] = useState(false);
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<WithFeedbackProps | MyCustomerResolved | null>(
    null,
  );
  const [next, setNext] = useState<Date | undefined>(undefined);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [oldRecordVisible, setOldRecordVisible] = useState(false);

  const columns: ColumnDef<WithFeedbackProps | MyCustomerResolved>[] = [
    {
      accessorKey: "owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
    },
    {
      accessorKey: "name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },

    {
      accessorKey: "number",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("number")}</div>,
    },

    {
      accessorKey: "location",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },

    {
      accessorKey: "feedback_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("feedback_date")
            ? moment(new Date(row.getValue("feedback_date"))).format(
              "YYYY-MM-DD",
            )
            : "Not taken"}
        </div>
      ),
    },

     {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taken By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name") || "-"}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomer(currentItem);
              setShowFeedback(true);
            }}
          >
            Take Feedback
          </Button>
        );
      },
    },
  ];

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${user_id}/feedback`, {
        feedback: feedback,
        type: "aftersales",
        customer_id: selectedCustomer?.id,
        user_id: user_id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
        setShowFeedback(false);
      });
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:z-10 lg:h-fit lg:w-[280px] lg:self-start">
     
        <CustomerExtraData
          data={{
            withFeedback: data?.withFeedback || [],
            withoutFeedback: data?.withoutFeedback || [],
          }}
          option={selectedOption}
          onSelect={(val) => {
            setSelectedOption(val);
          }}
        />

        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <PageTable
          height={height}
            columns={columns}
            data={data?.[selectedOption as DataKeys] || []}
            onRowClick={(val, event) => {
              if (val?.id) {
                const url = `/${base_route}/${val.member ? "member" : "customer"
                  }/${val.id}`;
                if (event.ctrlKey || event.metaKey) {
                  window.open(url, "_blank");
                } else {

                  router.push(url);
                }
              }
            }}
          >
            <div className=" flex justify-between gap-2 flex-wrap items-center">
              <div className="flex flex-row gap-2 flex-wrap items-center">
                <Button
                  onClick={() => setFilterVisible(true)}
                  variant="ghost"
                  className="p-0 w-8"
                >
                  <Filter />
                </Button>
                <Button variant="destructive" onClick={() => handleClear()}>
                  Clear
                </Button>
              </div>

              {customer_add_access && (
                <Button onClick={() => setAddCustomer(true)}>
                  Add Customer
                </Button>
              )}

              <Button
                variant={"outline"}
                onClick={() => setOldRecordVisible(true)}
              >
                Open Record
              </Button>
            </div>
          </PageTable>
        </div>

        <AddCustomerDialog
          user_designation={designation}
          office={route_branch}
          user_id={user_id}
          ownership={true}
          visible={addCustomer}
          onClose={setAddCustomer}
          onRefresh={async () => {
            await onRefresh();
          }}
        />

        <FilterSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onReturn={async (val) => {
            onFilterData(val.start, val.end);
          }}
        />

        <OldRecordSheet
          visible={oldRecordVisible}
          onClose={setOldRecordVisible}
          user_id={user_id}
        />

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Feedback</DialogTitle>
              <div className="flex flex-1 flex-col gap-2">
                <h1>
                  Enter Feedback <RequiredStar />
                </h1>
                <Input
                  placeholder="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />

                <h1>
                  Next Follow Up <RequiredStar />
                </h1>
                <AppCalendar date={next} onChange={setNext} min={new Date()} max={""}/>

                <div className="flex flex-row items-center gap-2">
                  <h1>Top Follow up</h1>
                  <Checkbox
                    checked={top}
                    onCheckedChange={(checked: boolean) => {
                      setTop(checked);
                    }}
                  />
                </div>

                <div className="flex flex-row items-center gap-2">
                  <h1>Satisfactory?</h1>
                  <Checkbox
                    checked={satisfactory}
                    onCheckedChange={(checked: boolean) => {
                      setSatisfactory(checked);
                    }}
                  />
                </div>
                <Button
                  disabled={!next || !feedback}
                  onClick={() => {
                    handleSaveFeedback();
                  }}
                >
                  {loading && <Spinner />} Save
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
   
  );
};

const CustomerExtraData = ({
  data,
  option,
  onSelect,
}: {
  data: { withFeedback: WithFeedbackProps[], withoutFeedback: MyCustomerResolved[] },
  option: string
  onSelect: (a: string) => void
}) => {
  const menuItems = [
    { key: "pending", label: "Pending", dataKey: "withoutFeedback", icon : <TrendingDown className="h-4 w-4"/> },
    { key: "completed", label: "Completed", dataKey: "withFeedback", icon : <TrendingUp className="h-4 w-4"/> },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
        Customer Group
      </h2>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        Filter customer records
      </p>
    </div>

    <div className="flex w-full gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {menuItems.map(({ key, label, dataKey, icon }) => {
        const count = data?.[dataKey as keyof typeof data]?.length ?? 0
        const isActive = option === dataKey

        return (
          <button
            type="button"
            onClick={() => onSelect(dataKey)}
            key={key}
            className={`
              group flex min-w-[145px] shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition-all duration-200
              lg:min-w-0 lg:w-full
              ${
                isActive
                  ? "border border-blue-200 bg-blue-50 text-blue-800 shadow-sm dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-100"
                  : "border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              }
            `}
          >
            <div className="flex gap-2 text-xs items-center">
              {icon}
            <span className="truncate text-xs font-semibold sm:text-sm">
              {label}
            </span>
            </div>

            {count > 0 && (
              <Badge
                variant="secondary"
                className={`
                  h-5 rounded-full px-2 text-[10px] font-bold shadow-none
                  ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                  }
                `}
              >
                {count > 999 ? "999+" : count}
              </Badge>
            )}
          </button>
        )
      })}

      
    </div>
  </div>
  );
};