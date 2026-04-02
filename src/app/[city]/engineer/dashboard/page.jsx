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

export default function Page() {
  const [data, setData] = useState();
  const { userID } = useUserDetail();
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance");
  const [repairData, setRepairData] = useState([]);

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

  async function fetchReimbursementData(startDate, endDate) {
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

  console.log(reimbursementData);

  async function fetchAttendanceData(startDate, endDate) {
    return new Promise((res, rej) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`,
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item) => {
              return {
                ...item,
                date: item?.time_in,
                status: item?.time_in ? "Present" : "Absent",
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
        <CardContent className="pt-2 flex flex-1">
          <Reimbursement
            id={userID}
            passingData={reimbursementData || []}
            onAddRefresh={(temp) => setReimbursementData([...temp])}
            onFilterReturn={async (start, end) =>
              await fetchReimbursementData(start, end)
            }
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
      <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
          <Attendance
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
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between mb-4 flex-wrap">
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
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={userID} />
                </CardContent>
              </Card>
            )}

            {activeTab === "issued" && <RenderReturnable />}
            {activeTab === "fines" && <RenderFines />}

            {activeTab === "repair" && <RenderRepair />}
          </div>
        </Tabs>
      </div>
      {/* <AutoScrollMembers /> */}
    </div>
  );
}
