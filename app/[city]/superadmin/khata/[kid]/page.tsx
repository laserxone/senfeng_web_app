"use client";

import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import AppCalendar from "@/components/app-calendar";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";

type Khata = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    note: string | null;
    created_at: string;
};

type Payment = {
    id: number;
    khata_id: number;
    amount: string;
    date: Date | undefined;
    remarks: string | null;
    created_at: string;
    tid: string
};

const emptyPaymentForm: {
    tid: string;
    amount: string
    date: Date | undefined
    remarks: string
} = {
    amount: "",
    date: new Date(),
    remarks: "",
    tid: ""
};

export default function KhataDetailPage() {
    const router = useRouter();
    const params = useParams();

    const khataId = params.kid as string;
    const { userID, base_route } = useUserDetail();

    const [khata, setKhata] = useState<Khata | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

    const [khataLoading, setKhataLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);
    const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(
        null
    );

    const [paymentErrors, setPaymentErrors] = useState({
        amount: "",
        date: "",

    });

    const fetchKhata = async () => {
        if (!userID || !khataId) return;

        try {
            setKhataLoading(true);
            const res = await axios.get(`/${userID}/khata/${khataId}`);
            setKhata(res.data);
        } finally {
            setKhataLoading(false);
        }
    };

    const fetchPayments = async () => {
        if (!userID || !khataId) return;

        try {
            setPaymentLoading(true);
            const res = await axios.get(`/${userID}/khata/${khataId}/payments`);
            setPayments(res.data || []);
        } finally {
            setPaymentLoading(false);
        }
    };

    useEffect(() => {
        if (userID && khataId) {
            fetchKhata();
            fetchPayments();
        }
    }, [userID, khataId]);



    const savePayment = async () => {
        if (!userID || !khataId) return;

        const isValid = validatePaymentForm();
        if (!isValid) return;

        const payload = {
            tid: paymentForm.tid.trim(),
            amount: Number(paymentForm.amount),
            date: paymentForm.date,
            remarks: paymentForm.remarks.trim(),
        };

        try {
            setSavingPayment(true);

            if (editingPayment) {
                await axios.put(
                    `/${userID}/khata/${khataId}/payments/${editingPayment.id}`,
                    payload
                );
            } else {
                await axios.post(`/${userID}/khata/${khataId}/payments`, payload);
            }

            setPaymentOpen(false);
            setEditingPayment(null);
            setPaymentForm(emptyPaymentForm);
            resetPaymentErrors();
            await fetchPayments();
        } finally {
            setSavingPayment(false);
        }
    };

    const deletePayment = async (paymentId: number) => {
        if (!userID || !khataId) return;
        if (!confirm("Delete this payment?")) return;

        try {
            setDeletingPaymentId(paymentId);
            await axios.delete(`/${userID}/khata/${khataId}/payments/${paymentId}`);
            await fetchPayments();
        } finally {
            setDeletingPaymentId(null);
        }
    };

    const totalAmount = payments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const validatePaymentForm = () => {
        const errors = {

            amount: "",
            date: "",

        };



        if (!paymentForm.amount.trim()) {
            errors.amount = "Amount is required";
        } else if (Number(paymentForm.amount) <= 0) {
            errors.amount = "Amount must be greater than 0";
        }

        if (!paymentForm.date) {
            errors.date = "Date is required";
        }



        setPaymentErrors(errors);

        return !Object.values(errors).some(Boolean);
    };


    const resetPaymentErrors = () => {
        setPaymentErrors({
            amount: "",
            date: "",
        });
    };

    const openPaymentCreate = () => {
        setEditingPayment(null);
        setPaymentForm(emptyPaymentForm);
        resetPaymentErrors();
        setPaymentOpen(true);
    };

    const openPaymentEdit = (payment: Payment) => {
        setEditingPayment(payment);
        setPaymentForm({
            tid: paymentForm.tid.trim(),
            amount: String(payment.amount),
            date: payment.date ? new Date(payment.date) : undefined,
            remarks: payment.remarks || "",
        });
        resetPaymentErrors();
        setPaymentOpen(true);
    };

    return (
        <div className="flex flex-1 flex-col space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/${base_route}/khata`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <Heading
                        title={khata?.name || "Khata Detail"}
                        description="Khata detail and payment history"
                    />
                </div>

                <Button onClick={openPaymentCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Payment
                </Button>
            </div>

            {khataLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : khata ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Khata Information</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Name
                                </p>
                                <p className="mt-1 text-sm font-semibold">{khata.name}</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Start Date
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {moment(khata.start_date).format("YYYY-MM-DD")}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    End Date
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {moment(khata.end_date).format("YYYY-MM-DD")}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Created At
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {moment(khata.created_at).format("YYYY-MM-DD")}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4 sm:col-span-2 lg:col-span-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Note
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {khata.note || "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                    Khata not found.
                </div>
            )}

            <Card>
                <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                        Total Amount
                    </p>
                    <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        {totalAmount.toLocaleString()}
                    </h2>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>

                <CardContent>
                    {paymentLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                            No payments added yet.
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border">
                            <div className="hidden grid-cols-[140px_140px_160px_1fr_180px] border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
                                <div>Date</div>
                                <div>TID</div>
                                <div>Amount</div>
                                <div>Remarks</div>
                                <div className="text-right">Actions</div>
                            </div>

                            <div className="divide-y">
                                {payments.map((payment) => {
                                    const isDeleting = deletingPaymentId === payment.id;

                                    return (
                                        <div
                                            key={payment.id}
                                            className="grid gap-3 p-4 md:grid-cols-[140px_140px_160px_1fr_180px] md:items-center"
                                        >
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground md:hidden">
                                                    Date
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {moment(payment.date).format("YYYY-MM-DD")}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground md:hidden">
                                                    TID
                                                </p>

                                                <p className="text-sm font-medium">
                                                    {payment.tid}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground md:hidden">
                                                    Amount
                                                </p>
                                                <p className="text-sm font-semibold">
                                                    {Number(payment.amount).toLocaleString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground md:hidden">
                                                    Remarks
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payment.remarks || "-"}
                                                </p>
                                            </div>

                                            <div className="flex gap-2 md:justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openPaymentEdit(payment)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={isDeleting}
                                                    onClick={() => deletePayment(payment.id)}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                    )}
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPayment ? "Edit Payment" : "Create Payment"}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldSet className="rounded-lg border p-4">
                        <FieldLegend className="px-2 text-sm font-medium">
                            Payment Information
                        </FieldLegend>

                        <div className="mt-3 space-y-4">

                            <div className="space-y-2">
                                <Label>
                                    TID
                                </Label>

                                <Input
                                    placeholder="Enter transaction ID"
                                    value={paymentForm.tid}
                                    onChange={(e) => {
                                        setPaymentForm({
                                            ...paymentForm,
                                            tid: e.target.value,
                                        });


                                    }}
                                />


                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Amount <span className="text-destructive">*</span>
                                </Label>

                                <Input
                                    type="number"
                                    placeholder="Enter payment amount"
                                    value={paymentForm.amount}
                                    onChange={(e) => {
                                        setPaymentForm({
                                            ...paymentForm,
                                            amount: e.target.value,
                                        });
                                        setPaymentErrors({ ...paymentErrors, amount: "" });
                                    }}
                                />

                                {paymentErrors.amount && (
                                    <p className="text-sm text-destructive">
                                        {paymentErrors.amount}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Date <span className="text-destructive">*</span>
                                </Label>

                                <AppCalendar
                                    date={paymentForm.date}
                                    onChange={(date) => {
                                        setPaymentForm({ ...paymentForm, date });
                                        setPaymentErrors({ ...paymentErrors, date: "" });
                                    }}
                                />

                                {paymentErrors.date && (
                                    <p className="text-sm text-destructive">
                                        {paymentErrors.date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Remarks
                                </Label>

                                <Textarea
                                    placeholder="Add payment remarks"
                                    className="min-h-24 resize-none"
                                    value={paymentForm.remarks}
                                    onChange={(e) => {
                                        setPaymentForm({
                                            ...paymentForm,
                                            remarks: e.target.value,
                                        });

                                    }}
                                />

                            </div>
                        </div>
                    </FieldSet>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={savingPayment}
                            onClick={() => setPaymentOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button disabled={savingPayment} onClick={savePayment}>
                            {savingPayment && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingPayment ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}