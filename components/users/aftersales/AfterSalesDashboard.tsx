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
// import "./styles.css";
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

export default function AfterSalesDashboard() {
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

  const RenderReimbursement = useCallback(() => {
    return (
    <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
          <ScrollArea className="max-h-[500px] w-full pr-2">
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
          </ScrollArea>
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
        <ScrollArea className={`${tabsMaxWidth}`}>
          <div className="flex gap-2 pt-2">

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



