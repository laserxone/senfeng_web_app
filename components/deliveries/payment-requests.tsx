"use client";

import Dropzone from "@/components/dropzone";
import {
    CircleDollarSign,
    Clock3,
    Loader2,
    ReceiptText,
    Wallet,
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UploadImage } from "@/lib/uploadFunction";
import AppCalendar from "../appCalendar";
import Spinner from "../ui/spinner";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";

type PaymentRequest = {
    id: number;
    request_type: boolean;
    created_at: string;
    amount: string;
    slip: string;
    date: Date;
    tid: string;
    sale_id: number;
    serial_no: string;
    customer_id: number;
    customer_name: string;
    customer_owner: string;
    ownership_name: string;
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
    });

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
        });

        setDialogOpen(true);
    };

    const handleRecordPayment = async () => {
        if (!selected) return;

        try {
            setSubmitting(true);

            let name = `/payment-requests/${selected.id}.png`


            const imageRefResult = await UploadImage(
                form?.slip,
                name,
                "image/png",
            );


            await axios.put(`/${userID}/payment-requests`, {
                id: selected.id,
                date: form.date,
                tid: form.tid,
                amount: form.amount,
                slip: name,
                request_type: false
            });

            await fetchPaymentRequests()

            setDialogOpen(false);
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

    return (
        <div className="flex flex-1 flex-col space-y-6">
            <Heading
                title="Payment Requests"
                description="Track requested, submitted and pending payments"
            />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Requested
                            </p>

                            <h2 className="mt-1 text-2xl font-bold">
                                PKR {totals.totalRequested.toLocaleString()}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-primary/10 p-3">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Paid
                            </p>

                            <h2 className="mt-1 text-2xl font-bold">
                                PKR {totals.totalPaid.toLocaleString()}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-green-500/10 p-3">
                            <CircleDollarSign className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Due
                            </p>

                            <h2 className="mt-1 text-2xl font-bold">
                                PKR {totals.totalDue.toLocaleString()}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-orange-500/10 p-3">
                            <Clock3 className="h-5 w-5 text-orange-600" />
                        </div>
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
                <div className="grid gap-4">
                    {requests.map((item) => (
                        <Card
                            key={item.id}
                            className="border-border/60 shadow-sm transition-all hover:shadow-md"
                        >
                            <CardHeader className="pb-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ReceiptText className="h-4 w-4" />
                                            Machine #{item.serial_no || item.sale_id}
                                        </CardTitle>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.customer_name || "-"} • Manager:{" "}
                                            {item.customer_owner || "-"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={
                                                item.request_type ? "destructive" : "secondary"
                                            }
                                        >
                                            {item.request_type
                                                ? "Payment Requested"
                                                : "Payment Submitted"}
                                        </Badge>

                                        {item.request_type && (
                                            <Dialog
                                                open={dialogOpen && selected?.id === item.id}
                                                onOpenChange={setDialogOpen}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(item)}
                                                    >
                                                        Record Payment
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent className="sm:max-w-lg">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Record Payment
                                                        </DialogTitle>

                                                        <DialogDescription>
                                                            Submit payment information for this request.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="grid gap-4 pt-4">
                                                        <div className="grid gap-2">
                                                            <label className="text-sm font-medium">
                                                                Date
                                                            </label>

                                                            <AppCalendar date={form.date} onChange={(e) =>
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    date: e,
                                                                }))
                                                            } />

                                                        </div>

                                                        <div className="grid gap-2">
                                                            <label className="text-sm font-medium">
                                                                TID
                                                            </label>

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
                                                            <label className="text-sm font-medium">
                                                                Amount
                                                            </label>

                                                            <Input
                                                                disabled
                                                                value={Number(
                                                                    form.amount
                                                                ).toLocaleString()}
                                                            />
                                                        </div>



                                                        <div className="grid gap-2">
                                                            <label className="text-sm font-medium">
                                                                Slip
                                                            </label>
                                                            <div className="flex w-full justify-center">

                                                                <Dropzone
                                                                    value={form?.slip}
                                                                    onDrop={(file) => {
                                                                        setForm((prev) => {
                                                                            if (!prev) return prev;
                                                                            return { ...prev, slip: file };
                                                                        });
                                                                    }}
                                                                    title={"Click to upload"}
                                                                    subheading={"or drag and drop"}
                                                                    description={"PNG or JPG"}
                                                                    drag={"Drop the files here..."}
                                                                />
                                                            </div>


                                                        </div>

                                                        <Button
                                                            disabled={submitting}
                                                            onClick={handleRecordPayment}
                                                        >
                                                            {submitting && (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            )}

                                                            Submit Payment
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Amount
                                        </p>

                                        <p className="font-semibold">
                                            PKR {Number(item.amount).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            TID
                                        </p>

                                        <p className="font-medium">
                                            {item.tid || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Payment Date
                                        </p>

                                        <p className="font-medium">
                                            {item.date
                                                ? moment(item.date).format("DD MMM YYYY")
                                                : "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Ownership
                                        </p>

                                        <p className="font-medium">
                                            {item.ownership_name || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Requested At
                                        </p>

                                        <p className="font-medium">
                                            {moment(item.created_at).format(
                                                "DD MMM YYYY"
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {item.slip && (
                                    <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Payment Slip
                                        </p>

                                       <RenderPaymentSlip img={item.slip}/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


const RenderPaymentSlip = ({ img }: { img: string }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!img) {
      setLocalImage(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (img.includes("http")) {
      setLocalImage(img);
      setLoading(false);
    } else {
      getDownloadURL(ref(storage, img))
        .then((url) => {
          setLocalImage(url);
        })
        .catch(() => {
          setError(true);
          setLocalImage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [img]);

  if (loading) return <Spinner />;
  if (!img || error || !localImage) return <p>No image</p>;

  return (
    <Zoom>
      <img
        alt="visit image"
        className="dark:invert"
        src={localImage}
        width="100"
      />
    </Zoom>
  );
};
