"use client";
import PageTable from "@/components/shared/tables/app-table";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserRepairing } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import moment from "moment";
import { useEffect, useState } from "react";


export default function RepairAndMaintenance({ data = [], onRefresh, height }: { data: UserRepairing[], onRefresh: () => Promise<void>, height?: string }) {


    const [selectedTask, setSelectedTask] = useState<UserRepairing | null>(null);
    const { userID } = useUserDetail()
    const [filter, setFilter] = useState("all")
    const columns: ColumnDef<UserRepairing>[] = [
        {
            accessorKey: "assign_date",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Assigned Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex gap-2 items-center">
                    <div
                        className={`${row.original.status === "pending" ? "bg-red-500" : "bg-green-500"
                            } border border-white h-3 w-3`}
                    />{" "}
                    <div>
                        {moment(new Date(row.getValue("assign_date"))).format("YYYY-MM-DD")}
                    </div>
                </div>
            ),
        },

        {
            accessorKey: "user_name",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Assigned To
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
        },

        {
            accessorKey: "deliver_date",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Delivery Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>
                    {moment(new Date(row.getValue("deliver_date"))).format("YYYY-MM-DD")}
                </div>
            ),
        },

        {
            accessorKey: "customer_name",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Customer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
        },

        {
            accessorKey: "owner_name",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Sale Person
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("owner_name")}</div>,
        },

        {
            accessorKey: "remarks",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Remarks
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("remarks")}</div>,
        },

        {
            accessorKey: "remarks_other",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Engineer Remarks
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("remarks_other")}</div>,
        },
    ];

    const filteredData =
        filter === "all"
            ? data
            : data.filter(item => item.status?.includes(filter))

    return (
        <div className="flex flex-1 flex-col space-y-4">

            <div className="flex flex-1">


                <PageTable
                    onRowClick={(val) => setSelectedTask(val)}
                    loading={false}
                    columns={columns}
                    data={filteredData}
                >
                    <div className="w-[200px]">
                        <Select onValueChange={setFilter} value={filter}>
                            <SelectTrigger >
                                <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Cleared</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </PageTable>




                <UpdateTaskModal
                    open={!!selectedTask}
                    onChange={() => setSelectedTask(null)}
                    userID={userID}
                    task_id={selectedTask?.id}
                    onRefresh={onRefresh}
                />
            </div>
        </div>
    );
}

type UpdateTaskModal = {
    open: boolean
    onChange: () => void
    onRefresh: () => Promise<void>
    task_id?: number
    userID: number | string
}
const UpdateTaskModal = ({ open, onChange, userID, onRefresh, task_id }: UpdateTaskModal) => {
    useEffect(() => {
        if (open) {
            setForm({ status: null, remarks_other: "" });
            setLoading(false)
        }
    }, [open]);
    const [form, setForm] = useState({
        status: null,
        remarks_other: "",
    });
    const [loading, setLoading] = useState(false);

    const updateForm = (key: string, value: string) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveTask = async () => {
        setLoading(true);

        axios
            .put(`/${userID}/lab/${task_id}`, form)
            .then(() => {
                onRefresh();
                setForm({
                    status: null,
                    remarks_other: "",
                });
                onChange();
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Dialog open={open} onOpenChange={onChange}>
            <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
                <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
                    <DialogTitle className="text-sm font-semibold text-foreground">Update Task</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(100dvh-132px)]">
                    <div className="flex flex-col gap-3 p-3.5 pb-4">

                        <div>
                            <h1>
                                Status <RequiredStar />
                            </h1>
                            <div className="flex gap-2 mt-1">
                                <Button
                                    variant={form.status === "pending" ? "default" : "outline"}
                                    onClick={() => updateForm("status", "pending")}
                                >
                                    Pending
                                </Button>
                                <Button
                                    variant={form.status === "completed" ? "default" : "outline"}
                                    onClick={() => updateForm("status", "completed")}
                                >
                                    Completed
                                </Button>
                            </div>
                        </div>


                        <div>
                            <h1>Remarks</h1>
                            <Textarea
                                placeholder="Enter remarks"
                                value={form.remarks_other}
                                onChange={(e) => updateForm("remarks_other", e.target.value)}
                            />
                        </div>


                        <Button disabled={!form.status || loading} onClick={handleSaveTask}>
                            {loading && <Spinner />} Save
                        </Button>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
