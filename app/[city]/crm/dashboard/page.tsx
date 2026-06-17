"use client";
import TeamTask from "@/components/teamTask";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import { CustomerExtraData } from "@/components/users/ExtraData";
import OldRecordSheet from "@/components/users/old-record-sheet";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import RenderFines from "@/components/users/render-fines";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserDashboard, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import AutoScrollMembers from "@/components/autoScroll";


type ProfileData = {
  user?: UserDashboard;
};
export default function Page() {
  const [data, setData] = useState<ProfileData>();
  const { userID } = useUserDetail();
  const [extraData, setExtraData] = useState<UserExtraTypes>();
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [oldRecordVisible, setOldRecordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("newCustomers");

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [userID]);

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

  async function fetchAttendanceData(startDate: string, endDate: string): Promise<void | any> {
    return new Promise((res, rej) => {
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
          rej(null);
        });
    });
  }

  async function fetchData() {
    axios.get(`/${userID}/dashboard`).then((response) => {
      setData(response.data);
    });
  }

  async function fetchExtraCustomerOptions() {
    axios.get(`/${userID}/dashboard/group`).then((response) => {
      setExtraData(response.data);
    });
  }

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-5 flex flex-1">
          <div className="flex flex-1 gap-5">
            <CustomerExtraData
              data={extraData || {}}
              option={selectedOption}
              onSelect={(val) => {
                if (val === "record") {
                  setOldRecordVisible(true);
                } else {
                  setSelectedOption(val);
                }
              }}
            />
            <CustomerEmployee

              height="min-h-[calc(100dvh-400px)]"
              ownership={true}
              customer_data={
                selectedOption && extraData ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">] : []
              }
              onRefresh={async () => await fetchExtraCustomerOptions()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [userID, data, extraData, selectedOption]);

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
            onFilterReturn={async (start, end) => {
              await fetchReimbursementData(start, end)
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
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">Customers</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="task">Team Task</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
          </TabsList>

          <div hidden={activeTab !== 'newCustomers'}>
            <RenderNewCustomer />
          </div>
          <div hidden={activeTab !== 'reimbursement'}>
            <RenderReimbursement />
          </div>
          <div hidden={activeTab !== 'attendance'}>
            <RenderAttendance />
          </div>
          <div hidden={activeTab !== 'task'}>

            <Card className="flex flex-1 p-0">
              <CardContent className="pt-2 flex flex-1">
                <TeamTask height="min-h-[calc(100dvh-360px)]" />
              </CardContent>
            </Card>

          </div>
          <div hidden={activeTab !== 'salary'}>

            <Card className="flex flex-1 p-0">
              <CardContent className="pt-2 flex flex-1">
                <SalaryRecord id={userID} height="min-h-[calc(100dvh-320px)]" />
              </CardContent>
            </Card>

          </div>
          <div hidden={activeTab !== 'fines'}>
            <RenderFines userID={userID} height="min-h-[calc(100dvh-370px)]" />
          </div>

        </Tabs>
      </div>

      <OldRecordSheet
        visible={oldRecordVisible}
        onClose={setOldRecordVisible}
        user_id={userID}
      />

      {/* <AutoScrollMembers /> */}
    </div>
  );
}
