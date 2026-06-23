"use client";
import TeamTask from "@/components/teamTask";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import Attendance from "@/components/users/attendance";
import Reimbursement from "@/components/users/Reimbursement";
import RenderFines from "@/components/users/render-fines";
import SalaryRecord from "@/components/users/SalaryRecord";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { BadgeAlert, CalendarCheck, ReceiptText, UserPlus, Users, Wallet } from "lucide-react";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import UserTabs from "../user-tabs";
import PendingFeedbackData from "./aftersales-pending-feedback";
import { DashboardData } from "./aftersales-types";

export default function AfterSalesDashboard({ data, onRefresh }: { data: DashboardData, onRefresh: () => Promise<void> }) {
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);

  const { userID } = useUserDetail();

  const [activeTab, setActiveTab] = useState("feedback");
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

  const RenderFeedback = useCallback(() => {
    return (
      <PendingFeedbackData data={data} onRefresh={onRefresh} user_id={userID} />
    );
  }, [data]);

  const RenderAttendance = useCallback(() => {
    return (
          <Attendance

            passingData={attendanceData}
            onFilterReturn={async (start, end) => {
              await fetchAttendanceData(start, end);
            }}
          />
    );
  }, [attendanceData]);


  const tabs = [
    {
      value: "feedback",
      label: "Feedback",
      icon: UserPlus,
      count: data?.withoutFeedback?.length ?? 0,
    },
    {
      value: "attendance",
      label: "Attendance",
      icon: CalendarCheck,
      count: attendanceData?.filter((item) => item.status !== "Absent").length || 0,
    },
    {
      value: "task",
      label: "Team Task",
      icon: Users,
      count: allTeamTasks,
    },
    {
      value: "reimbursement",
      label: "Reimbursement",
      icon: ReceiptText,
      count: reimbursementData?.length || 0,
    },
    {
      value: "salary",
      label: "Salary",
      icon: Wallet,
      count: null,
    },
    {
      value: "fines",
      label: "Fines",
      icon: BadgeAlert,
      count: allFines,
    },
  ];

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
          <UserTabs tabs={tabs} routeTo={routeTo} activeTab={activeTab} />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div hidden={activeTab !== "feedback"} >
          <RenderFeedback />
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



