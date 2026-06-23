"use client";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import {
    CircleDollarSign,
    Clock3,
    Edit,
    Loader2,
    Wallet
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import "react-medium-image-zoom/dist/styles.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";

import {
    Card,
    CardContent
} from "@/components/ui/card";

import PageTable from "@/components/app-table";
import Dropzone from "@/components/dropzone";
import { TriggerFirebaseForPendingPayments } from "@/lib/triggerFirebase";
import { UploadImage } from "@/lib/uploadFunction";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import AppCalendar from "../appCalendar";
import { MyImgZooming } from "../img-zooming";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

type PaymentRequest = {
    id: number;
    request_type: boolean;
    created_at: string;
    amount: string;
    slip: string;
    date: Date;
    tid: string;
    sale_id: number;
    order_no_arr: string[];
    customer_id: number;
    customer_name: string;
    customer_owner: string;
    ownership_name: string;
    customer_location: string;
    dispatch_information: { other_information?: { transporter?: string } }
    note: string
};

export default function PaymentRequestsPage() {
    const { userID } = useUserDetail();

    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const [selected, setSelected] = useState<PaymentRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        date: new Date(),
        tid: "",
        amount: "",
        slip: "",
        note: ""
    });
    const [edit, setEdit] = useState(false)

    const fetchPaymentRequests = async () => {
        if (!userID) return;

        try {
            setLoading(true);

            const res = await axios.get(`/${userID}/payment-requests`);

            setRequests(res.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userID) {
            fetchPaymentRequests();
        }
    }, [userID]);

    const handleOpenDialog = (item: PaymentRequest) => {
        setSelected(item);

        setForm({
            date: new Date(),
            tid: "",
            amount: item.amount,
            slip: "",
            note: ""
        });

        setDialogOpen(true);
    };


    const handleEditDialog = (item: PaymentRequest) => {
        setSelected(item);
        setEdit(true)

        setForm({
            date: item.date,
            tid: item.tid,
            amount: item.amount,
            slip: item.slip,
            note: item?.note ?? ""
        });

        setDialogOpen(true);
    };



    const handleRecordPayment = async () => {
        if (!selected) return;

        setSubmitting(true);

        try {
            const formData: any = {
                id: selected.id,
                date: form.date,
                tid: form.tid,
                amount: form.amount,
                note: form.note,
                request_type: false,
            };

            const shouldUploadSlip = !edit || selected.slip !== form.slip;

            if (shouldUploadSlip && form?.slip) {
                const slipPath = edit
                    ? selected.slip
                    : `/payment-requests/${selected.id}.png`;

                await UploadImage(form.slip, slipPath, "image/png");

                formData.slip = slipPath;
            }

            await axios.put(`/${userID}/payment-requests`, formData);
            TriggerFirebaseForPendingPayments();
            await fetchPaymentRequests();

            setDialogOpen(false);
            setEdit(false);
        } finally {
            setSubmitting(false);
        }
    };

    const totals = useMemo(() => {
        const totalRequested = requests.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const totalPaid = requests
            .filter((item) => !item.request_type)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const totalDue = requests
            .filter((item) => item.request_type)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return {
            totalRequested,
            totalPaid,
            totalDue,
        };
    }, [requests]);

    const columns: ColumnDef<PaymentRequest>[] = useMemo(() => [
        {
            accessorKey: "order_no_arr",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Order No
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.order_no_arr?.join(", ") || row.original.sale_id}
                </div>
            ),
        },

        {
            accessorKey: "dispatch_information",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Transporter
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original?.dispatch_information?.other_information?.transporter ?? "-"}
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
            cell: ({ row }) => <div>{row.original.customer_name || "-"}</div>,
        },
        {
            accessorKey: "customer_owner",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Owner
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.original.customer_owner || "-"}</div>,
        },

        {
            accessorKey: "customer_location",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Owner
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.original.customer_location || "-"}</div>,
        },
        {
            accessorKey: "ownership_name",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Ownership
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.original.ownership_name || "-"}</div>,
        },
        {
            accessorKey: "amount",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-semibold">
                    PKR {Number(row.original.amount || 0).toLocaleString()}
                </div>
            ),
        },
        {
            accessorKey: "tid",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    TID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.original.tid || "-"}</div>,
        },
        {
            accessorKey: "date",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Payment Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>
                    {row.original.date
                        ? moment(row.original.date).format("DD MMM YYYY")
                        : "-"}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            filterFn: "includesString",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Requested At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>{moment(row.original.created_at).format("DD MMM YYYY")}</div>
            ),
        },
        {
            accessorKey: "request_type",
            filterFn: "includesString",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.request_type ? "destructive" : "secondary"}>
                    {row.original.request_type ? "Requested" : "Submitted"}
                </Badge>
            ),
        },
        {
            id: "slip",
            header: "Slip",
            cell: ({ row }) =>
                row.original.slip ? <MyImgZooming img={row.original.slip} /> : "-",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const item = row.original;

                if (!item.request_type) {
                    return <Button size="icon" variant={"outline"} onClick={() => handleEditDialog(item)}>
                        <Edit />
                    </Button>;
                }

                return (
                    <Button size="sm" onClick={() => handleOpenDialog(item)}>
                        Record Payment
                    </Button>
                );
            },
        },
    ], [requests]);

    return (
        <div className="flex flex-1 flex-col space-y-6">
            <Heading
                title="Payment Requests"
                description="Track requested, submitted and pending payments"
            />

            {/* Summary Cards */}
            <div className="grid gap-3 md:grid-cols-3">
                <Card className="border-border/60 p-0">
                    <CardContent className="flex items-center justify-between p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Requested</p>
                            <h2 className="text-xl font-semibold">
                                PKR {totals.totalRequested.toLocaleString()}
                            </h2>
                        </div>
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>

                <Card className="border-border/60 p-0">
                    <CardContent className="flex items-center justify-between p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Paid</p>
                            <h2 className="text-xl font-semibold">
                                PKR {totals.totalPaid.toLocaleString()}
                            </h2>
                        </div>
                        <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>

                <Card className="border-border/60 p-0">
                    <CardContent className="flex items-center justify-between p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Due</p>
                            <h2 className="text-xl font-semibold">
                                PKR {totals.totalDue.toLocaleString()}
                            </h2>
                        </div>
                        <Clock3 className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                        No payment requests found.
                    </p>
                </div>
            ) : (
                <PageTable
                    loading={loading}
                    columns={columns}
                    data={requests}
                />
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Submit payment information for this request.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 pt-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Date</label>
                            <AppCalendar
                                date={form.date}
                                onChange={(date) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        date,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">TID</label>
                            <Input
                                placeholder="Enter transaction ID"
                                value={form.tid}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        tid: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Amount</label>
                            <Input disabled value={Number(form.amount).toLocaleString()} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Note</label>
                            <Input
                                placeholder="Enter note"
                                value={form.note}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        note: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Slip</label>
                            <div className="flex w-full justify-center">
                                <Dropzone
                                    value={form.slip}
                                    onDrop={(file) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            slip: file,
                                        }))
                                    }
                                    title="Click to upload"
                                    subheading="or drag and drop"
                                    description="PNG or JPG"
                                    drag="Drop the files here..."
                                />
                            </div>
                        </div>

                        <Button disabled={submitting || !form.amount || !form.date || !form.slip || !form.note} onClick={handleRecordPayment}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {edit ? "Edit" : "Submit"} Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
