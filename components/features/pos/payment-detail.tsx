"use client";
import PageTable from "@/components/shared/tables/app-table";
import { MyImg } from "@/components/features/machines/machine-component";
import AddPOSPayment from "@/components/features/pos/add-pos-payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { POSPaymentDetailProps, Payment } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Hash,
  Info,
  MessageSquareText,
  PackageOpen,
  Phone,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash,
  TriangleAlert,
  UserRound,
  WalletCards,
} from "lucide-react";
import moment from "moment";
import { Params } from "next/dist/server/request/params";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CurrencyFormatter from "@/components/shared/common/currency-formatter";

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/20 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default function PaymentDetail({ params }: { params: Params }) {
  const [data, setData] = useState<POSPaymentDetailProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const { userID, isAdmin } = useUserDetail();
  const [imageURL, setImageURL] = useState<Payment | null>(null);
  const [visible, setVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const updatePaymentQuery = useCallback((paymentId?: string | number) => {
    const url = new URL(window.location.href);

    if (paymentId !== undefined) {
      url.searchParams.set("mp", String(paymentId));
      window.history.pushState({}, "", url);
    } else {
      url.searchParams.delete("mp");
      window.history.replaceState({}, "", url);
    }

    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  useEffect(() => {
    if (userID && params?.id) {
      fetchData();
    }
  }, [userID, params]);

  const paid = Number(
    data?.payments
      ?.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      .toFixed(0) || 0,
  );

  useEffect(() => {
    const syncPaymentImageFromUrl = () => {
      const paymentId = new URLSearchParams(window.location.search).get("mp");
      const payment = paymentId
        ? data?.payments?.find((item) => String(item.id) === paymentId)
        : undefined;

      setImageURL(payment || null);
      setVisible(Boolean(payment));
    };

    syncPaymentImageFromUrl();
    window.addEventListener("popstate", syncPaymentImageFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPaymentImageFromUrl);
    };
  }, [data?.payments]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/pos/payment/${params.id}`);
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnDef<Payment>[] = useMemo(
    () => [
      {
        accessorKey: "note",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            TID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex items-center">
              {currentItem?.status === "rejected" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TriangleAlert className="animate-pulse-opacity mr-2 h-5 w-5 text-red-600" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-red-600"
                    arrowColor="bg-red-600 fill-red-600"
                  >
                    <p className="text-white">{currentItem?.comment}</p>
                  </TooltipContent>
                </Tooltip>
              ) : currentItem?.status === "approved" ? (
                <Tooltip>
                  <TooltipTrigger>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="mr-2 bg-green-600"
                    arrowColor="bg-green-600 fill-green-600"
                  >
                    <p className="text-white">Payment verified</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="animate-pulse-opacity mr-2 h-5 w-5 text-orange-600" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-orange-600"
                    arrowColor="bg-orange-600 fill-orange-600"
                  >
                    <p className="text-white">Need verification</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <span className="font-medium">{row.getValue("note")}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "transaction_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Transaction Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.getValue("transaction_date") ? (
            <span>
              {moment(row.getValue("transaction_date")).format("YYYY-MM-DD")}
            </span>
          ) : (
            "-"
          ),
      },

      {
        accessorKey: "amount",
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
          <span className="font-medium">
            {Number(row.getValue("amount")).toFixed(0)}
          </span>
        ),
      },

      {
        accessorKey: "mode",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Method
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },

      {
        accessorKey: "received_by",
        header: "Received By",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("received_by") || "-"}
          </span>
        ),
      },

      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const payment = row.original;

          return (
            <div className="flex items-center gap-2">
              {payment.image && (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (payment.id) {
                      updatePaymentQuery(payment.id);
                    }
                  }}
                >
                  <MyImg img={payment.image} />
                </div>
              )}
              {isAdmin && payment?.status !== "approved" && (
                <RenderVerifyButton
                  item={payment}
                  onRefresh={async () => {
                    await fetchData();
                  }}
                />
              )}
            </div>
          );
        },
      },
    ],
    [isAdmin, updatePaymentQuery],
  );

  useEffect(() => {
    if (data && data?.fields?.length > 0) {
      let total = 0;
      const dis = Number(data?.discount) || 0;
      data?.fields?.forEach((item) => {
        total = total + Number(item.total);
      });
      setTotalAmount(Number((total - dis).toFixed(0)));
    } else {
      setTotalAmount(0);
    }
  }, [data]);

  function calculateStatus() {
    if (totalAmount === 0) return "Paid";
    else if (paid === 0) return "Pending";
    else if (totalAmount - paid !== 0) return "Partial";
    else return "Paid";
  }

  const status = calculateStatus();
  const pending = Math.max(totalAmount - paid, 0);
  const itemsSubtotal = (data?.fields || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );
  const totalQuantity = (data?.fields || []).reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  return (
    <div className="flex w-full flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ReceiptText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Payment detail
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-full bg-muted/50 text-[10px] tracking-wider uppercase"
                >
                  {status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Invoice details and complete payment history.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShow(!show)}
            className="gap-2 self-start rounded-xl lg:self-auto"
          >
            <Plus className="size-4" /> Add payment
          </Button>
        </div>

        <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
          {[
            {
              label: "Payable",
              value: totalAmount,
              icon: WalletCards,
              color: "text-violet-600 dark:text-violet-400",
            },
            {
              label: "Paid",
              value: paid,
              icon: CircleDollarSign,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Pending",
              value: pending,
              icon: Clock3,
              color: "text-amber-600 dark:text-amber-400",
            },
          ].map(({ label, value, icon: Icon, color }, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${index ? "border-t sm:border-t-0" : ""}`}
            >
              <Icon className={`size-4 ${color}`} />
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <span className="truncate text-sm font-bold">
                  <CurrencyFormatter amount={value} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <DetailTile
            icon={UserRound}
            label="Customer"
            value={data?.name || "—"}
          />
          <DetailTile
            icon={Building2}
            label="Company"
            value={data?.company || "—"}
          />
          <DetailTile
            icon={Hash}
            label="Invoice"
            value={data?.invoicenumber || "—"}
          />
          <DetailTile
            icon={CalendarDays}
            label="Invoice date"
            value={
              data?.created_at
                ? moment(data.created_at).format("DD MMM YYYY")
                : "—"
            }
          />
          {data?.phone && (
            <DetailTile icon={Phone} label="Phone" value={data.phone} />
          )}
          <DetailTile
            icon={CircleDollarSign}
            label="Discount"
            value={
              <CurrencyFormatter
                amount={Math.floor(Number(data?.discount ?? 0))}
              />
            }
          />
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/10 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <PackageOpen className="size-4" />
              </span>
              <div className="flex min-w-0 items-baseline gap-2">
                <h2 className="shrink-0 text-sm font-semibold">Items Sold</h2>
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  Invoice contents
                </span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {data?.fields?.length ? (
            <>
              <div className="hidden grid-cols-[minmax(0,1fr)_72px_140px] border-b bg-muted/20 px-5 py-2 text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:grid">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y">
                {data.fields.map((item, index) => (
                  <div
                    key={item.id ?? `${item.description}-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_72px_140px] sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm leading-5 font-medium"
                          title={item.description}
                        >
                          {item.description || "Unnamed item"}
                        </p>
                        <span className="text-[11px] text-muted-foreground sm:hidden">
                          Qty {item.qty}
                        </span>
                      </div>
                    </div>
                    <div className="hidden text-center sm:block">
                      <Badge
                        variant="outline"
                        className="h-6 min-w-9 justify-center rounded-md bg-background px-1.5 text-xs font-medium"
                      >
                        {item.qty}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                        <CurrencyFormatter amount={Number(item.total || 0)} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 border-t bg-muted/20 px-4 py-3 text-xs sm:px-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">
                    <CurrencyFormatter amount={itemsSubtotal} />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Discount</span>
                  <span className="font-medium text-foreground">
                    - <CurrencyFormatter amount={Number(data.discount || 0)} />
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l pl-5">
                  <span className="font-medium">Invoice total</span>
                  <span className="text-sm font-bold text-primary">
                    <CurrencyFormatter amount={totalAmount} />
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <PackageOpen className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No invoice items found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Items sold on this invoice will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Payment Records</h2>
              <p className="text-sm text-muted-foreground">
                All payments received against this invoice
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`flex min-h-[500px] flex-1`}>
          <PageTable
            loading={loading}
            columns={columns}
            data={data?.payments || []}
            disableInput={true}
          />
        </CardContent>
      </Card>

      <ImageSheet
        payment_lock={imageURL?.payment_lock}
        editAllowed={isAdmin}
        visible={visible}
        onClose={() => {
          updatePaymentQuery();
        }}
        img={imageURL?.image || null}
        note={imageURL?.note || null}
        cheque_id={imageURL?.cheque_id || null}
        remarks={imageURL?.remarks || null}
        id={imageURL?.id}
        onRefresh={async () => {
          await fetchData();
        }}
      />

      <AddPOSPayment
        visible={show}
        onClose={() => setShow(false)}
        part_id={data?.id}
        customer_id={data?.customer_id}
        onRefresh={async () => {
          setLoading(true);
          await fetchData();
          setShow(false);
        }}
      />
    </div>
  );
}

const RenderVerifyButton = ({
  item,
  onRefresh,
}: {
  item: Payment;
  onRefresh: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  async function handleVerify(item: Payment) {
    setLoading(true);
    await axios
      .put(`/${userID}/pos/payment-verification`, {
        status: "approved",
        id: item.id,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
      });
  }
  return (
    <Button
      disabled={loading}
      onClick={() => {
        handleVerify(item);
      }}
    >
      {loading && <Spinner />} {loading ? "Verifying" : "Verify"}
    </Button>
  );
};

type ImageSheetProps = {
  payment_lock: boolean | undefined;
  visible: boolean;
  onClose: () => void;
  img: string | null;
  note: string | null;
  remarks: string | null;
  id: number | undefined;
  onRefresh: () => Promise<void>;
  editAllowed: boolean;
  cheque_id: string | null;
};

const ImageSheet = ({
  payment_lock,
  visible,
  onClose,
  img,
  note,
  remarks,
  id,
  onRefresh,
  editAllowed,
  cheque_id,
}: ImageSheetProps) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { userID } = useUserDetail();

  function handleClose() {
    onClose();
  }

  async function handleDelete(id: string | number) {
    try {
      if (img && !img.includes("https")) {
        await DeleteFromStorage(img);
      }

      await axios.delete(`/${userID}/pos/payment/${id}`);
      await onRefresh();
      handleClose();
      toast.success("Payment Deleted");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent className="w-full overflow-hidden border-l-0 p-0 sm:max-w-xl sm:border-l">
        <div className="flex h-full flex-col bg-muted/20">
          <SheetHeader className="border-b bg-background px-5 py-5 text-left sm:px-6">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <ReceiptText className="size-5" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-bold tracking-tight">
                    Payment Receipt
                  </SheetTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Transaction proof and payment details
                  </p>
                </div>
              </div>
              {!payment_lock && editAllowed && (
                <Button
                  className="h-9 shrink-0 rounded-xl px-3 shadow-sm"
                  variant="destructive"
                  size="sm"
                  disabled={deleteLoading}
                  onClick={() => {
                    if (!id) return;
                    setDeleteLoading(true);
                    handleDelete(id);
                  }}
                >
                  {deleteLoading ? <Spinner /> : <Trash className="size-4" />}
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Payment proof</p>
                    <p className="text-xs text-muted-foreground">
                      Select the image to inspect it closely
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-background px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
                  >
                    Receipt
                  </Badge>
                </div>
                <div className="relative flex min-h-64 items-center justify-center bg-slate-50/80 p-3 sm:min-h-80 sm:p-4 dark:bg-zinc-950/40">
                  <MyImgZooming img={img} fill />
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Payment details</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ReceiptField
                    icon={Hash}
                    label="TID"
                    value={note || "Not provided"}
                  />
                  {cheque_id && (
                    <ReceiptField
                      icon={ReceiptText}
                      label="Cheque #"
                      value={cheque_id}
                    />
                  )}
                  <div className="sm:col-span-2">
                    <ReceiptField
                      icon={MessageSquareText}
                      label="Remarks"
                      value={remarks || "No remarks added"}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

function ReceiptField({
  icon: Icon,
  label,
  value,
  multiline = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="h-full rounded-xl border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-semibold tracking-wider uppercase">
          {label}
        </span>
      </div>
      <Label
        className={`block text-sm leading-6 font-semibold break-words ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </Label>
    </div>
  );
}
