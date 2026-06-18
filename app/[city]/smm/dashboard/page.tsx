"use client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import { CustomerExtraData } from "@/components/users/ExtraData";
import OldRecordSheet from "@/components/users/old-record-sheet";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import RenderFines from "@/components/users/render-fines";
import SalaryRecord from "@/components/users/SalaryRecord";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserDashboard, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { BadgeAlert, CalendarCheck, ReceiptText, UserPlus, Wallet } from "lucide-react";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";

export default function Page() {
  const [data, setData] = useState<{ user: UserDashboard }>();
  const [extraData, setExtraData] = useState<UserExtraTypes>();
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [oldRecordVisible, setOldRecordVisible] = useState(false)
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState("newCustomers");
  const { userID } = useUserDetail();
  const [allFines, setAllFines] = useState(0)

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
            height="min-h-[calc(100dvh-470px)]"
            totalCustomerText={"Total Customers"}
            ownership={true}
            customer_data={
              extraData && selectedOption ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">] : []
            }
            onRefresh={() => fetchExtraCustomerOptions()}
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


  const tabTriggerBase =
    "h-8 gap-1.5 rounded-md px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-md cursor-pointer"

  const tabs = [
    {
      value: "newCustomers",
      label: "New Customers",
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
