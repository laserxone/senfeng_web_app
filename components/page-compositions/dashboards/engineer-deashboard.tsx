"use client";
import Attendance from "@/components/features/attendance/attendance";
import RenderFines from "@/components/features/employee-finance/render-fines";
import RenderReturnable from "@/components/features/employee-finance/render-returnable";
import SalaryRecord from "@/components/features/employee-finance/salary-record";
import RepairAndMaintenance from "@/components/features/engineers/repair-and-maintenance";
import Reimbursement from "@/components/features/reimbursements/Reimbursement";
import UserTabs from "@/components/features/users/user-tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import axios from "@/lib/axios";
import { UserAttendanceRecord, UserReimbursementType, UserRepairing } from "@/lib/types";
import { BadgeAlert, CalendarCheck, ReceiptText, RotateCcw, Users, Wallet } from "lucide-react";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function EngineerDashboard({ id: userID, }: { id: string | number }) {

    const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
    const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
    const [activeTab, setActiveTab] = useState("attendance");
    const [repairData, setRepairData] = useState<UserRepairing[]>([]);
    const [allFines, setAllFines] = useState(0)
    const [allReturnables, setAllReturnables] = useState(0)
    const { open } = useSidebar()
    const searchParams = useSearchParams()
    const isMobile = useIsMobile()

    useEffect(() => {
        if (userID) {
            const startDate = moment().startOf("month").toISOString();
            const endDate = moment().endOf("month").toISOString();

            fetchReimbursementData(startDate, endDate);
            fetchAttendanceData(startDate, endDate);
            fetchRepairingData();
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
            />

        );
    }, [reimbursementData]);

    const RenderAttendance = useCallback(() => {
        return (

            <Attendance
                passingData={attendanceData}
                onFilterReturn={async (start, end) => {
                    await fetchAttendanceData(start, end);
                }}
                onRefresh={async (start, end) =>
                    await fetchAttendanceData(start, end)
                }
            />

        );
    }, [attendanceData]);

    const RenderRepair = useCallback(
        () => (

            <RepairAndMaintenance
                data={repairData}
                onRefresh={async () => {
                    await fetchRepairingData();
                }}
            />

        ),
        [repairData],
    );



    const tabs = [
        {
            value: "attendance",
            label: "Attendance",
            icon: CalendarCheck,
            count: attendanceData?.filter((item) => item.status !== 'Absent').length || 0,

        },

        {
            value: "repair",
            label: "Repairing & Maintenance",
            icon: Users,
            count: repairData.length || 0,

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
            value: "issued",
            label: "Returnable",
            icon: RotateCcw,
            count: allReturnables,

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

                <ScrollArea className={`${tabsMaxWidth}`}>


                    <UserTabs tabs={tabs} routeTo={routeTo} activeTab={activeTab} />


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
                <div hidden={activeTab !== "issued"} >
                    <RenderReturnable userID={userID} onUpdateTotal={(val) => setAllReturnables(val)} />
                </div>
                <div hidden={activeTab !== "fines"} >
                    <RenderFines userID={userID} onUpdateTotal={(val) => setAllFines(val)} />
                </div>

                <div hidden={activeTab !== "repair"} >
                    <RenderRepair />
                </div>


            </div>
        </div>
    );
}
