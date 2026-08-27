"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  EditIcon,
  ImageIcon,
  Info,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import PageTable from "@/components/shared/tables/app-table";
import AddPayment from "@/components/features/machines/add-payment";
import EditMachine from "@/components/features/machines/edit-machine";
import EditParts from "@/components/features/machines/edit-parts";
import EditPayment from "@/components/features/machines/edit-payment";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { storage } from "@/config/firebase";
import { Colors } from "@/constants/data";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { InstallmentProps, MachinePayment, MachineResponse, MachineReviewHistory } from "@/lib/types";
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
import CurrencyFormatter from "@/components/shared/common/currency-formatter";

export default function Machine({
  id,
  onLoading,
}: {
  id: string | number;
  onLoading?: (val: boolean) => void;
}) {
  const [data, setData] = useState<MachineResponse>();
  const [payments, setPayments] = useState<MachinePayment[]>([]);
  const [installments, setInstallments] = useState<InstallmentProps[]>([]);
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);
  const [override, setOverride] = useState(false);
  const [imageURL, setImageURL] = useState<MachinePayment | null>(null);
  const [visible, setVisible] = useState(false);
  const [imagesVisible, setImagesVisible] = useState(false);
  const [editMachine, setEditMachine] = useState(false);
  const [editParts, setEditParts] = useState(false);
  const [addPayment, setAddPayment] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MachinePayment | null>(
    null,
  );
  const { userID, isAdmin, designation } = useUserDetail();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [installmentVisible, setInstallmentVisible] = useState(false);
  const [credit, setCredit] = useState(false);
  const [readyForDelivery, setReadyForDelivery] =
    useState<MachineResponse | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openChange, setOpenChange] = useState(false);
  const [revokeDelivery, setRevokeDelivery] = useState<MachineResponse | null>(
    null,
  );

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
      const response: { data: MachineResponse } = await axios.get(
        `/${userID}/machine/${id}`,
      );

      const machine = response.data?.machine;
      if (response.data?.installments) {
        setInstallments(response.data?.installments);
      }

      setData(response.data);
      if (machine) {
        setTotal(Number(machine.price || 0));

        const payments = machine?.payments || [];
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
            <div className="ml-2 flex items-center">
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
          return <Button variant="ghost">Actions</Button>;
        },
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex flex-row items-center gap-2">
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
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 ${
                    currentItem.id
                      ? "cursor-pointer hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:translate-y-0 active:scale-95"
                      : "cursor-not-allowed opacity-40"
                  } focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none`}
                >
                  <ImageIcon size={19} strokeWidth={2} />
                </div>
              )}

              {data?.machine &&
                !currentItem?.payment_lock &&
                data?.editAllowed && (
                  <EditIcon
                    style={{ color: Colors.button }}
                    className="h-10 w-10 cursor-pointer sm:h-5 sm:w-5"
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
      setOpenDelete(false);
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

  const reviewPanel = data?.machine ? (
    <MachineReviewPanel
      machine={data.machine}
      history={data.reviewHistory || []}
      userID={userID}
      designation={designation}
      onRefresh={async () => {
        await fetchData(id);
      }}
    />
  ) : null;

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

      {data?.machine?.review_status !== "approved" && reviewPanel}

      <PageTable
        columns={columns}
        data={payments}
        disableInput={true}
        onRowClick={(val, e) => {}}
      />

      {data?.machine?.review_status === "approved" && reviewPanel}

      <EditMachine
        visible={editMachine}
        onClose={setEditMachine}
        machine_id={id}
        onRefresh={async () => {
          await fetchData(id);
        }}
        data={data?.machine}
      />

      <RevokeDelivery
        onRefresh={onRefresh}
        data={revokeDelivery}
        onClose={() => setRevokeDelivery(null)}
      />

      <EditParts
        visible={editParts}
        onClose={setEditParts}
        machine_id={id}
        onRefresh={async () => {
          await fetchData(id);
        }}
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
        onRefresh={async () => {
          await fetchData(id);
        }}
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
        onRefresh={async () => {
          await fetchData(id);
        }}
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
          onRefresh={async () => {
            await fetchData(id);
          }}
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
        existing={data?.machine?.sell_by_name}
      />

      {override && <OverrideStamp />}
    </div>
  );
}

const MachineReviewPanel = ({
  machine,
  history,
  userID,
  designation,
  onRefresh,
}: {
  machine: MachineResponse["machine"];
  history: MachineReviewHistory[];
  userID?: string | number;
  designation?: string;
  onRefresh: () => Promise<void>;
}) => {
  const [action, setAction] = useState<"approved" | "rejected" | "resubmit" | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reviewDetails, setReviewDetails] = useState<{ machine: Record<string, unknown>; customer: Record<string, unknown>; installments: Record<string, unknown>[] } | null>(null);
  const reviewFlagHandled = useRef(false);
  const isOwner = designation === "Owner";
  const canReview = isOwner && machine.review_status === "pending";
  const canViewReview = isOwner && machine.review_status !== "approved";
  const canResubmit = Number(machine.sell_by) === Number(userID) && machine.review_status === "rejected";

  async function submit() {
    if (!action || !userID) return;
    if (action === "rejected" && !comment.trim()) {
      toast.error("A comment is required when rejecting a machine");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`/${userID}/machine/${machine.id}/review`, { action, comment });
      toast.success(action === "resubmit" ? "Machine sent for review" : `Machine ${action}`);
      setAction(null);
      setComment("");
      await onRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update machine review");
    } finally {
      setSaving(false);
    }
  }

  async function openDetails() {
    if (!userID) return;
    setDetailsOpen(true);
    setDetailsLoading(true);
    setReviewDetails(null);
    try {
      const response = await axios.get(`/${userID}/machine/${machine.id}/review-detail`);
      setReviewDetails(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load review details");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    const shouldOpenReview = new URLSearchParams(window.location.search).get("review") === "1";
    if (shouldOpenReview && canReview && !reviewFlagHandled.current) {
      reviewFlagHandled.current = true;
      openDetails();
    }
  }, [canReview]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
        <div>
          <p className="text-sm font-semibold">Owner review</p>
          <p className="text-xs text-muted-foreground">Approval comments for this machine.</p>
        </div>
        <div className="flex gap-2">
          {canViewReview && <Button size="sm" className="h-8 rounded-lg" onClick={openDetails}>View details</Button>}
          {canResubmit && <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setAction("resubmit")}>Send for review again</Button>}
        </div>
      </div>
      <div className="space-y-2 p-3">
        {history.length ? history.map((item) => (
          <div key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
            <Badge variant={item.action === "rejected" ? "destructive" : item.action === "approved" ? "default" : "secondary"} className="capitalize">{item.action}</Badge>
            <span className="font-medium">{item.actor_name || "System"}</span>
            <span className="text-muted-foreground">{moment(item.created_at).format("DD MMM YYYY, h:mm A")}</span>
            {item.comment && <span className="w-full text-muted-foreground">{item.comment}</span>}
          </div>
        )) : <p className="text-xs text-muted-foreground">No review activity yet.</p>}
      </div>

      <Dialog open={detailsOpen} onOpenChange={(open) => !detailsLoading && setDetailsOpen(open)}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-4xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <DialogTitle className="text-sm font-semibold">Review machine details</DialogTitle>
            <p className="text-xs text-muted-foreground">Confirm the submitted customer and machine information before making a decision.</p>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <div className="space-y-4 p-3.5">
              {detailsLoading ? (
                <div className="flex h-40 items-center justify-center"><Spinner /></div>
              ) : reviewDetails ? (
                <>
                  <ReviewFieldGroup title="Customer details" values={reviewDetails.customer} />
                  <ReviewFieldGroup title="Machine details" values={reviewDetails.machine} />
                  {reviewDetails.installments.length > 0 && (
                    <ReviewInstallments installments={reviewDetails.installments} />
                  )}
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button variant="outline" className="h-9 rounded-lg" onClick={() => setDetailsOpen(false)}>Close</Button>
                    {canReview && <>
                      <Button variant="destructive" className="h-9 rounded-lg" onClick={() => { setDetailsOpen(false); setAction("rejected"); }}>Reject</Button>
                      <Button className="h-9 rounded-lg" onClick={() => { setDetailsOpen(false); setAction("approved"); }}>Approve</Button>
                    </>}
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!action} onOpenChange={(open) => !open && !saving && setAction(null)}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <DialogTitle className="text-sm font-semibold capitalize">{action === "resubmit" ? "Send for review again" : `${action} machine`}</DialogTitle>
            <p className="text-xs text-muted-foreground">{action === "rejected" ? "Explain what the employee needs to correct." : "Add an optional comment for the machine record."}</p>
          </DialogHeader>
          <div className="p-3.5">
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add comment" className="min-h-24 rounded-lg" />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" className="h-9 rounded-lg" disabled={saving} onClick={() => setAction(null)}>Cancel</Button>
              <Button className="h-9 rounded-lg" variant={action === "rejected" ? "destructive" : "default"} disabled={saving} onClick={submit}>{saving && <Spinner className="mr-2 h-4 w-4" />}{action === "resubmit" ? "Send for review" : action}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReviewFieldGroup = ({ title, values }: { title: string; values: Record<string, unknown> }) => (
  <section>
    <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="min-w-0 rounded-lg border bg-muted/20 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{key.replaceAll("_", " ")}</p>
          <p className="mt-0.5 break-words text-xs text-foreground">{formatReviewValue(value)}</p>
        </div>
      ))}
    </div>
  </section>
);

const ReviewInstallments = ({ installments }: { installments: Record<string, unknown>[] }) => (
  <section>
    <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Installments</h3>
    <div className="space-y-2">
      {installments.map((installment, index) => (
        <div key={String(installment.id || index)} className="rounded-lg border bg-muted/20 p-2.5">
          <p className="mb-2 text-xs font-semibold">Installment {index + 1}</p>
          <div className="grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
            <div className="flex min-h-24 items-center justify-center overflow-hidden rounded-lg border bg-background">
              <MyImgZooming
                img={typeof installment.image === "string" ? installment.image : null}
                compact
                className="max-h-24"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(installment).filter(([key]) => !["image", "created_at"].includes(key)).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{key.replaceAll("_", " ")}</p>
                <p className="break-words text-xs text-foreground">{key === "date" && value ? moment(value as string).format("YYYY-MM-DD") : formatReviewValue(value)}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const formatReviewValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const OverrideStamp = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      <div className="absolute top-20 -right-14 z-999 rotate-45 border border-red-500/20 bg-red-500/10 px-20 py-2 text-[11px] font-semibold tracking-[0.35em] text-red-600 uppercase shadow-sm backdrop-blur-[2px]">
        Override Enabled
      </div>
    </div>
  );
};

const InstallmentSheet = ({
  visible,
  onClose,
  data,
  updateData,
  onDeleteData,
}: {
  visible: boolean;
  onClose: () => void;
  data: InstallmentProps[];
  updateData: (id: number, val: boolean) => void;
  onDeleteData: (id: number) => void;
}) => {
  const pendingCount = data.filter((item) => item.pending).length;
  const totalAmount = data.reduce((total, item) => total + Number(item.amount || 0), 0);

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l bg-background p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b bg-muted/35 px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight">Installment schedule</SheetTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">Cheque commitments and their current clearance status.</p>
            </div>
            <Badge variant={pendingCount ? "destructive" : "secondary"} className="rounded-full px-2.5 py-1 text-[11px]">
              {pendingCount ? `${pendingCount} pending` : "All cleared"}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border bg-background/70 px-3 py-2">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Total scheduled</span>
            <span className="text-sm font-semibold tabular-nums"><CurrencyFormatter amount={totalAmount} /></span>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2.5 p-4">
            {data.length > 0 ? (
              data.map((item, index) => (
                <InstallmentRow
                  key={item.id}
                  item={item}
                  index={index + 1}
                  updateData={updateData}
                  onDeleteData={onDeleteData}
                />
              ))
            ) : (
              <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/15 text-center">
                <Calendar className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">No installments</p>
                <p className="mt-1 text-xs text-muted-foreground">Installment cheques will appear here.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const InstallmentRow = ({
  item,
  index,
  updateData,
  onDeleteData,
}: {
  item: InstallmentProps;
  index: number;
  updateData: (id: number, val: boolean) => void;
  onDeleteData: (id: number) => void;
}) => {
    const { isAdmin, userID } = useUserDetail();
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
      <div className="rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
        <div className="flex gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${item.pending ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"}`}>
            {String(index).padStart(2, "0")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Installment {index}</p>
                <Badge variant={item.pending ? "outline" : "secondary"} className={item.pending ? "border-amber-500/40 bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"}>
                  {item.pending ? "Pending" : "Cleared"}
                </Badge>
              </div>
              <span className="text-sm font-semibold tabular-nums"><CurrencyFormatter amount={item.amount} /></span>
            </div>
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-[1fr_1fr_auto] sm:items-center">
              <div className="rounded-lg bg-muted/55 px-2.5 py-2">
                <span className="block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Due date</span>
                <span className="mt-0.5 block font-medium">{moment(item.date).format("YYYY-MM-DD")}</span>
              </div>
              <div className="rounded-lg bg-muted/55 px-2.5 py-2">
                <span className="block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Cheque no.</span>
                <span className="mt-0.5 block truncate font-medium">{item.cheque_number || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <MyImgZooming img={item.image} compact />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-2.5">
            {isAdmin && item?.pending && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={() => handlePaid(item.id)}
                disabled={loading}
              >
                {loading && <Spinner className="h-4 w-4 animate-spin" />}
                Mark cleared
              </Button>
            )}

            {isAdmin && (
              <Button
                onClick={() => handleDelete(item.id)}
                variant="destructive"
                size="sm"
                className="h-8 rounded-lg text-xs"
                disabled={deleteLoading}
              >
                {deleteLoading && <Spinner className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
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

  if (loading)
    return (
      <div className="flex h-[50px] w-[50px] items-center justify-center">
        <Spinner />
      </div>
    );
  if (!img || error || !localImage) return <p>No image</p>;

  return (
    <div className="relative h-[50px] w-[50px]">
      <Image
        src={localImage}
        alt="payment image"
        fill
        className="object-contain"
      />
    </div>
  );
};

const RenderVerifyButton = ({
  item,
  onRefresh,
}: {
  item: MachinePayment;
  onRefresh: () => Promise<void>;
}) => {
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
      {loading ? <Spinner /> : <CheckCircle />}{" "}
      {loading ? "Verifying" : "Verify"}
    </Button>
  );
};
