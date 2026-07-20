"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpDown,
  CheckCircle,
  EditIcon,
  ImageIcon,
  Info,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import PageTable from "@/components/shared/tables/app-table";
import AddPayment from "@/components/features/machines/add-payment";
import EditMachine from "@/components/features/machines/edit-machine";
import EditParts from "@/components/features/machines/edit-parts";
import EditPayment from "@/components/features/machines/edit-payment";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { storage } from "@/config/firebase";
import { Colors } from "@/constants/data";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { InstallmentProps, MachinePayment, MachineResponse } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import Image from "next/image";
import "pdfjs-dist/build/pdf.worker.mjs";
import { toast } from "sonner";
import AddCheque from "./add-cheque";

import { MyImgZooming } from "@/components/shared/media/img-zooming";
import ChangeSalesPersonDialog from "./change-sales-person";
import ClientCard from "./machine-client-card";
import { ImageSheet, ViewImagesSheet } from "./machine-images";
import RevokeDelivery from "./revoke-delivery";
import SendForDeliveryDialog from "./send-for-delivery";

export default function Machine({ id, onLoading }: { id: string | number, onLoading?: (val: boolean) => void }) {
  const [data, setData] = useState<MachineResponse>();
  const [payments, setPayments] = useState<MachinePayment[]>([]);
  const [installments, setInstallments] = useState<InstallmentProps[]>([]);
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);
  const [override, setOverride] = useState(false)
  const [imageURL, setImageURL] = useState<MachinePayment | null>(null);
  const [visible, setVisible] = useState(false);
  const [imagesVisible, setImagesVisible] = useState(false);
  const [editMachine, setEditMachine] = useState(false);
  const [editParts, setEditParts] = useState(false);
  const [addPayment, setAddPayment] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MachinePayment | null>(null);
  const { userID, isAdmin } =
    useUserDetail();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [installmentVisible, setInstallmentVisible] = useState(false);
  const [credit, setCredit] = useState(false);
  const [readyForDelivery, setReadyForDelivery] = useState<MachineResponse | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openChange, setOpenChange] = useState(false)
  const [revokeDelivery, setRevokeDelivery] = useState<MachineResponse | null>(null)

  useEffect(() => {
    if (id && userID) {
      fetchData(id);
    }
  }, [id, userID]);

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
    const syncPaymentImageFromUrl = () => {
      const paymentId = new URLSearchParams(window.location.search).get("mp");
      const payment = paymentId
        ? payments.find((item) => String(item.id) === paymentId)
        : undefined;

      setImageURL(payment || null);
      setVisible(Boolean(payment));
    };

    syncPaymentImageFromUrl();
    window.addEventListener("popstate", syncPaymentImageFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPaymentImageFromUrl);
    };
  }, [payments]);

  async function fetchData(id: number | string) {

    onLoading?.(true);

    try {
      const response: { data: MachineResponse } = await axios.get(`/${userID}/machine/${id}`);

      const machine = response.data?.machine;
      if (response.data?.installments) {
        setInstallments(response.data?.installments);
      }



      setData(response.data);
      if (machine) {
        setTotal(Number(machine.price || 0));

        const payments =
          machine?.payments || [];
        setPayments(machine?.payments);
        setReceived(
          payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        );
      }

      return true;
    } catch (e) {
      return null;
    } finally {
      onLoading?.(false);
    }
  }

  const columns: ColumnDef<MachinePayment>[] = useMemo(
    () => [
      {
        accessorKey: "track",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Payment
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex items-center ml-2">
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
              <div>{row.getValue("track")}</div>
            </div>
          );
        },
      },

      {
        accessorKey: "transaction_date",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Transaction Date
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>
            {row.getValue("transaction_date")
              ? moment(new Date(row.getValue("transaction_date"))).format(
                "YYYY-MM-DD",
              )
              : ""}
          </div>
        ),
      },

      {
        accessorKey: "clearance_date",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Clearance Date
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div
            style={{ color: !row.getValue("clearance_date") ? "red" : "green" }}
          >
            {row.getValue("clearance_date")
              ? moment(new Date(row.getValue("clearance_date"))).format(
                "YYYY-MM-DD",
              )
              : "Pending"}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Amount
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div className="ml-2">{row.getValue("amount")}</div>,
      },
      {
        accessorKey: "note",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              TID
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue("note")}</div>,
      },

      {
        accessorKey: "mode",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Method
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue("mode")}</div>,
      },

      {
        id: "actions",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
            >
              Actions
            </Button>
          );
        },
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex flex-row gap-2 items-center">
              {currentItem.image && (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="View image"
                  onClick={() => {
                    if (currentItem.id) {
                      updatePaymentQuery(currentItem.id);
                    }
                  }}
                  className={`
    inline-flex h-10 w-10 items-center justify-center
    rounded-xl border border-slate-200 bg-white
    text-slate-500 shadow-sm
    transition-all duration-200
    ${currentItem.id
                      ? "cursor-pointer hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:translate-y-0 active:scale-95"
                      : "cursor-not-allowed opacity-40"
                    }
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-blue-500 focus-visible:ring-offset-2
  `}
                >
                  <ImageIcon size={19} strokeWidth={2} />
                </div>
              )}

              {data?.machine && !currentItem?.payment_lock && data?.editAllowed && (
                <EditIcon
                  style={{ color: Colors.button }}
                  className="cursor-pointer h-10 w-10 sm:h-5 sm:w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPayment(currentItem);
                    setEditPayment(true);
                  }}
                />
              )}

              {isAdmin && currentItem?.status !== "approved" && (
                <RenderVerifyButton
                  item={currentItem}
                  onRefresh={async () => {
                    await fetchData(id);
                  }}
                />
              )}
            </div>
          );
        },
      },
    ],
    [data, updatePaymentQuery],
  );



  async function deleteMachine() {
    if (!id) return;
    setDeleteLoading(true);
    axios.delete(`/${userID}/machine/${id}`).then(() => {
      setOpenDelete(false)
      setData(undefined);
      setDeleteLoading(false);
      toast.success("Machine Deleted");
    });
  }



  async function onRefresh() {
    setCredit(false);
    setData(undefined);
    fetchData(id);
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <ClientCard
        data={data}
        machine={data?.machine || null}
        payment={[total, received]}
        unmatched={data?.unmatchedFields ?? []}
        payments={payments}
        setImagesVisible={setImagesVisible}
        installments={installments}
        onRefresh={onRefresh}
        override={override}
        setAddPayment={setAddPayment}
        setCredit={setCredit}
        setEditMachine={setEditMachine}
        setEditParts={setEditParts}
        setInstallmentVisible={setInstallmentVisible}
        setOpenChange={setOpenChange}
        setOpenDelete={setOpenDelete}
        setOverride={setOverride}
        setReadyForDelivery={setReadyForDelivery}
        setRevokeDelivery={setRevokeDelivery}
      />



      <PageTable
        columns={columns}
        data={payments}
        disableInput={true}
        onRowClick={(val, e) => { }}
      />

      <EditMachine
        visible={editMachine}
        onClose={setEditMachine}
        machine_id={id}
        onRefresh={async () => { await fetchData(id) }}
        data={data?.machine}
      />

      <RevokeDelivery onRefresh={onRefresh} data={revokeDelivery} onClose={() => setRevokeDelivery(null)} />

      <EditParts
        visible={editParts}
        onClose={setEditParts}
        machine_id={id}
        onRefresh={async () => { await fetchData(id) }}
        data={data?.machine}
      />

      <ImageSheet
        payment_lock={imageURL?.payment_lock}
        editAllowed={data?.editAllowed || false}
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
          await fetchData(id);
        }}
        override={override}
      />
      <ViewImagesSheet
        editAllowed={data?.editAllowed || false}
        visible={imagesVisible}
        data={data?.machine}
        customer_id={data?.customer?.id}
        onClose={() => setImagesVisible(false)}
        onRefresh={async () => { await fetchData(id) }}
      />

      <InstallmentSheet
        visible={installmentVisible}
        data={installments}
        updateData={(id, val) => {
          setInstallments((prevState) =>
            prevState.map((item) =>
              item.id === id ? { ...item, pending: val } : item,
            ),
          );
        }}
        onDeleteData={(id) => {
          setInstallments((prevState) =>
            prevState.filter((item) => item.id !== id),
          );
        }}
        onClose={() => setInstallmentVisible(false)}
      />

      <AddPayment

        customer_id={data?.customer?.id}
        visible={addPayment}
        onClose={setAddPayment}
        machine_id={id}
        onRefresh={async () => { await fetchData(id) }}
      />
      {selectedPayment && (
        <EditPayment

          customer_id={data?.customer?.id}
          visible={editPayment}
          onClose={(val: boolean) => {
            setEditPayment(val);
            setSelectedPayment(null);
          }}
          machine_id={id}
          data={selectedPayment}
          onRefresh={async () => { await fetchData(id) }}
        />
      )}

      <AddCheque
        visible={credit}
        onClose={setCredit}
        saleID={id}
        customer_id={data?.customer?.id}
        onRefresh={onRefresh}
      />

      <SendForDeliveryDialog
        open={!!readyForDelivery}
        onClose={() => setReadyForDelivery(null)}
        data={readyForDelivery}
        onRefresh={onRefresh}
      />

      <ConfirmationDialog
        loading={deleteLoading}
        open={openDelete}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove machined from the system"}
        onPressYes={() => deleteMachine()}
        onPressCancel={() => setOpenDelete(false)}
      />

      <ChangeSalesPersonDialog
        open={openChange}
        onRefresh={onRefresh}
        machine_id={data?.machine?.id}
        onClose={() => setOpenChange(false)}
        existing={data?.machine?.sell_by_name} />

      {override && (
        <OverrideStamp />
      )}
    </div>
  );
}

const OverrideStamp = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      <div
        className="
        absolute
        -right-14
        top-20
        rotate-45
        border
        border-red-500/20
        bg-red-500/10
        px-20
        py-2
        text-[11px]
        font-semibold
        uppercase
        tracking-[0.35em]
        text-red-600
        shadow-sm
        backdrop-blur-[2px]
        z-999
      "
      >
        Override Enabled
      </div>
    </div>
  )
}













const InstallmentSheet = ({
  visible,
  onClose,
  data,
  updateData,
  onDeleteData,
}: {
  visible: boolean,
  onClose: () => void
  data: InstallmentProps[]
  updateData: (id: number, val: boolean) => void
  onDeleteData: (id: number) => void
}) => {
  const [imageOpen, setImageOpen] = useState(false);

  const { isAdmin, userID } = useUserDetail();

  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  const RenderEachRow = ({ item }: { item: InstallmentProps }) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    async function handlePaid(id: number) {
      if (!id || !userID) return;
      setLoading(true);

      try {
        await axios.put(`/${userID}/reminders/${id}`, {
          pending: false,
        });
        updateData(id, false);
      } finally {
        setLoading(false);
      }
    }

    async function handleDelete(id: number) {
      if (!id || !userID) return;
      setDeleteLoading(true);

      if (item.image) {
        DeleteFromStorage(item.image);
      }

      try {
        await axios.delete(`/${userID}/reminders/${id}`);
        onDeleteData(id);
      } finally {
        setDeleteLoading(false);
      }
    }

    return (
      <div className="rounded-xl border shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-center gap-4 p-3">
          <div>
            {item.pending ? (
              <Badge variant="destructive">Pending</Badge>
            ) : (
              <Badge variant="secondary">Paid</Badge>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              value={moment(item.date).format("YYYY-MM-DD")}
              readOnly
              className="h-8 text-sm"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input value={item.amount} readOnly className="h-8 text-sm" />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Image</Label>
            <MyImgZooming img={item.image} />
          </div>

          {/* Action */}
          <div className="flex flex-wrap justify-end gap-3 mt-3 sm:mt-0">
            {isAdmin && item?.pending && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handlePaid(item.id)}
                disabled={loading}
              >
                {loading && <Spinner className="h-4 w-4 animate-spin" />}
                Mark Paid
              </Button>
            )}

            {isAdmin && (
              <Button
                onClick={() => handleDelete(item.id)}
                variant="destructive"
                disabled={deleteLoading}
              >
                {deleteLoading && <Spinner className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent
        className="w-full sm:w-[90vw] sm:max-w-[90vw] h-[100vh] sm:h-auto overflow-hidden"
        style={{ maxWidth: "100%", padding: "1rem" }}
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-semibold">
            Installments
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] sm:h-[80vh] px-1">
          <div className="flex flex-1 flex-col gap-3">
            {data.length > 0 ? (
              data.map((item, index) => (
                <RenderEachRow key={index} item={item} />
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No installments found
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};








export const MyImg = ({ img }: { img: string | null }) => {
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

  if (loading) return <div className="w-[50px] h-[50px] flex items-center justify-center"><Spinner /></div>;
  if (!img || error || !localImage) return <p>No image</p>;

  return <div className="relative w-[50px] h-[50px]">
    <Image
      src={localImage}
      alt="payment image"
      fill
      className="object-contain"
    />
  </div>;
};

const RenderVerifyButton = ({ item, onRefresh }: { item: MachinePayment, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  async function handleVerify(item: MachinePayment) {
    setLoading(true);
    await axios
      .put(`/${userID}/payment-verification/${item.id}`, {
        status: "approved",
        payment_lock: true,
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
      variant={"outline"}
      disabled={loading}
      onClick={() => {
        handleVerify(item);
      }}
    >
      {loading ? <Spinner /> : <CheckCircle />} {loading ? "Verifying" : "Verify"}
    </Button>
  );
};


