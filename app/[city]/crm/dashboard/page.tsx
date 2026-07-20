"use client";
import TeamTask from "@/components/features/tasks/team-task";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import Attendance from "@/components/features/attendance/attendance";
import CustomerEmployee from "@/components/features/customer-relations/customer";
import { CustomerExtraData } from "@/components/features/users/extra-data";
import OldRecordSheet from "@/components/features/employee-finance/old-record-sheet";
import { ProfilePicture } from "@/components/features/users/profile-picture";
import Reimbursement from "@/components/features/reimbursements/Reimbursement";
import RenderFines from "@/components/features/employee-finance/render-fines";
import SalaryRecord from "@/components/features/employee-finance/salary-record";
import UserTabs from "@/components/features/users/user-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserDashboard, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { BadgeAlert, CalendarCheck, ReceiptText, UserPlus, Users, Wallet } from "lucide-react";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";


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
      fetchExtraCustomerOptions();
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

      <div className="relative flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:z-10 lg:h-fit lg:w-[280px] lg:self-start">
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
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <CustomerEmployee

            height="min-h-[calc(100dvh-400px)]"
            ownership={true}
            customer_data={
              selectedOption && extraData ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">] : []
            }
            onRefresh={async () => await fetchExtraCustomerOptions()}
          />
        </div>
      </div>

    );
  }, [userID, data, extraData, selectedOption]);

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
        onReset={async (start, end) => {
          await fetchReimbursementData(start, end);
        }}
        onFilterReturn={async (start, end) => {
          await fetchReimbursementData(start, end)
        }}
      />

    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (

      <Attendance

        passingData={attendanceData}
        onFilterReturn={async (start, end) =>
          await fetchAttendanceData(start, end)
        }
      />

    );
  }, [attendanceData]);



  const tabs = [
    {
      value: "newCustomers",
      label: "Customers",
      icon: UserPlus,
      count: null,

    },
    {
      value: "attendance",
      label: "Attendance",
      icon: CalendarCheck,
      count: attendanceData?.filter((item) => item.status !== 'Absent').length || 0,

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
          <UserTabs tabs={tabs} routeTo={routeTo} activeTab={activeTab} />
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

      <OldRecordSheet
        visible={oldRecordVisible}
        onClose={setOldRecordVisible}
        user_id={userID}
      />

      {/* <AutoScrollMembers /> */}
    </div>
  );
}
