"use client";
import TeamTask from "@/components/features/tasks/team-task";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/features/attendance/attendance";
import { ProfilePicture } from "@/components/features/users/profile-picture";
import Reimbursement from "@/components/features/reimbursements/Reimbursement";
import RenderFines from "@/components/features/employee-finance/render-fines";
import SalaryRecord from "@/components/features/employee-finance/salary-record";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserDashboard, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import AutoScrollMembers from "@/components/features/attendance/autoScroll";

export default function Page() {
  const [data, setData] = useState<{ user: UserDashboard }>();
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState("attendance");
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();

      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [userID]);

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
    axios.get(`/${userID}/dashboard`).then((response) => {
      setData(response.data);
    });
  }

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
          <Reimbursement
            id={userID}
            passingData={reimbursementData || []}
            onAddRefresh={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchReimbursementData(startDate, endDate);
            }}
            onFilterReturn={async (start, end) => {
              await fetchReimbursementData(start, end)
            }}
            onReset={async (start, end) => {
              await fetchReimbursementData(start, end);
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
            height="min-h-[calc(100dvh-370px)]"
            passingData={attendanceData}
            onFilterReturn={async (start, end) =>
              await fetchAttendanceData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);

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

        <Tabs
          className="relative flex w-full flex-1 flex-col"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="task">Team Task</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full mt-2">
            {activeTab === "reimbursement" && <RenderReimbursement />}
            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "task" && (
              <Card className="flex flex-1 p-0">
                <CardContent className="pt-2 flex flex-1">
                  <TeamTask height="min-h-[calc(100dvh-360px)]" />
                </CardContent>
              </Card>
            )}
            {activeTab === "salary" && (
              <Card className="flex flex-1 p-0">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={userID} height="min-h-[calc(100dvh-320px)]" />
                </CardContent>
              </Card>
            )}


            {activeTab === 'fines' && <RenderFines userID={userID} height="min-h-[calc(100dvh-370px)]" />}
          </div>
        </Tabs>
      </div>

      {/* <AutoScrollMembers /> */}
    </div>
  );
}
