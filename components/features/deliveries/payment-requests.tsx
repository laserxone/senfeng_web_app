"use client";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import {
  CircleDollarSign,
  Clock3,
  Edit,
  Loader2,
  Trash2,
  Wallet,
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";

import PageTable from "@/components/shared/tables/app-table";
import Dropzone from "@/components/shared/uploads/dropzone";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { TriggerFirebaseForPendingPayments } from "@/lib/triggerFirebase";
import { UploadImage } from "@/lib/uploadFunction";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  dispatch_information: { other_information?: { transporter?: string } };
  note: string;
};

export default function PaymentRequestsPage() {
  const { userID } = useUserDetail();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedForDelete, setSelectedForDelete] =
    useState<PaymentRequest | null>(null);

  const [form, setForm] = useState<{
    date: Date;
    tid: string;
    amount: string;
    slip: string | null;
    note: string;
  }>({
    date: new Date(),
    tid: "",
    amount: "",
    slip: "",
    note: "",
  });
  const [edit, setEdit] = useState(false);

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
      note: "",
    });

    setDialogOpen(true);
  };

  const handleEditDialog = (item: PaymentRequest) => {
    setSelected(item);
    setEdit(true);

    setForm({
      date: item.date,
      tid: item.tid,
      amount: item.amount,
      slip: item.slip,
      note: item?.note ?? "",
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
      0,
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

  const columns: ColumnDef<PaymentRequest>[] = useMemo(
    () => [
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
            {row.original?.dispatch_information?.other_information
              ?.transporter ?? "-"}
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
            Location
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
          <Badge
            variant={row.original.request_type ? "destructive" : "secondary"}
          >
            {row.original.request_type ? "Requested" : "Submitted"}
          </Badge>
        ),
      },
      {
        id: "slip",
        header: "Slip",
        cell: ({ row }) =>
          row.original.slip ? (
            <div className="inline-flex min-w-[104px] items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-1">
              <MyImgZooming img={row.original.slip} compact />
            </div>
          ) : (
            "-"
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex gap-2">
              {!item.request_type ? (
                <Button
                  size={"icon-sm"}
                  variant={"outline"}
                  onClick={() => handleEditDialog(item)}
                >
                  <Edit className="size-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={"outline"}
                  onClick={() => handleOpenDialog(item)}
                >
                  Record
                </Button>
              )}
              <Button
                onClick={() => setSelectedForDelete(item)}
                size={"icon-sm"}
                variant={"destructive"}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [requests],
  );

  async function handleDelete() {
    if (!selectedForDelete) return;
    setDeleteLoading(true);
    try {
      if (selectedForDelete?.slip) {
        await DeleteFromStorage(selectedForDelete?.slip);
      }
      await axios.delete(
        `/${userID}/payment-requests/${selectedForDelete?.id}`,
      );
      toast.success("Entry deleted successfully");
      setSelectedForDelete(null);
      await fetchPaymentRequests();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="p-4 sm:p-5">
          <Heading
            panel
            title="Payment Requests"
            description="Track requested, submitted and pending payments"
          />
        </div>

        <div className="grid border-t bg-muted/20 md:grid-cols-3 md:divide-x">
          {[
            {
              label: "Total requested",
              value: totals.totalRequested,
              icon: Wallet,
              color: "text-violet-600 dark:text-violet-400",
            },
            {
              label: "Total paid",
              value: totals.totalPaid,
              icon: CircleDollarSign,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Total due",
              value: totals.totalDue,
              icon: Clock3,
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 md:border-t-0 md:px-5"
              >
                <Icon className={`size-4 ${item.color}`} />
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {item.label}
                  </span>
                  <span className="truncate text-sm font-bold">
                    PKR {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
        <PageTable loading={loading} columns={columns} data={requests} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Record Payment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Submit payment information for this request.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <div className="grid gap-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase">
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

              <Button
                disabled={
                  submitting ||
                  !form.amount ||
                  !form.date ||
                  !form.slip ||
                  !form.note
                }
                onClick={handleRecordPayment}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {edit ? "Edit" : "Submit"} Payment
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedForDelete}
        title="Are you sure you want to delete?"
        description="Your action will remove payment request from the system"
        onPressYes={() => handleDelete()}
        onPressCancel={() => setSelectedForDelete(null)}
      />
    </div>
  );
}
