"use client";
import PageTable from "@/components/app-table-without-pagination";
import { MyImg } from "@/components/customer-components/machine/machine-component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Trash } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";

import AddPOSPayment from "@/components/pos/add-pos-payment";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { storage } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { getDownloadURL, ref } from "firebase/storage";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

export default function PaymentDetail({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const { userID, isAdmin } = useUserDetail();
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (userID && params?.id) {
      fetchData();
    }
  }, [userID, params]);

  const paid = data?.payments
    ?.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(0);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/pos/payment/${params.id}`);
      console.log(response.data);
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
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
      let dis = data?.discount || 0;
      data?.fields?.forEach((item) => {
        total = total + Number(item.total);
      });

      setTotalAmount((total - dis).toFixed(0));
    } else {
      setTotalAmount(0);
    }
  }, [data]);

  function calculateStatus() {
  
    if (paid === 0) return "Pending";
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
              <span>Discount</span>
              <span className="font-medium">
                {Math.floor(Number(data?.discount ?? 0))}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span
                className={`font-medium ${
                  status === "Paid" ? "text-green-600" : "text-orange-600"
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
            onRowClick={(val, e) => {}}
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
          return true;
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
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { userID } = useUserDetail();
  const { toast } = useToast();

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    } else {
      setLocalImage(null);
    }
  }, [img]);

  function handleClose() {
    if (!imageOpen) {
      onClose();
      setLocalImage(null);
    }
  }

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  async function handleDelete() {
    try {
      if (img && !img.includes("https")) {
        await DeleteFromStorage(img);
      }

      await axios.delete(`/${userID}/pos/payment/${id}`);
      await onRefresh();
      handleClose(false);
      toast({ title: "Payment Deleted" });
    } finally {
      setDeleteLoading(false);
    }
  }

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
    setImageOpen(false);
  };

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
          {localImage ? (
            <ControlledZoom
              isZoomed={isZoomed}
              onZoomChange={handleZoomChange}
              ZoomContent={({ img }) =>
                isZoomed ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      width: "100vw",
                      height: "100vh",
                      overflow: "hidden",
                      zIndex: 9999,
                      pointerEvents: "auto",
                    }}
                  >
                    <img
                      src={localImage}
                      alt="payment-img"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        objectFit: "contain",
                        pointerEvents: "auto",
                      }}
                    />
                    <div
                      className="mt-2 flex gap-5"
                      style={{
                        pointerEvents: "auto",
                        zIndex: 10000,
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageLeft}
                      >
                        Rotate Left
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageRight}
                      >
                        Rotate Right
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPressClose}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  img
                )
              }
            >
              <img
                onClick={() => setImageOpen(true)}
                src={localImage}
                alt="payment-img"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  cursor: "zoom-in",
                }}
              />
            </ControlledZoom>
          ) : (
            <Label>No Image found</Label>
          )}

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
