"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpDown,
  EditIcon,
  Info,
  ShieldCheck,
  Trash,
  TriangleAlert
} from "lucide-react";
import {
  Fragment,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import AddPayment from "@/components/addPayment";
import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table-without-pagination";
import CurrencyFormatter from "@/components/currency-formatter";
import { downloadCustomerZip } from "@/components/downloadzip";
import DropzoneMulti from "@/components/dropzone-multi";
import EditParts from "@/components/edit-parts";
import EditMachine from "@/components/editMachine";
import EditPayment from "@/components/editPayment";
import InvoicePDF from "@/components/invoicepdf";
import { RequiredStar } from "@/components/RequiredStar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { UserSearch } from "@/components/user-search";
import { storage } from "@/config/firebase";
import { Colors } from "@/constants/data";

import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { TriggerFirebaseForMachine } from "@/lib/triggerFirebase";
import { InstallmentProps, MachinePayment, MachineProps, MachineResponse, MyCustomer } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { pdf } from "@react-pdf/renderer";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref } from "firebase/storage";
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
import Image from "next/image";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import AddCheque from "./add-cheque";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [zipDownloading, setZipDwonloading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [installmentVisible, setInstallmentVisible] = useState(false);
  const [credit, setCredit] = useState(false);
  const [readyForDelivery, setReadyForDelivery] = useState<MachineResponse | null>(null);
  const [openDelete, setOpenDelete] = useState(false);

  useEffect(() => {
    if (id && userID) {
      fetchData(id);
    }
  }, [id, userID]);

  async function fetchData(id: number | string) {

    onLoading?.(true);

    try {
      const response: { data: MachineResponse } = await axios.get(`/${userID}/machine/${id}`);

      const machine = response.data?.machine;
      if (response.data?.installments) {
        setInstallments(response.data?.installments);
      }
      setUnmatched(response.data.unmatchedFields);



      setData(response.data);
      if (machine) {
        setTotal(Number(machine.price || 0));

        const payments =
          machine?.payments?.filter((p) => p.clearance_date !== null) || [];
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
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex flex-row gap-2 items-center">
              {currentItem.image && (
                <div
                  onClick={() => {
                    if (currentItem.id) {
                      setImageURL(currentItem);
                      setVisible(true);
                    }
                  }}
                >
                  <MyImg img={currentItem.image} />
                </div>
              )}

              {data?.machine && !currentItem?.payment_lock && data?.editAllowed && (
                <EditIcon
                  style={{ color: Colors.button }}
                  className="cursor-pointer h-5 w-5"
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
    [data],
  );

  async function handleDownloadLedger() {
    let runningBalance = total;

    const convertedPayment = payments.map((payment) => {
      runningBalance -= Number(payment.amount);
      return { ...payment, balance: runningBalance };
    });

    const finalData = {
      customer: data?.customer?.name,
      name: data?.customer?.owner,
      contact: data?.customer?.number?.join(", "),
      model: data?.machine?.serial_no,
      serial: data?.machine?.order_no_arr?.join(", "),
      manager: data?.machine?.sell_by_name || "NA",
      payments: convertedPayment,
      received: received || 0,
      total: total || 0,
    };

    const blob = await pdf(<InvoicePDF data={finalData} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

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

  const ClientCard = memo(
    ({
      data,
      payment,
      machine,
      children,
    }: {
      data: MyCustomer | null
      payment: [number, number]
      machine: MachineProps | null
      children: ReactNode
    }) => {
      const [showAlert, setShowAlert] = useState(false)

      useEffect(() => {
        if (!machine) return

        const payments = machine?.payments ?? []
        const result = findDuplicateNotes(payments)
        setShowAlert(result.length > 0)
      }, [machine])

      function findDuplicateNotes(array: MachinePayment[]) {
        const noteMap = new Map()
        const duplicates = []

        for (const item of array) {
          if (noteMap.has(item.note)) {
            duplicates.push(item.note)
          } else {
            noteMap.set(item.note, true)
          }
        }

        return [...new Set(duplicates)]
      }

      const infoItem = (label: string, value?: string | number | null) => (
        <div className="rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-medium">{value || "N/A"}</p>
        </div>
      )

      return (
        <Card className="w-full rounded-xl border bg-background shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 border-b pb-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">
                    {data?.name || "Customer Name"}
                  </h2>

                  {data?.owner && (
                    <Badge variant="secondary" className="h-5 text-[11px]">
                      {data.owner}
                    </Badge>
                  )}

                  {machine?.status && (
                    <Badge variant="outline" className="h-5 text-[11px]">
                      {machine.status}
                    </Badge>
                  )}

                  {machine?.cancelled_detail && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="h-5 cursor-pointer text-[11px]"
                        >
                          Cancelled
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="bg-red-600" arrowColor="bg-red-600 fill-red-600">
                        <p className="text-white">
                          {machine?.cancelled_reason || "Cancelled"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {showAlert && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="h-5 text-[11px]">
                          Duplicate TID
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="bg-red-600" arrowColor="bg-red-600 fill-red-600">
                        <p className="text-white">Duplicate TID found</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {unmatched.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="h-5 text-[11px] animate-pulse">
                          Missing Info
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="bg-red-600 flex flex-col" arrowColor="bg-red-600 fill-red-600">
                        {unmatched.map((item, i) => (
                          <p key={i} className="text-white">
                            {item.replace(/_/g, " ").toUpperCase()}
                          </p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Sell by: {machine?.sell_by_name || "NA"}</span>
                  <span>Manager: {data?.ownership_name || "NA"}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {children}
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
              <Card className="relative border shadow-none">
                {machine?.commission_issued && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                      className="
        flex
        h-44
        w-44
        rotate-[-18deg]
        flex-col
        items-center
        justify-center
        rounded-full
        border-[8px]
        border-sky-500/20
        bg-sky-500/5
        text-center
        shadow-lg
        backdrop-blur-[1px]
        select-none
      "
                    >
                      <div
                        className="
          text-[22px]
          font-black
          uppercase
          leading-none
          tracking-[0.35em]
          text-sky-600/20
        "
                      >
                        Commission
                      </div>

                      <div
                        className="
          mt-1
          text-[20px]
          font-black
          uppercase
          tracking-[0.3em]
          text-sky-600/20
        "
                      >
                        Issued
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader className="px-3 pb-2 pt-3">
                  <CardTitle className="text-sm font-semibold">
                    {machine?.type === "Parts"
                      ? "Parts Information"
                      : "Machine Information"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-3 pb-3">
                  {machine?.type === "Parts" ? (
                    machine ? (
                      <div className="space-y-3">
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {machine?.parts_information?.map(
                            (item: any, i: number) => (
                              <div
                                key={i}
                                className="rounded-md border bg-muted/20 p-2.5"
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
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {infoItem(
                          "Contract Date",
                          machine.contract_date
                            ? moment(machine.contract_date).format("YYYY-MM-DD")
                            : "N/A"
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
                          : "N/A"
                      )}
                      {infoItem("Group", data?.customer_group)}

                      {(machine.order_no_arr && machine.order_no_arr.length > 0
                        ? machine.order_no_arr
                        : ["N/A"]
                      ).map((item, index) => (
                        <Fragment key={index}>
                          {infoItem(`Order ${index + 1}`, item)}
                        </Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No data available
                    </p>
                  )}
                </CardContent>


              </Card>

              <Card className="border shadow-none">
                <CardHeader className="px-3 pb-2 pt-3">
                  <CardTitle className="text-sm font-semibold">
                    Billing Summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 px-3 pb-3">
                  <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
                    <div className="rounded-md border bg-muted/20 px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">Bill</p>
                      <p className="text-sm font-semibold">
                        <CurrencyFormatter amount={payment[0]} />
                      </p>
                    </div>

                    <div className="rounded-md border bg-muted/20 px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">
                        Received
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        <CurrencyFormatter amount={payment[1]} />
                      </p>
                    </div>

                    <div className="rounded-md border bg-muted/20 px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">
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
                    <div className="rounded-md border bg-orange-50 px-3 py-2 text-sm dark:bg-orange-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Speed Money
                        </span>
                        <span className="text-sm font-semibold">
                          {machine.speed_money_amount || "N/A"}
                        </span>
                      </div>

                      {machine.speed_money_note && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {machine.speed_money_note}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )
    }
  )

  async function onRefresh() {
    setCredit(false);
    setData(undefined);
    fetchData(id);
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ClientCard
        data={data?.customer || null}
        machine={data?.machine || null}
        payment={[total, received]}
      >
        {data && (
          <>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
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
                    onClick={handleDownloadLedger}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Ledger
                  </DropdownMenuItem>
                )}

                {data?.editAllowed && (
                  <DropdownMenuItem
                    className="text-xs"
                    onClick={async () => {
                      setZipDwonloading(true)
                      await downloadCustomerZip(data)
                      setZipDwonloading(false)
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


            {((!data?.machine?.cancelled_detail && !data?.machine?.commission_issued) || override) && (
              <>


                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    if (!data?.editAllowed) {
                      toast.info("You are not allowed to edit machine")
                      return
                    }

                    if (data?.machine?.type === "Parts") {
                      setEditParts(true)
                    } else {
                      setEditMachine(true)
                    }
                  }}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {data?.machine?.type === "Parts" ? "Edit Parts" : "Edit Machine"}
                </Button>


                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                      <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                      More
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    {data?.machine && (!data?.machine?.payment_lock || override) &&
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => {
                          if (!data?.editAllowed) {
                            toast.info("You are not allowed to add payment")
                            return
                          }

                          setAddPayment(true)
                        }}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                        Add Payment
                      </DropdownMenuItem>}


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

                    <DropdownMenuSeparator />

                    <div className="px-1 py-1 w-full">
                      <CancelDeal machine={data?.machine} onRefresh={onRefresh} />
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
                    className="
    h-8
    border
    border-emerald-500/30
    bg-emerald-500
    px-3
    text-xs
    font-medium
    text-white
    shadow-sm
    transition-all
    hover:bg-emerald-600
    hover:shadow
    active:scale-[0.98]
  "
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
      </ClientCard>

      <div className={`flex flex-1 min-h-[500px]`}>
        <PageTable
          columns={columns}
          data={payments}
          disableInput={true}
          onRowClick={(val, e) => { }}
        />
      </div>
      <EditMachine
        visible={editMachine}
        onClose={setEditMachine}
        machine_id={id}
        onRefresh={async () => { await fetchData(id) }}
        data={data?.machine}
      />

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
          setVisible(false);
          setImageURL(null);
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

      <ConfimationDialog
        loading={deleteLoading}
        open={openDelete}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove machined from the system"}
        onPressYes={() => deleteMachine()}
        onPressCancel={() => setOpenDelete(false)}
      />

      {override && (
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
      )}
    </div>
  );
}

const SendForDeliveryDialog = ({ open, onClose, onRefresh, data }: { open: boolean, onClose: () => void, onRefresh: () => Promise<void>, data: MachineResponse | null }) => {
  const { userID } = useUserDetail();

  const formSchema = z.object({
    name: z.string().min(1, "Receiver name is required"),
    city: z.string().min(1, "City is required"),
    number: z.string().min(1, "Contact number is required"),
    address: z.string().min(1, "Address is required"),
    pin: z.string().min(1, "Google pin is required"),
    note: z.string().optional(),
    tod: z.string().min(1, "Delivery time is required"),
  });

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      city: "",
      number: "",
      address: "",
      pin: "",
      note: "",
      tod: "",
    },
  });

  useEffect(() => {
    if (data?.customer?.id) {
      form.reset({
        name: data?.customer?.owner || "",
        city: data?.customer?.location || "",
        number: data?.customer?.number?.[0] || "",
        address: data?.customer?.address || "",
        pin: data?.customer?.pin || "",
        note: "",
        tod: "",
      });
    }
  }, [data]);

  async function onSubmit(values: FormValues) {

    if (!data?.machine?.id) return;

    setLoading(true);
    try {
      await axios.put(`/${userID}/machine/${data.machine.id}/delivery`, {
        ready_for_delivery: true,
        delivery_information: { ...values, tod: new Date(values.tod) },
        delivery_request_date: new Date()
      });
      await TriggerFirebaseForMachine()
      await onRefresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sending for Delivery</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit, (err) => {
            console.log("Validation Errors", err);
          })}
        >
          <ScrollArea className="h-[70vh] pr-2">
            <div className="grid gap-4 py-4 px-2">

              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Receiver Name <RequiredStar />
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="Enter receiver name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      City <RequiredStar />
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="Enter city"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="number"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Contact No <RequiredStar />
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="Enter contact number"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="tod"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Time of Delivery <RequiredStar />
                    </FieldLabel>
                    <Input
                      type="datetime-local"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Address <RequiredStar />
                    </FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Enter full address"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="pin"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Google Pin <RequiredStar />
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder="Paste Google Maps link"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Note</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Additional instructions (optional)"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Make sure everything is ready and completed before sending for
              delivery request.
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading && <Spinner />}
              Yes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CancelDeal = ({ machine, onRefresh }: { machine: MachineProps, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [reason, setReason] = useState("");
  const { userID } = useUserDetail();

  async function handleDealCancel() {
    if (!machine?.id) return;

    setLoading(true);

    axios
      .post(`/${userID}/machine/${machine?.id}/dealcancel`, { reason })
      .then(async () => {
        await onRefresh();
        setConfirmation(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <>
      {!machine?.cancelled_detail && (
        <Button
          onClick={() => setConfirmation(true)}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          Cancel Deal
        </Button>
      )}

      <ConfimationDialog
        valid={!!reason}
        loading={loading}
        open={confirmation}
        title={"Cancel Deal?"}
        description={
          "Make sure payments are reversed back to client before cancelling this deal"
        }
        onPressCancel={() => setConfirmation(false)}
        onPressYes={handleDealCancel}
      >
        <div>
          <Label>Reason</Label>
          <Input
            value={reason}
            placeholder="Enter reason for cancel"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </ConfimationDialog>
    </>
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
  override: boolean
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
  override
}: ImageSheetProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { userID } = useUserDetail();


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

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  async function handleDelete(id: string | number) {
    try {
      if (img && !img.includes("https")) {
        await DeleteFromStorage(img);
      }

      await axios.delete(`/${userID}/payment/${id}`);
      await onRefresh();
      handleClose();
      toast.success("Payment Deleted");
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

  if (!localImage) return null
  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Payment Image</SheetTitle>
          {(!payment_lock || override) && (editAllowed || override) && (
            <Button
              className="mb-2"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                // e.stopPropagation()
                // setSelectedCustomerId(currentItem?.id);
                // setShowConfirmation(true);
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
                  img ?? <></>
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
            <RenderInstallmentImage
              img={item.image}
              setImageOpen={setImageOpen}
            />
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
type RenderInstallmentImageProps = {
  img: string;
  type?: boolean;
  setImageOpen: (open: boolean) => void;
};
const RenderInstallmentImage = memo(({ img, type, setImageOpen }: RenderInstallmentImageProps) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
    setImageOpen(shouldZoom);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (type) {
      setLocalImage(img);
    } else if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        setLoading(true);
        getDownloadURL(ref(storage, img))
          .then((url) => {
            if (isMounted) setLocalImage(url);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [img, type]);

  return (
    <div className="space-y-2">
      {loading ? (
        <Spinner />
      ) : (
        !localImage ? null :
          <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
            <img
              src={localImage}
              alt="payment-img"
              className="h-[150px] w-auto object-contain"
            />
          </ControlledZoom>
      )}
    </div>
  );
});

const ViewImagesSheet = ({
  editAllowed,
  visible,
  onClose,
  data,
  onRefresh,
  customer_id,
}: {
  editAllowed: boolean,
  visible: boolean,
  onClose: () => void
  onRefresh: () => Promise<void>
  data: MachineProps | undefined
  customer_id: number | undefined
}) => {

  if (!data) return null
  const [imageOpen, setImageOpen] = useState(false);
  const [contractPdfImages, setContractPdfImages] = useState<string[]>([]);
  const [otherPdfImages, setOtherPdfImages] = useState<string[]>([]);
  const [addImageVisible, setAddImageVisible] = useState(false);

  const { userID } = useUserDetail();


  const contractImages = useMemo(() => data?.contract_images_png || [], [data]);
  const otherImages = useMemo(() => data?.other_images_png || [], [data]);
  const handshakeImages = useMemo(() => data?.handshake_images || [], [data]);
  const handoverImages = useMemo(
    () => data?.final_handover_images || [],
    [data],
  );
  const nameplateImages = useMemo(
    () => data?.machine_nameplate_images || [],
    [data],
  );
  const installationReport = useMemo(
    () => data?.installation_report || [],
    [data],
  );

  const prepareData = useCallback(async (pdfUrls: File[], condition: string) => {
    let localImages: string[] = [];
    await Promise.all(
      pdfUrls.map(async (pdfUrl) => {
        const pdfData = await fetchPdfData(pdfUrl);
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const scale = 2;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          if (!ctx) return
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const imgData = canvas.toDataURL("image/jpeg");

          localImages.push(imgData);
        }
      }),
    );
    if (condition === "pdf") {
      setContractPdfImages((prevState) => [...prevState, ...localImages]);
    } else {
      setOtherPdfImages((prevState) => [...prevState, ...localImages]);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (data?.contract_images_pdf?.length) {
      prepareData(data.contract_images_pdf, "pdf");
    }
    if (data?.other_images_pdf?.length) {
      prepareData(data.other_images_pdf, "other");
    }

    return () => {
      setContractPdfImages([]);
      setOtherPdfImages([]);
    };
  }, [visible, data?.contract_images_pdf, data?.other_images_pdf, prepareData]);

  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  const handleDeleteImage = async (imgUrl: string, typeKey: string) => {
    try {
      if (!imgUrl || !typeKey) return;
      let storagePath = "";
      if (imgUrl.includes("https")) {
        storagePath = "";
      } else {
        storagePath = imgUrl;
      }

      if (storagePath) {
        await DeleteFromStorage(storagePath);
      }

      const updatedImages = data[typeKey as keyof MachineProps].filter((i: string) => i !== imgUrl);
      let formData: Record<string, any> = {
        [typeKey]: updatedImages,
      };

      if (typeKey === "final_handover_images") {
        formData.handover_user_id = null;
      }

      await axios.put(`/${userID}/machine/${data.id}`, formData);

      toast.success("Image deleted successfully.");
      await onRefresh();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  const isMobile = useIsMobile()
  const maxwidth = isMobile ? "90vw" : "50vw"

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent
        style={{ width: "100%", maxWidth: maxwidth }}
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-2xl">View Images</SheetTitle>
            <Button
              size="sm"
              onClick={() => {
                if (editAllowed) {
                  setAddImageVisible(true);
                } else {
                  toast.error("You are not allowed to perform this action");
                }
              }}
            >
              Add Image
            </Button>
          </div>
        </SheetHeader>

        <AddImages
          customer_id={customer_id}
          machine={data}
          visible={addImageVisible}
          onClose={setAddImageVisible}
          onRefresh={onRefresh}
        />

        <ScrollArea className="h-[85vh] mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-4">

            {/* Handshake Images */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Handshake Images</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {handshakeImages.length > 0 ? (
                  handshakeImages.map((item, ind) => (
                    <RenderImage
                      key={item}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="handshake_images"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No images found</p>
                )}
              </div>
            </FieldSet>

            {/* Nameplate Images */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Nameplate Images</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {nameplateImages.length > 0 ? (
                  nameplateImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="machine_nameplate_images"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No images found</p>
                )}
              </div>
            </FieldSet>

            {/* Handover Images */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Handover Images</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {handoverImages.length > 0 ? (
                  handoverImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="final_handover_images"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No images found</p>
                )}
              </div>
            </FieldSet>

            {/* Installation Report */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Installation Report</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {installationReport.length > 0 ? (
                  installationReport.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="installation_report"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No report found</p>
                )}
              </div>
            </FieldSet>

            {/* Contract Images */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Contract Images</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {contractImages.length > 0 ? (
                  contractImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="contract_images_png"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No images found</p>
                )}
                {contractPdfImages.map((item, ind) => (
                  <RenderImage
                    key={`pdf-${ind}`}
                    img={item}
                    type="pdf"
                    setImageOpen={setImageOpen}
                  />
                ))}
              </div>
            </FieldSet>

            {/* Additional Images */}
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Additional Images</FieldLegend>
              <div className="flex flex-row gap-2 flex-wrap">
                {otherImages.length > 0 ? (
                  otherImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={(a, b) => {
                        if (editAllowed) handleDeleteImage(a, b);
                      }}
                      imageType="other_images_png"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No images found</p>
                )}
                {otherPdfImages.map((item, ind) => (
                  <RenderImage
                    key={`pdf-${ind}`}
                    img={item}
                    type="pdf"
                    setImageOpen={setImageOpen}
                  />
                ))}
              </div>
            </FieldSet>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
type RenderImageProps = {

  img: string;
  type?: string;
  setImageOpen: (val: boolean) => void;
  onDelete?: (img: string, imageType: string) => void;
  imageType?: string;
};
const RenderImage = memo(({ img, type, setImageOpen, onDelete, imageType }: RenderImageProps) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
    setImageOpen(shouldZoom);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (type) {
      setLocalImage(img);
    } else if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          if (isMounted) setLocalImage(url);
        });
      }
    }
    return () => {
      isMounted = false;
      setDeleteLoading(false)
    };
  }, [img, type]);

  if (!localImage) return null

  return (
    <div className="space-y-2">
      <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
        <img
          src={localImage || ""}
          alt="payment-img"
          className="h-[150px] w-auto object-contain"
        />
      </ControlledZoom>
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            setDeleteLoading(true);
            if (imageType)
              onDelete(img, imageType);
          }}
        >
          {deleteLoading ? <Spinner /> : <Trash size={16} />}
        </Button>
      )}
    </div>
  );
});

type FormValues = {
  note: string;
  images: string[];
  handover_user_id?: number | null;
};

const formSchema = z
  .object({
    note: z.string().min(1, { message: "Type is required." }),
    images: z.array(z.string()).min(1, { message: "one image is required" }),
    handover_user_id: z.number().nullable().optional(),
  })
  .refine(
    (data) =>
      data.note !== "handover" ||
      (data.handover_user_id !== null && data.handover_user_id !== undefined),
    {
      message: "Handover User ID is required",
      path: ["handover_user_id"],
    }
  );

const AddImages = ({ customer_id, machine, visible, onClose, onRefresh }: { customer_id: number | undefined, machine: MachineProps, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      images: [],
      handover_user_id: null,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    let allProcessedImages: string[] = [];
    await Promise.all(
      values.images.map(async (item) => {
        const name = `${OfficeState.value.data
          }/customer/${customer_id}/machine/${machine.id}/${values.note
          }/${moment().valueOf().toString()}.png`;
        const imageRefResult = await UploadImage(item, name);
        allProcessedImages.push(name);
      }),
    );
    let formData: Partial<MachineProps> = {};
    if (values.note === "contract") {
      formData.contract_images_png = [
        ...machine.contract_images_png,
        ...allProcessedImages,
      ];
    } else if (values.note === "additional") {
      formData.other_images_png = [
        ...machine.other_images_png,
        ...allProcessedImages,
      ];
    } else if (values.note === "handshake") {
      formData.handshake_images = [
        ...machine.handshake_images,
        ...allProcessedImages,
      ];
    } else if (values.note === "installation") {
      formData.installation_report = [
        ...machine.installation_report,
        ...allProcessedImages,
      ];
    } else if (values.note === "handover") {
      formData.final_handover_images = [
        ...machine.final_handover_images,
        ...allProcessedImages,
      ];
      formData.handover_user_id = values.handover_user_id;
    } else if (values.note === "nameplate") {
      formData.machine_nameplate_images = [
        ...machine.machine_nameplate_images,
        ...allProcessedImages,
      ];
    }

    await axios
      .put(`/${userID}/machine/${machine.id}`, formData)
      .then(async (response) => {
        await onRefresh();
        handleClose(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleClose(val: boolean) {
    form.reset();
    onClose(val);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files: File[] = Array.from(event.target.files);

      let localImages: any[] = [];

      await Promise.all(
        files.map(async (file) => {
          const pdfData = await fetchPdfData(file);
          const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const scale = 2; // Increase for better quality
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            if (!ctx) return
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const imgData = canvas.toDataURL("image/jpeg");

            localImages.push(imgData);
          }
        }),
      );

      form.setValue("images", localImages);
    }
  };



  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Images</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[80vh] px-2">
          <div className="px-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

              {/* NOTE (Radio) */}
              <Controller
                name="note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-wrap"
                    >
                      {[
                        { label: "Contract", value: "contract" },
                        { label: "Handshake", value: "handshake" },
                        { label: "Machine nameplate", value: "nameplate" },
                        { label: "Final handover", value: "handover" },
                        { label: "Installation report", value: "installation" },
                        { label: "Additional", value: "additional" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <RadioGroupItem value={item.value} id={item.value} />
                          <Label htmlFor={item.value}>{item.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* HANDOVER USER */}
              {form.watch("note") === "handover" && (
                <Controller
                  name="handover_user_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Handover User</FieldLabel>
                      <UserSearch
                        value={field.value}
                        onReturn={field.onChange}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {/* IMAGES */}
              <Controller
                name="images"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Add Images</FieldLabel>

                    <DropzoneMulti
                      value={field.value || []}
                      onDrop={(files) => field.onChange(files)}
                      title="Click to upload"
                      subheading="or drag and drop"
                      description="PNG or JPG"
                      drag="Drop the files here..."
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* PDF */}
              <div className="flex flex-1 gap-2 items-center">
                <Separator className="flex flex-1" />
                <Label className="mx-2 text-[16px]">or</Label>
                <Separator className="flex flex-1" />
              </div>

              <Label className="font-medium text-[16px]">Select Pdf</Label>

              <input
                multiple
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />

              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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

  if (loading) return <Spinner />;
  if (!img || error || !localImage) return <p>No image</p>;

  return <Image alt="payment image" src={localImage} width={50} height={50} />;
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
      disabled={loading}
      onClick={() => {
        handleVerify(item);
      }}
    >
      {loading && <Spinner />} {loading ? "Verifying" : "Verify"}
    </Button>
  );
};


const fetchPdfData = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};