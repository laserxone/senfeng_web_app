"use client";
import PageTable from "@/components/app-table";
import { MyImg } from "@/components/machine-components/machine-component";
import AddPOSPayment from "@/components/pos/add-pos-payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
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
import { ArrowUpDown, Info, ShieldCheck, Trash, TriangleAlert } from "lucide-react";
import moment from "moment";
import { Params } from "next/dist/server/request/params";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MyImgZooming } from "../img-zooming";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function PaymentDetail({ params }: { params: Params }) {
  const [data, setData] = useState<POSPaymentDetailProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const { userID, isAdmin } = useUserDetail();
  const [imageURL, setImageURL] = useState<Payment | null>(null);
  const [visible, setVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

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

                    <TriangleAlert className="text-red-600 h-5 w-5 animate-pulse-opacity mr-2" />

                  </TooltipTrigger>
                  <TooltipContent className="bg-red-600" arrowColor="bg-red-600 fill-red-600">
                    <p className="text-white">{currentItem?.comment}</p>
                  </TooltipContent>
                </Tooltip>

              ) : currentItem?.status === "approved" ? (

                <Tooltip>
                  <TooltipTrigger>

                    <ShieldCheck className="text-green-600 h-5 w-5" />

                  </TooltipTrigger>
                  <TooltipContent className="bg-green-600 mr-2" arrowColor="bg-green-600 fill-green-600">
                    <p className="text-white">Payment verified</p>
                  </TooltipContent>
                </Tooltip>
              ) : (

                <Tooltip>
                  <TooltipTrigger>

                    <Info className="text-orange-600 h-5 w-5 animate-pulse-opacity mr-2" />

                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-600" arrowColor="bg-orange-600 fill-orange-600">
                    <p className="text-white">Need verification</p>
                  </TooltipContent>
                </Tooltip>

              )}
              <span className="font-medium">
                {row.getValue("note")}
              </span>
            </div>
          )
        }
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
                    setImageURL(payment);
                    setVisible(true);
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
    [isAdmin],
  );

  useEffect(() => {
    if (data && data?.fields?.length > 0) {
      let total = 0;
      let dis = Number(data?.discount) || 0;
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
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between gap-2 flex-wrap items-center">
        <Heading
          title="Invoice Payments"
          description="Invoice details and payment history"
        />

        <Button onClick={() => setShow(!show)}>Add Payment</Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-semibold text-base">{data?.name}</p>
            {data?.company && (
              <p className="text-sm text-muted-foreground">{data.company}</p>
            )}
            {data?.phone && (
              <p className="text-sm text-muted-foreground">{data.phone}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Invoice</p>
            <p className="font-semibold">{data?.invoicenumber}</p>
            <p className="text-sm text-muted-foreground">
              {data?.created_at
                ? moment(data.created_at).format("YYYY-MM-DD")
                : "-"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Summary</p>

            <div className="flex justify-between text-sm">
              <span>Payable</span>
              <span className="font-medium">{totalAmount}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Paid</span>
              <span className="font-medium">{paid}</span>
            </div>

             <div className="flex justify-between text-sm">
              <span>Pending</span>
              <span className="font-medium">{Number(totalAmount)-Number(paid)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span className="font-medium">
                {Math.floor(Number(data?.discount ?? 0))}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span
                className={`font-medium ${status === "Paid" ? "text-green-600" : "text-orange-600"
                  }`}
              >
                {status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
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

        <CardContent className={`flex flex-1 min-h-[500px]`}>
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
          setVisible(false);
          setImageURL(null);
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

const RenderVerifyButton = ({ item, onRefresh }: { item: Payment, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  async function handleVerify(item: Payment) {
    setLoading(true);
    await axios
      .put(`/${userID}/pos/payment-verification`, {
        status: "approved",
        id: item.id
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
  payment_lock: boolean | undefined,
  visible: boolean,
  onClose: () => void,
  img: string | null,
  note: string | null,
  remarks: string | null,
  id: number | undefined,
  onRefresh: () => Promise<void>,
  editAllowed: boolean,
  cheque_id: string | null,
}

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
  const { userID } = useUserDetail()

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
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Payment Image</SheetTitle>
          {!payment_lock && editAllowed && (
            <Button
              className="mb-2"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                if (!id) return;
                setDeleteLoading(true);
                handleDelete(id);
              }}
            >
              {deleteLoading ? <Spinner /> : <Trash size={16} />}
            </Button>
          )}
          <MyImgZooming img={img} />

          <strong>TID</strong>
          <Label>{note}</Label>

          {cheque_id && (
            <>
              <strong>Cheque#</strong>
              <Label>{cheque_id}</Label>
            </>
          )}

          <strong>Remarks</strong>
          <Label>{remarks}</Label>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};
