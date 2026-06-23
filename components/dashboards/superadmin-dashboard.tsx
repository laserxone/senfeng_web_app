"use client";
import { AreaStats } from "@/components/charts/area_stats/page";
import { BarStats } from "@/components/charts/bar_stats/page";
import { Stats } from "@/components/charts/pie_stats/page";
import { Sale } from "@/components/charts/sales/page";
import SalesTeamProgressChart from "@/components/charts/sales_progress/page";
import { CustomerMapComponent } from "@/components/customerMapComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PakCities } from "@/constants/data";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import formatCurrency from "@/lib/formatCurrency";
import { AdminDashboard, AdminDashboardCustomers, AdminTeamTasks, TeamTaskForAdmin } from "@/lib/types";
import { MapProvider } from "@/providers/map-provider";
import { OfficeContext } from "@/store/context/OfficeContext";
import { Banknote, CheckCircle2, CircleDashed, ClipboardList, Clock3, MonitorCheck, UsersRound } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { FaCashRegister } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export default function SuperadminDashboard() {
    const [customers, setCustomers] = useState<AdminDashboardCustomers[]>([]);
    const [data, setData] = useState<AdminDashboard>();
    const [loading, setLoading] = useState(false);
    const [userTaskData, setUserTaskData] = useState<AdminTeamTasks[]>([]);
    const { userID } = useUserDetail()
    const debouncedUserId = useDebounce(userID, 1000);
    const { state: OfficeState } = useContext(OfficeContext)!
    const [showMachinesSold, setShowMachinesSold] = useState(false)
    const { base_route } = useUserDetail()

    useEffect(() => {
        if (debouncedUserId && OfficeState.value.data) {
            fetchData();
        }
    }, [debouncedUserId, OfficeState]);

    function fetchData() {
        setLoading(true)
        fetchCustomerList();
        fetchDashboardData();
    }


    async function fetchDashboardData() {
        axios
            .get(`/${debouncedUserId}/dashboard?office=${OfficeState.value.data}`)
            .then((response) => {
                setData(response.data);
                if (response.data?.team_task) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);

                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);

                    const splitTasksByDay = response.data.team_task.map((user: { tasks: TeamTaskForAdmin[] }) => {
                        const yesterdayTasks = user.tasks.filter((task: TeamTaskForAdmin) => {
                            const createdAt = new Date(task.created_at);
                            return createdAt >= yesterday && createdAt < today;
                        });

                        const todayTasks = user.tasks.filter((task: TeamTaskForAdmin) => {
                            const createdAt = new Date(task.created_at);
                            return createdAt >= today && createdAt <= todayEnd;
                        });

                        return {
                            ...user,
                            yesterdayTasks,
                            todayTasks,
                        };
                    });

                    setUserTaskData(splitTasksByDay);
                }
            })
            .catch((e) => console.log(e))
            .finally(() => {
                setLoading(false);
            });
    }

    async function fetchCustomerList() {
        try {
            axios.get(`/${debouncedUserId}/customer?map=true&office=${OfficeState.value.data}`).then((response) => {
                const customerList = response.data;
                const newArray = mergeArrays(customerList, PakCities);

                setCustomers(newArray);
            });
        } catch (error) {
            console.log(error);
        }
    }

    function mergeArrays(array1: any[], array2: any[]) {
        return array1
            .map((obj1) => {
                const matchingCity = array2.find(
                    (obj2) => obj2?.name === obj1?.location
                );

                if (matchingCity) {
                    return {
                        ...obj1,
                        latitude: matchingCity.lat,
                        longitude: matchingCity.lng,
                    };
                } else {
                    return null;
                }
            })
            .filter(Boolean);
    }

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    Hi, Welcome back 👋
                </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <MiniStatsCard
                    title="Payments"
                    value={formatCurrency(data?.total_payment_this_month ?? 0)}
                    subtitle={`${data?.payment_change_percentage}% from last month`}
                    loading={loading}
                    icon={Banknote}
                    className="bg-green-50 text-green-700"
                />

                <MiniStatsCard
                    onClick={() => setShowMachinesSold(true)}
                    title="Machines Sold"
                    value={formatCurrency(data?.total_machines_sold_this_month ?? 0)}
                    subtitle={`${data?.machines_sold_change_percentage}% from last month`}
                    loading={loading}
                    icon={MonitorCheck}
                    className="bg-blue-50 text-blue-700"
                />

                <MiniStatsCard
                    title="New Customers"
                    value={formatCurrency(data?.total_new_customers_this_month ?? 0)}
                    subtitle={`${data?.new_customer_change_percentage}% from last month`}
                    loading={loading}
                    icon={UsersRound}
                    className="bg-purple-50 text-purple-700"
                />

                <Card className="shadow-sm">
                    <CardContent className="items-center gap-3">
                        <div className="flex justify-between">
                            <p className="truncate text-lg font-bold">
                                Complaint Stats
                            </p>
                            <div className={`rounded-lg p-2 bg-orange-50 text-orange-700`}>
                                <ClipboardList className="h-4 w-4 " />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="flex items-center gap-1.5 text-green-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span className="text-xs">Paid</span>
                                    </div>

                                    {loading ? (
                                        <Skeleton className="mt-1 h-5 w-12" />
                                    ) : (
                                        <p className="mt-1 text-lg font-semibold text-green-700">
                                            {formatCurrency(data?.complaint_stats?.total_paid)}

                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 text-red-700">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        <span className="text-xs">Pending</span>
                                    </div>

                                    {loading ? (
                                        <Skeleton className="mt-1 h-5 w-12" />
                                    ) : (
                                        <p className="mt-1 text-lg font-semibold text-red-700">
                                            {formatCurrency(data?.complaint_stats?.total_pending)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                <Card className="shadow-sm">
                    <CardContent className="items-center gap-3">
                        <div className="flex justify-between">
                            <p className="truncate text-lg font-bold">
                                POS Stats
                            </p>
                            <div className={`rounded-lg p-2 bg-yellow-50 text-yellow-700`}>
                                <FaCashRegister className="h-4 w-4 " />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="grid grid-cols-2 gap-2">

                                <div>
                                    <div className="flex items-center gap-1.5 text-red-700">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        <span className="text-xs">Pending</span>
                                    </div>

                                    {loading ? (
                                        <Skeleton className="mt-1 h-5 w-12" />
                                    ) : (
                                        <p className="mt-1 text-lg font-semibold text-red-700">
                                            {formatCurrency(data?.pos_stats?.pending)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


            </div>

            {loading ? (
                <Skeleton className="h-64" />
            ) : (
                <SalesTeamProgressChart passingData={data?.team_progress || []} />
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    {loading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <BarStats data={data?.machines_sold_last_3_months || []} />
                    )}
                </div>
                <div className="col-span-4 md:col-span-3">
                    {loading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <Sale data={data?.recent_sales || []} />
                    )}
                </div>
                <div className="col-span-4">
                    {loading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <AreaStats data={data?.feedback_status_last_6_months || []} />
                    )}
                </div>
                <div className="col-span-4 md:col-span-3">
                    {loading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <Stats industryData={data?.industry_count || []} />
                    )}
                </div>
            </div>
            {loading ?
                <Skeleton className="h-64" />
                :

                <Card>
                    <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                            <CardTitle>Task status</CardTitle>
                            <Separator className="my-2" />
                            <ScrollArea className="h-[500px] pr-3">
                                {userTaskData.map((user) => (
                                    <div key={user.assigned_user_id} className="mb-10">
                                        <h2 className="text-xl font-bold mb-4">
                                            {user.assigned_user_name}
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderTaskCard(user.yesterdayTasks, "🕒 Yesterday")}
                                            {renderTaskCard(user.todayTasks, "📅 Today")}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </CardHeader>
                </Card>
            }

            <div className="mb-5">
                {loading ? (
                    <Skeleton className="h-96" />
                ) : (
                    customers.length > 0 && (
                        <MapProvider>
                            <CustomerMapComponent data={customers} />
                        </MapProvider>
                    )
                )}
            </div>

            <Dialog open={showMachinesSold} onOpenChange={setShowMachinesSold}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
                    <DialogHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/60 px-5 py-4 dark:from-slate-950 dark:to-blue-950/20">
                        <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <MonitorCheck className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight">
                                    Machines Sold
                                </DialogTitle>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {data?.total_machines_sold_this_month_data?.length ?? 0} machines sold this month
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(100dvh-145px)]">
                        <div className="p-3">
                            {!data?.total_machines_sold_this_month_data?.length ? (
                                <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                                    <div>
                                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                                            <MonitorCheck className="h-5 w-5" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold">No machines sold yet</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Sold machines for this month will appear here.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {data.total_machines_sold_this_month_data.map((item) => (
                                        <Link
                                            key={item.id}
                                            target="_blank"
                                            href={`/${base_route}/member/${item.customer_id}/${item.id}`}
                                            className="group block rounded-2xl border bg-card p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md dark:hover:border-blue-500/30 dark:hover:bg-blue-950/10"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <p className="truncate text-sm font-bold tracking-tight group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                                            {item.model || "Unknown model"}
                                                        </p>

                                                        {item.power ? (
                                                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                                                                {item.power}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <p className="mt-1 truncate text-xs font-medium text-foreground/80">
                                                        {item.customer_name || "Unknown customer"}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                        <span>Owner: {item.customer_owner || "N/A"}</span>
                                                        <span>Customer #{item.customer_id}</span>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 rounded-lg bg-muted/50 px-2.5 py-1.5 text-right">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Sale ID
                                                    </p>
                                                    <p className="text-xs font-bold">#{item.id}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                                                {item.order_no_arr?.length ? (
                                                    item.order_no_arr.map((orderNo) => (
                                                        <span
                                                            key={`${item.id}-${orderNo}`}
                                                            className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                                        >
                                                            {orderNo}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        No order numbers available
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const renderTaskCard = (tasks: TeamTaskForAdmin[], label: string) => {
    const completedCount = tasks.filter((task) => task.status === "Completed").length;
    const pendingCount = tasks.length - completedCount;

    return (
        <Card className="w-full overflow-hidden border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-foreground">{label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {tasks.length} total tasks
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {completedCount}
                        <span className="text-border">/</span>
                        <CircleDashed className="h-3.5 w-3.5 text-rose-500" />
                        {pendingCount}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-3">
                {tasks.length === 0 ? (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
                        <CircleDashed className="mb-2 h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">No tasks</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Nothing assigned for this window.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => {
                            const completed = task.status === "Completed";

                            return (
                                <div
                                    key={task.id}
                                    className={`group rounded-lg border p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${completed
                                        ? "border-emerald-200 bg-emerald-50/70"
                                        : "border-rose-200 bg-rose-50/70"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-background ${completed
                                                ? "border-emerald-200 text-emerald-700"
                                                : "border-rose-200 text-rose-600"
                                                }`}
                                        >
                                            {completed ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <CircleDashed className="h-4 w-4" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <p className="font-semibold leading-snug text-foreground">
                                                    {task.title || `Task #${task.id}`}
                                                </p>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${completed
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-rose-100 text-rose-700"
                                                        }`}
                                                >
                                                    {task.status || "Pending"}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                {moment(task.created_at).format("YYYY-MM-DD hh:mm A")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


function StatsCard({
    title,
    value,
    change,
    loading,
    icon: Icon,
    iconClassName,
}: {
    title: string;
    value: React.ReactNode;
    change: string;
    loading: boolean;
    icon: React.ElementType;
    iconClassName: string;
}) {
    return (
        <Card className="h-full shadow-sm">
            <CardContent className="flex h-full items-center gap-4 p-4">
                <div className={`rounded-xl p-2.5 ${iconClassName}`}>
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                        {title}
                    </p>

                    {loading ? (
                        <Skeleton className="mt-2 h-6 w-24" />
                    ) : (
                        <div className="mt-1 truncate text-xl font-bold">{value}</div>
                    )}

                    {loading ? (
                        <Skeleton className="mt-2 h-3 w-28" />
                    ) : (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                            {change}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function MiniStatsCard({
    title,
    value,
    subtitle,
    loading,
    icon: Icon,
    className,
    onClick
}: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    loading: boolean;
    icon: React.ElementType;
    className: string;
    onClick?: () => void
}) {
    return (
        <Card className="shadow-sm" onClick={() => onClick?.()}>
            <CardContent className="items-center gap-3">
                <div className="flex justify-between">
                    {!onClick ?
                        <p className="truncate text-lg font-bold">
                            {title}
                        </p>
                        :
                        <div onClick={onClick}>
                            <p className="cursor-pointer hover:underline truncate text-lg font-bold">
                                {title}
                            </p>
                        </div>
                    }
                    <div className={`rounded-lg p-2 ${className}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    {loading ? (
                        <Skeleton className="mt-1 h-5 w-20" />
                    ) : (
                        <div className="mt-0.5 truncate text-lg font-semibold">
                            {value}
                        </div>
                    )}

                    {loading ? (
                        <Skeleton className="mt-1 h-3 w-24" />
                    ) : (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
