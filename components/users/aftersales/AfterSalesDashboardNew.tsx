"use client";

import PageTablePagination from "@/components/app-table-without-pagination";
import CurrencyFormatter from "@/components/currency-formatter";
import { MyImgZooming } from "@/components/img-zooming";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "@/components/ui/spinner";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { AttendanceTableRow, UserAttendanceRecord } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import {
    ArrowUpDown,
    BadgeCheck,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleDollarSign,
    ClipboardCheck,
    Clock3,
    Gauge,
    Paperclip,
    ReceiptText,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    UserCheck,
    UserMinus,
    Users,
    Wrench
} from "lucide-react";
import momentT from "moment-timezone";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useMemo, useState } from "react";
import DashboardStatsCard from "./aftersales-dashboard-stats-card";
import EmptyState from "./aftersales-emptystate";
import FeedbackDialog from "./aftersales-feedback-dialog";
import { formatCurrency, formatDate, generateAttendanceData, isCompleted, isResolved, percent } from "./aftersales-functions";
import MiniMetric from "./aftersales-minimetric";
import SectionTitle from "./aftersales-section-tile";
import StatusBadge from "./aftersales-statusbadge";
import {
    AfterSalesFeedbackResponse,
    AfterSalesPOSResponse,
    AfterSalesReimbursement,
    ComplaintAssignment
} from "./aftersales-types";
import AfterSalesDashboard from "./AfterSalesDashboard";


export default function AfterSalesDashboardNew() {



    const { userID, reimbursement_approval } = useUserDetail();

    const [data, setData] = useState<AfterSalesReimbursement[]>([]);
    const [feedbacks, setFeedbacks] = useState<AfterSalesFeedbackResponse | null>(null)

    const start = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
    const end = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();

    useEffect(() => {
        if (userID) {

            fetchData()
            fetchFeedbackData()
        }

    }, [userID, reimbursement_approval]);

    async function fetchData() {
        try {

            if (reimbursement_approval) {
                const reimbursement = await axios.get(`/${userID}/reimbursementapproval?start_date=${start}&end_date=${end}`);
                setData(reimbursement.data);
            }
        } finally {
        }
    }

    async function fetchFeedbackData() {
        try {
            const feedback = await axios.get(
                `/${userID}/dashboard/aftersales/memberfeedback?start=${start}&end=${end}`,
            );
            setFeedbacks(feedback.data);
        } finally {
        }
    }


    return (
        <div className="flex flex-1 gap-5">
            <div className="flex flex-1 flex-col gap-4">
                <div className="flex w-full flex-col gap-3">
                    <div className="flex gap-3 w-full">
                        <div className="grid gap-3 xl:grid-cols-2 w-full">
                            <Feedback data={feedbacks} iconSize="size-3.5"/>
                            <Complaint start={start} end={end} iconSize="size-3.5"/>
                            <POSAfterSales iconSize="size-3.5"/>
                            <TeamAttendanceAfterSales start={start} end={end} iconSize="size-3.5"/>
                            <ReimbursementAfterSalesMetrics data={data} iconSize="size-3.5"/>
                        </div>
                        {data.length > 0 && <ReimbursementAfterSales data={data} onRefresh={fetchData} />}

                    </div>
                    <AfterSalesDashboard onRefresh={fetchFeedbackData} data={{
                        withFeedback: feedbacks?.withFeedback.data.map((item) => ({ ...item, number: item.number.join(", ") })) ?? [],
                        withoutFeedback: feedbacks?.withoutFeedback.data.map((item) => ({ ...item, number: item.number.join(", ") })) ?? []
                    }} />
                </div>
            </div>
        </div>
    );
}

const Feedback = ({ data, iconSize="" }: { data: AfterSalesFeedbackResponse | null, iconSize ?: string }) => {

    const [open, setOpen] = useState(false)

    const analytics = useMemo(() => {
        const completed = data?.withFeedback.total ?? 0
        const totalPending = data?.withoutFeedback?.total ?? 0
        const satisfied = data?.satisfied ?? 0
        const unsatisfied = data?.unsatisfied ?? 0;

        return {
            total: completed + totalPending,
            completed,
            satisfied,
            unsatisfied,
            satisfactionRate: percent(satisfied, satisfied + unsatisfied),
        };
    }, [data]);

    return (
        <>
            <DashboardStatsCard
                title="Member Feedback Analytics"
                subtitle="Click to place your feedback analytics component."
                icon={<ThumbsUp className="size-4" />}
                button={true}
                onClick={() => setOpen(true)}
                option={2}

                metrics={[
                    { label: "Total", value: analytics.total, icon: <Users />, tone: "blue" },
                    { label: "Completed", value: analytics.completed, icon: <CheckCircle2 className={iconSize}/>, tone: "green" },
                    { label: "Satisfied", value: analytics.satisfied, icon: <ThumbsUp className={iconSize}/>, tone: "green" },
                    { label: "Unsatisfied", value: analytics.unsatisfied, icon: <ThumbsDown className={iconSize}/>, tone: "red" },
                    { label: "Rate", value: `${analytics.satisfactionRate}%`, icon: <Gauge className={iconSize}/>, tone: "violet" },
                ]}
            />

            <FeedbackDialog data={{
                withFeedback: data?.withFeedback.data.map((item) => ({ ...item, number: item.number.join(", ") })) ?? [],
                withoutFeedback: data?.withoutFeedback.data.map((item) => ({ ...item, number: item.number.join(", ") })) ?? []
            }} onRefresh={async () => { }} description="" title="" onOpenChange={setOpen} open={open} />
        </>
    );
};

const Complaint = ({ start, end, iconSize = "" }: { start: string, end: string, iconSize ?: string }) => {
    const { userID, base_route } = useUserDetail();
    const [data, setData] = useState<ComplaintAssignment[]>([]);
    const router = useRouter()

    useEffect(() => {
        if (userID) fetchData();

    }, [userID]);

    async function fetchData() {
        try {
            const complaint = await axios.get(
                `/${userID}/dashboard/aftersales/complaint?start=${start}&end=${end}`,
            );
            setData(complaint.data);
        } finally {
        }
    }

    const analytics = useMemo(() => {
        const newComplaints = data.filter((item) => !item.engineer_id && !item.assignment_id).length;
        const pending = data.filter((item) => (item.engineer_id || item.assignment_id) && (!item.logs || item.logs.length === 0)).length;
        const resolved = data.filter((item) => isResolved(item.status || item.complaint_status)).length;
        const installations = data.filter((item) => item.installation || item.complaint_installation).length;
        const completed = data.filter((item) => isCompleted(item.status || item.complaint_status)).length;

        return { newComplaints, pending, resolved, installations, completed };
    }, [data]);

    return (
        <>
            <DashboardStatsCard
                title="Complaint Overview"
                option={3}
                subtitle="Click to place your complaint detail component."
                icon={<CircleAlert className="size-4" />}
                button={true}
                onClick={() => router.push(`/${base_route}/complaint`)}
                metrics={[
                    { label: "New", value: analytics.newComplaints, icon: <CircleAlert className={iconSize}/>, tone: "blue" },
                    { label: "Pending", value: analytics.pending, icon: <Clock3 className={iconSize}/>, tone: "amber" },
                    { label: "Resolved", value: analytics.resolved, icon: <BadgeCheck className={iconSize}/>, tone: "green" },
                    { label: "Installations", value: analytics.installations, icon: <Wrench className={iconSize}/>, tone: "violet" },
                    { label: "Completed", value: analytics.completed, icon: <ClipboardCheck className={iconSize}/>, tone: "green" },
                ]}
            />

        </>
    );
};

const POSAfterSales = ({iconSize=""} : {iconSize ?: string}) => {
    const { userID } = useUserDetail();
    const [data, setData] = useState<null | AfterSalesPOSResponse>(null);

    useEffect(() => {
        if (userID) fetchData();
    }, [userID]);

    async function fetchData() {
        try {
            const pos = await axios.get(`/${userID}/dashboard/aftersales/pos`);
            setData(pos.data?.data && "total_sales" in pos.data ? pos.data : pos.data?.data || null);
        } finally {
        }
    }

    const totalSales = Number(data?.total_sales || 0);
    const completed = Number(data?.total_completed || 0);
    const pending = Number(data?.total_pending || 0);
    const collection = Number(data?.collection || 0);
    const collectionRate = collection.toFixed(2);

    return (
        <DashboardStatsCard
            title="POS Sales Snapshot"
            subtitle="Passive sales, pending, completed, and collection summary."
            icon={<ReceiptText className="size-4" />}
            option={4}
            metrics={[
                { label: "Total Sales", value: <CurrencyFormatter amount={totalSales} showPKR={false} />, icon: <Banknote className={iconSize}/>, tone: "blue" },
                { label: "Pending", value: <CurrencyFormatter amount={pending} showPKR={false} />, icon: <Clock3 className={iconSize}/>, tone: "amber" },
                { label: "Completed", value: <CurrencyFormatter amount={completed} showPKR={false} />, icon: <CheckCircle2 className={iconSize}/>, tone: "green" },
                { label: "Collection", value: `${collectionRate}%`, icon: <CircleDollarSign className={iconSize}/>, tone: "violet" },
            ]}
        />
    );
};

const TeamAttendanceAfterSales = ({ start, end, iconSize="" }: { start: string, end: string, iconSize ?: string }) => {
    const { userID } = useUserDetail();
    const [open, setOpen] = useState(false);

    const [data, setData] = useState<AttendanceTableRow[]>([]);

    useEffect(() => {
        if (userID) fetchData();

    }, [userID]);

    async function fetchData() {
        try {
            const team = await axios.get(`/${userID}/attendance?team=true&start_date=${start}&end_date=${end}`);
            const apiData = team.data.map((item: UserAttendanceRecord) => {
                let status = item?.leave_status ? `Leave ${item?.leave_status}` : "Absent";

                if (item?.time_in) {
                    const checkInTime = new Date(item.time_in);
                    const threshold = new Date(item.time_in);
                    threshold.setHours(10, 10, 0, 0);
                    status = checkInTime > threshold ? "Late" : "Present";
                }

                return { ...item, date: item?.time_in || item?.leave_date || item.date, status };
            });
            setData(generateAttendanceData(apiData, start, end));
        } finally {
        }
    }

    const analytics = useMemo(() => {
        const present = data.filter((item) => item.status === "Present").length;
        const absent = data.filter((item) => item.status === "Absent").length;
        const late = data.filter((item) => item.status === "Late").length;
        const workingDays = Array.from(new Set(data.map((item) => item.date))).length;
        const trackedDays = present + absent + late;
        const users = Object.values(
            data.reduce<Record<string, { name: string; present: number; absent: number; late: number; total: number }>>((acc, item) => {
                const key = item.user_email || item.user_name;
                acc[key] ||= { name: item.user_name || key, present: 0, absent: 0, late: 0, total: 0 };
                acc[key].total += 1;
                if (item.status === "Present") acc[key].present += 1;
                if (item.status === "Absent") acc[key].absent += 1;
                if (item.status === "Late") acc[key].late += 1;
                return acc;
            }, {}),
        );

        return {
            present,
            absent,
            late,
            workingDays,
            users,
            presentPercentage: percent(present, trackedDays),
            absentPercentage: percent(absent, trackedDays),
            latePercentage: percent(late, trackedDays),
        };
    }, [data]);

    return (
        <>
            <DashboardStatsCard
                title="Team Attendance Record"
                subtitle="Click to inspect team attendance table."
                option={5}
                icon={<CalendarDays className="size-4" />}
                button={true}
                onClick={() => setOpen(true)}
                metrics={[
                    { label: "Present", value: `${analytics.presentPercentage}%`, icon: <UserCheck className={iconSize}/>, tone: "green" },
                    { label: "Absent", value: `${analytics.absentPercentage}%`, icon: <UserMinus className={iconSize}/>, tone: "red" },
                    { label: "Late", value: `${analytics.latePercentage}%`, icon: <Clock3 className={iconSize}/>, tone: "amber" },
                    { label: "Working Days", value: analytics.workingDays, icon: <CalendarDays className={iconSize}/>, tone: "blue" },
                ]}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Team Attendance Record</DialogTitle>
                        <DialogDescription>Present, absent, late, and attendance percentage by team member.</DialogDescription>
                    </DialogHeader>
                    <AttendanceTable users={analytics.users.map((item) => ({ ...item, rate: percent(item.present + item.late, item.total) }))} />
                </DialogContent>
            </Dialog>
        </>
    );
};

const ReimbursementAfterSalesMetrics = ({ data, iconSize="" }: { data: AfterSalesReimbursement[], iconSize ?: string }) => {

    const pending = data.filter((item) => !item.verified).length;
    const approved = data.filter((item) => item.verified).length;




    return (
        <section className="rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <SectionTitle
                    option={1}
                    title="Reimbursement Overview"
                    subtitle="Quick review and verification."
                    icon={<Banknote className="size-4" />}
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <MiniMetric label="Requests" value={data.length} icon={<ReceiptText className={iconSize}/>} tone="blue" />
                <MiniMetric label="Pending" value={pending} icon={<Clock3 className={iconSize}/>} tone="amber" />
                <MiniMetric label="Approved" value={approved} icon={<BadgeCheck className={iconSize}/>} tone="green" />
            </div>
        </section>
    );
};


export const ReimbursementAfterSales = ({ data, onRefresh }: { data: AfterSalesReimbursement[], onRefresh: () => Promise<void> }) => {
    const { userID } = useUserDetail();
    const [page, setPage] = useState(0);
    const [selectedItem, setSelectedItem] = useState<number | null>(null)
    const [deleteItem, setDeleteItem] = useState<number | null>(null)

    useEffect(() => {
        setPage(0);
    }, [data.length]);



    async function handleVerify(id: number) {
        if (!id) return

        setSelectedItem(id)
        try {
            await axios.put(`/${userID}/reimbursement/${id}`, {
                verified: true
            })

            await onRefresh();
        } finally {
            setSelectedItem(null)
        }
    }

    async function handleDelete(id: number) {
        if (!id) return

        setDeleteItem(id)
        try {
            await axios.delete(`/${userID}/reimbursement/${id}`)

            await onRefresh();
        } finally {
            setDeleteItem(null)
        }
    }

    const sortedData = useMemo(
        () => [...data].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()),
        [data],
    );
    const selected = sortedData[page];
    const canPrevious = page > 0;
    const canNext = page < sortedData.length - 1;

    return (
        <section className="w-[320px] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm justify-between gap-2 flex flex-col">

            <div className="mb-3 flex items-center gap-3">
                <SectionTitle
                    option={1}
                    title="Reimbursement Approval"
                    subtitle="Quick review and verification."
                    icon={<Banknote className="size-4" />}
                >
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            disabled={!canPrevious}
                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                            className="h-8 px-2.5"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            disabled={!canNext}
                            onClick={() => setPage((current) => Math.min(sortedData.length - 1, current + 1))}
                            className="h-8 px-2.5"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </SectionTitle>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-3">
                {selected ? (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {selected.submitted_by_name || selected.user_name || "Unknown user"}
                                    </p>
                                    <StatusBadge
                                        active={!!selected.verified}
                                        trueLabel="Approved"
                                        falseLabel="Pending"
                                    />
                                </div>

                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                    {selected.title || "Untitled request"}
                                </p>
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-foreground">
                                    {formatCurrency(Number(selected.amount || 0))}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {formatDate(selected.date || selected.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card px-3 py-2">
                            <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
                                {selected.description || "No description added."}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-2.5">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                                <Paperclip className="size-3.5" />
                                Attachment
                            </div>

                            {selected.image ? (

                                <MyImgZooming img={selected.image} />

                            ) : (
                                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                    No attachment
                                </p>
                            )}
                        </div>


                    </div>
                ) : (
                    <EmptyState label="No reimbursement requests found." />
                )}
            </div>

            {selected &&
                <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">

                        <p className="text-xs font-medium text-muted-foreground">
                            {` ${page + 1} / ${sortedData.length}`}
                        </p>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => handleVerify(selected.id)}
                            disabled={selectedItem === selected.id || selected.verified}
                            type="button"
                            size="sm"
                            className="h-8 bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                        >
                            {selectedItem === selected.id ? (
                                <Spinner />
                            ) : (
                                <BadgeCheck className="size-3.5" />
                            )}
                            Approve
                        </Button>

                        <Button
                            onClick={() => handleDelete(selected.id)}
                            disabled={deleteItem === selected.id}
                            type="button"
                            size="sm"
                            className="h-8 bg-rose-600 px-3 text-white hover:bg-rose-700"
                        >
                            {deleteItem === selected.id ? (
                                <Spinner />
                            ) : (
                                <Trash2 className="size-3.5" />
                            )}
                            Delete
                        </Button>
                    </div>
                </div>}
        </section>
    );
};

function AttendanceTable({ users }: { users: { name: string; present: number; absent: number; late: number; total: number, rate: number }[] }) {

    const columns: ColumnDef<{ name: string; present: number; absent: number; late: number; total: number, rate: number }>[] = [
        {
            accessorKey: "name",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Team Member
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="ml-2">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "present",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Present
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("present")}</div>,
        },

        {
            accessorKey: "absent",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Absent
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("absent")}</div>,
        },

        {
            accessorKey: "late",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Late
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("late")}</div>,
        },

        {
            accessorKey: "rate",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Attendance
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("rate")}%</div>,
        },


    ];

    return (
        <PageTablePagination
            columns={columns}
            data={users} />
    );
}










