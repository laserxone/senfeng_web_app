"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import RenderReturnable from "@/components/users/render-returnable";
import RenderFines from "@/components/users/render-fines";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import RepairAndMaintenance from "@/components/users/repair-and-maintenance";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { UserAttendanceRecord, UserDashboard, UserReimbursementType, UserRepairing } from "@/lib/types";

export default function Page() {
  const [data, setData] = useState<{ user: UserDashboard }>();
  const { userID } = useUserDetail();
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState("attendance");
  const [repairData, setRepairData] = useState<UserRepairing[]>([]);

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
      fetchRepairingData();
    }
  }, [userID]);

  async function fetchRepairingData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/lab?user=${userID}`)
        .then((response) => {
          setRepairData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }

  async function fetchReimbursementData(startDate: string, endDate: string) {
    return new Promise((resolve, reject) => {
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
          reject(null);
        });
    });
  }

  async function fetchAttendanceData(startDate: string, endDate: string) {
    return new Promise<void | any>((res, rej) => {
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
          } else {
            setAttendanceData([]);
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
            height="min-h-[calc(100dvh-420px)]"
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
             height="min-h-[calc(100dvh-360px)]"
            passingData={attendanceData}
            onFilterReturn={async (start, end) => {
              await fetchAttendanceData(start, end);
            }}
            onRefresh={async (start, end) =>
              await fetchAttendanceData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);

  const RenderRepair = useCallback(
    () => (
      <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
          <RepairAndMaintenance
            height="min-h-[calc(100dvh-380px)]"
            data={repairData}
            onRefresh={async () => {
              await fetchRepairingData();
            }}
          />
        </CardContent>
      </Card>
    ),
    [repairData],
  );

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
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="repair">Repairing And Maintenance</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="issued">Returnable</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full mt-2">
            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "reimbursement" && <RenderReimbursement />}
            {activeTab === "salary" && (
              <Card className="flex flex-1 p-0">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={userID} height="min-h-[calc(100dvh-320px)]" />
                </CardContent>
              </Card>
            )}
            {activeTab === 'fines' && <RenderFines height="min-h-[calc(100dvh-370px)]" />}
            {activeTab === "issued" && <RenderReturnable  height="min-h-[calc(100dvh-310px)]"/>}
            {activeTab === "repair" && <RenderRepair />}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
