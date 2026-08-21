import { Button } from "@/components/ui/button";
import { ShieldCheck, TriangleAlert, User } from "lucide-react";
import {
  Dispatch,
  Fragment,
  memo,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import CurrencyFormatter from "@/components/shared/common/currency-formatter";
import { downloadCustomerZip } from "@/components/shared/media/downloadzip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import {
  InstallmentProps,
  MachinePayment,
  MachineProps,
  MachineResponse,
} from "@/lib/types";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  Download,
  Images,
  Lock,
  MoreHorizontal,
  Package,
  Pencil,
  Trash2,
  Truck,
  Unlock,
} from "lucide-react";
import moment from "moment";
import "pdfjs-dist/build/pdf.worker.mjs";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CancelDeal from "./cancel-deal";

const ClientCard = memo(
  ({
    data,
    payment,
    machine,
    unmatched = [],
    setImagesVisible,
    payments,
    setEditParts,
    setEditMachine,
    override,
    setCredit,
    onRefresh,
    setInstallmentVisible,
    installments,
    setAddPayment,
    setOverride,
    setOpenChange,
    setOpenDelete,
    setRevokeDelivery,
    setReadyForDelivery,
  }: {
    data?: MachineResponse;
    payment: [number, number];
    machine: MachineProps | null;
    unmatched: string[];
    setImagesVisible: Dispatch<SetStateAction<boolean>>;
    payments: MachinePayment[];
    setEditParts: Dispatch<SetStateAction<boolean>>;
    setEditMachine: Dispatch<SetStateAction<boolean>>;
    override: boolean;
    setOverride: Dispatch<SetStateAction<boolean>>;
    setCredit: Dispatch<SetStateAction<boolean>>;
    onRefresh: () => Promise<void>;
    installments: InstallmentProps[];
    setInstallmentVisible: Dispatch<SetStateAction<boolean>>;
    setAddPayment: Dispatch<SetStateAction<boolean>>;
    setOpenChange: Dispatch<SetStateAction<boolean>>;
    setOpenDelete: Dispatch<SetStateAction<boolean>>;
    setRevokeDelivery: Dispatch<SetStateAction<MachineResponse | null>>;
    setReadyForDelivery: Dispatch<SetStateAction<MachineResponse | null>>;
  }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [zipDownloading, setZipDwonloading] = useState(false);
    const [ledgerDownloading, setLedgerDownloading] = useState(false);
    const { userID, isAdmin } = useUserDetail();

    useEffect(() => {
      if (!machine) return;

      const payments = machine?.payments ?? [];
      const result = findDuplicateNotes(payments);
      setShowAlert(result.length > 0);
    }, [machine]);

    function findDuplicateNotes(array: MachinePayment[]) {
      const noteMap = new Map();
      const duplicates = [];

      for (const item of array) {
        if (noteMap.has(item.note)) {
          duplicates.push(item.note);
        } else {
          noteMap.set(item.note, true);
        }
      }

      return [...new Set(duplicates)];
    }

    async function handleDownloadLedger() {
      if (ledgerDownloading) return;

      setLedgerDownloading(true);
      try {
        const response = await axios.post(
          `/${userID}/ledger-pdf`,
          {
            data,
            payments,
            received: payment[1],
            total: payment[0],
          },
          {
            responseType: "blob",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const blob = new Blob([response.data], {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 600000);
      } catch (error) {
        console.log("Ledger PDF error:", error);
      } finally {
        setLedgerDownloading(false);
      }
    }

    const infoItem = (label: string, value?: string | number | null, additional?: string) => (
      <div className="min-w-0 rounded-md border bg-muted/20 px-2.5 py-2 ring-1 ring-transparent transition-colors hover:bg-muted/30">
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-0.5 text-sm leading-5 font-semibold wrap-break-word text-foreground">
          {value || "N/A"}
        </p>
        {
          additional && <p className="mt-0.5 text-xs leading-5 wrap-break-word text-foreground">
            {additional}
          </p>
        }
      </div>
    );

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-md border bg-gradient-to-r from-muted/35 via-background to-muted/15 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 text-base leading-5 font-bold tracking-tight break-words">
                {data?.customer?.name || "Customer Name"}
              </h2>

              {data?.customer?.owner && (
                <Badge
                  variant="secondary"
                  className="h-5 rounded-md px-2 text-[10px] font-semibold"
                >
                  {data?.customer.owner}
                </Badge>
              )}

              {machine?.status && (
                <Badge
                  variant="outline"
                  className="h-5 rounded-md px-2 text-[10px] font-semibold"
                >
                  {machine.status}
                </Badge>
              )}

              {machine?.cancelled_detail && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="h-5 cursor-pointer rounded-md px-2 text-[10px] font-semibold"
                    >
                      Cancelled
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-red-600"
                    arrowColor="bg-red-600 fill-red-600"
                  >
                    <p className="text-white">
                      {machine?.cancelled_reason || "Cancelled"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {showAlert && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="h-5 rounded-md px-2 text-[10px] font-semibold"
                    >
                      Duplicate TID
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-red-600"
                    arrowColor="bg-red-600 fill-red-600"
                  >
                    <p className="text-white">Duplicate TID found</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {unmatched.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="h-5 animate-pulse rounded-md px-2 text-[10px] font-semibold"
                    >
                      Missing Info
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    className="flex flex-col bg-red-600"
                    arrowColor="bg-red-600 fill-red-600"
                  >
                    {unmatched.map((item, i) => (
                      <p key={i} className="text-white">
                        {item.replace(/_/g, " ").toUpperCase()}
                      </p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border bg-blue-50/70 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Sold by: {machine?.sell_by_name || "NA"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border bg-emerald-50/70 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Manager: {data?.customer?.ownership_name || "NA"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {data && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-md px-2.5 text-xs"
                    >
                      <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      className="text-xs"
                      onClick={() => setImagesVisible(true)}
                    >
                      <Images className="mr-1.5 h-3.5 w-3.5" />
                      Images
                    </DropdownMenuItem>

                    {payments.length > 0 && (
                      <DropdownMenuItem
                        className="text-xs"
                        disabled={ledgerDownloading}
                        onClick={handleDownloadLedger}
                      >
                        {ledgerDownloading ? (
                          <Spinner className="mr-1.5 h-3.5 w-3.5" />
                        ) : (
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {ledgerDownloading ? "Downloading..." : "Ledger"}
                      </DropdownMenuItem>
                    )}

                    {data?.editAllowed && (
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={async () => {
                          setZipDwonloading(true);
                          await downloadCustomerZip(data);
                          setZipDwonloading(false);
                        }}
                      >
                        {zipDownloading ? (
                          <Spinner />
                        ) : (
                          <Package className="mr-2 h-3.5 w-3.5" />
                        )}
                        ZIP
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {((!data?.machine?.cancelled_detail &&
                  !data?.machine?.commission_issued) ||
                  override) && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 rounded-md px-2.5 text-xs"
                        onClick={() => {
                          if (!data?.editAllowed) {
                            toast.info("You are not allowed to edit machine");
                            return;
                          }

                          if (data?.machine?.type === "Parts") {
                            setEditParts(true);
                          } else {
                            setEditMachine(true);
                          }
                        }}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        {data?.machine?.type === "Parts"
                          ? "Edit Parts"
                          : "Edit Machine"}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-md px-2.5 text-xs"
                          >
                            <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                            More
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-52">
                          {data?.machine &&
                            (!data?.machine?.payment_lock || override) && (
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={() => {
                                  if (!data?.editAllowed) {
                                    toast.info(
                                      "You are not allowed to add payment",
                                    );
                                    return;
                                  }

                                  setAddPayment(true);
                                }}
                              >
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                Add Payment
                              </DropdownMenuItem>
                            )}

                          {installments.length > 0 && (
                            <DropdownMenuItem
                              className="text-xs"
                              onClick={() => setInstallmentVisible(true)}
                            >
                              <CalendarClock className="mr-2 h-3.5 w-3.5" />
                              Installments
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => setCredit(true)}
                          >
                            <Banknote className="mr-2 h-3.5 w-3.5" />
                            Credit Cheque
                          </DropdownMenuItem>

                          {data && !data?.machine?.ready_for_delivery && (
                            <DropdownMenuItem
                              className="text-xs"
                              onClick={() => setReadyForDelivery(data)}
                            >
                              <Truck className="mr-2 h-3.5 w-3.5" />
                              Apply For Delivery
                            </DropdownMenuItem>
                          )}

                          {data && data?.machine?.ready_for_delivery && (
                            <DropdownMenuItem
                              className="text-xs text-destructive"
                              onClick={() => setRevokeDelivery(data)}
                            >
                              <Truck className="mr-2 h-3.5 w-3.5" />
                              Revoke Delivery
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <div className="w-full px-1 py-1">
                            <CancelDeal
                              machine={data?.machine}
                              onRefresh={onRefresh}
                            />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="h-7 rounded-md border border-emerald-500/30 bg-emerald-500 px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow active:scale-[0.98]"
                      >
                        Admin
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => setOverride(!override)}
                      >
                        {override ? (
                          <Lock className="mr-2 h-3.5 w-3.5" />
                        ) : (
                          <Unlock className="mr-2 h-3.5 w-3.5" />
                        )}
                        {override ? "Disable Override" : "Enable Override"}
                      </DropdownMenuItem>

                      {!data?.machine?.commission_issued && (
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => setOpenChange(true)}
                        >
                          <User /> Change Sales Person
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        className="text-xs text-red-600 focus:text-red-600"
                        onClick={() => setOpenDelete(true)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="relative overflow-hidden rounded-lg border bg-background shadow-none">
            {machine?.cancelled_detail ? (
              <div className="pointer-events-none absolute top-2 left-2 z-10 select-none">
                <div className="relative flex h-14 w-28 -rotate-6 items-center justify-center overflow-hidden rounded-md border-2 border-red-600/75 bg-red-50/85 text-red-700 shadow-[0_8px_22px_rgba(220,38,38,0.18)] ring-1 ring-red-900/10 backdrop-blur-sm dark:bg-red-950/45 dark:text-red-300">
                  <div className="absolute inset-1 rounded border border-dashed border-red-600/55" />
                  <div className="absolute top-1/2 -left-5 h-10 w-40 -translate-y-1/2 rotate-[-18deg] bg-white/25 dark:bg-white/5" />
                  <div className="relative flex flex-col items-center gap-0.5 text-center">
                    <div className="flex items-center gap-1 text-[9px] leading-none font-black tracking-[0.22em] uppercase">
                      <TriangleAlert className="h-3 w-3" />
                      Deal
                    </div>
                    <div className="text-[14px] leading-none font-black tracking-[0.14em] uppercase">
                      Cancelled
                    </div>
                    <div className="h-px w-16 bg-red-600/50" />
                  </div>
                </div>
              </div>
            ) : (
              machine?.commission_issued && (
                <div className="pointer-events-none absolute top-2 left-2 z-10 select-none">
                  <div className="relative flex h-14 w-28 -rotate-6 items-center justify-center overflow-hidden rounded-md border-2 border-emerald-600/75 bg-emerald-50/80 text-emerald-700 shadow-[0_8px_22px_rgba(16,185,129,0.18)] ring-1 ring-emerald-900/10 backdrop-blur-sm dark:bg-emerald-950/45 dark:text-emerald-300">
                    <div className="absolute inset-1 rounded border border-dashed border-emerald-600/55" />
                    <div className="absolute top-1/2 -left-5 h-10 w-40 -translate-y-1/2 rotate-[-18deg] bg-white/25 dark:bg-white/5" />
                    <div className="relative flex flex-col items-center gap-0.5 text-center">
                      <div className="flex items-center gap-1 text-[9px] leading-none font-black tracking-[0.24em] uppercase">
                        <ShieldCheck className="h-3 w-3" />
                        Commission
                      </div>
                      <div className="text-[15px] leading-none font-black tracking-[0.18em] uppercase">
                        Issued
                      </div>
                      <div className="h-px w-16 bg-emerald-600/50" />
                    </div>
                  </div>
                </div>
              )
            )}
            <CardHeader
              className={`border-b bg-muted/10 px-3 py-2 ${machine?.commission_issued || machine?.cancelled_detail ? "pl-32 sm:pl-36" : ""}`}
            >
              <CardTitle className="text-sm font-bold tracking-tight">
                {machine?.type === "Parts"
                  ? "Parts Information"
                  : "Machine Information"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3">
              {machine?.type === "Parts" ? (
                machine ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {machine?.parts_information?.map(
                        (item: any, i: number) => (
                          <div
                            key={i}
                            className="rounded-md border bg-muted/15 p-2.5"
                          >
                            <h4 className="mb-2 text-xs font-semibold">
                              Part {i + 1}
                            </h4>

                            <div className="space-y-1.5">
                              {Object.entries(item).map(
                                ([key, val]: any, ind) => (
                                  <div
                                    key={ind}
                                    className="flex justify-between gap-2 text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {key.charAt(0).toUpperCase() +
                                        key.slice(1).replace("_", " ")}
                                    </span>
                                    <span className="max-w-[130px] truncate text-right font-medium">
                                      {val || "N/A"}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    {infoItem(
                      "Contract Date",
                      machine.contract_date
                        ? moment(machine.contract_date).format("YYYY-MM-DD")
                        : "N/A",
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No data available
                  </p>
                )
              ) : machine ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {infoItem("Model", machine.serial_no)}
                  {infoItem("Power", machine.power)}
                  {infoItem("Source", machine.source)}
                  {infoItem(
                    "Contract",
                    machine.contract_date
                      ? moment(machine.contract_date).format("YYYY-MM-DD")
                      : "N/A",
                  )}
                  {infoItem("Group", data?.customer?.customer_group)}

                  {(machine.order_no_arr && machine.order_no_arr.length > 0
                    ? machine.order_no_arr
                    : ["N/A"]
                  ).map((item, index) => (
                    <Fragment key={index}>
                      {infoItem(`Order ${index + 1}`, item, machine?.shipment_title?.[index])}

                    </Fragment>
                  ))}
                  {machine.delivery_date &&
                    infoItem(
                      "Delivery Date",
                      moment(machine.delivery_date).format("DD MMM YYYY"),
                    )}
                  <div className="col-span-1 md:col-span-2 xl:col-span-3">
                    {machine?.note && (
                      <div className="rounded-md border bg-primary/5 px-2.5 py-2 ring-1 ring-primary/10">
                        <p className="text-[10px] font-semibold tracking-wide text-primary uppercase">
                          Note
                        </p>
                        <p className="mt-1 text-sm leading-5 break-words whitespace-pre-wrap text-foreground">
                          {machine.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-lg border bg-background shadow-none">
            <CardHeader className="border-b bg-muted/10 px-3 py-2">
              <CardTitle className="text-sm font-bold tracking-tight">
                Billing Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 p-3">
              <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
                <div className="rounded-md border bg-muted/15 px-2.5 py-2">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Bill
                  </p>
                  <p className="text-sm font-semibold">
                    <CurrencyFormatter amount={payment[0]} />
                  </p>
                </div>

                <div className="rounded-md border bg-emerald-50/70 px-2.5 py-2 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Received
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    <CurrencyFormatter amount={payment[1]} />
                  </p>
                </div>

                <div className="rounded-md border bg-red-50/70 px-2.5 py-2 dark:bg-red-950/20">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Balance
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    <CurrencyFormatter
                      amount={(payment[0] || 0) - (payment[1] || 0)}
                    />
                  </p>
                </div>
              </div>

              {machine?.speed_money && (
                <div className="rounded-md border bg-orange-50 px-2.5 py-2 text-sm dark:bg-orange-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Speed Money
                    </span>
                    <span className="text-sm font-semibold">
                      {machine.speed_money_amount || "N/A"}
                    </span>
                  </div>

                  {machine.speed_money_note && (
                    <p className="mt-1 text-xs leading-5 break-words whitespace-pre-wrap text-muted-foreground">
                      {machine.speed_money_note}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  },
);

export default ClientCard;
