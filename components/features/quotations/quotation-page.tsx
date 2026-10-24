"use client";
import { QuotationForm } from "@/components/features/quotations/quotation-form";
import AppTable from "@/components/shared/tables/app-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { QuotationData } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Download,
  ExternalLink,
  FileText,
  Trash2,
} from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { QuotationFormEdit } from "./quotation-form-edit";

export default function QuotationPage() {
  const [data, setData] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const [deleteItem, setDeleteItem] = useState<
    number | string | null | undefined
  >(null);
  const [downloadItem, setDownloadItem] = useState<
    number | string | null | undefined
  >(null);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationData | null>(null);
  const [openingItem, setOpeningItem] = useState<
    number | string | null | undefined
  >(null);

  const fetchData = useCallback(async () => {
    if (!userID) return;
    setLoading(true);
    try {
      const res = await axios.get(`/${userID}/quotation`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [fetchData, userID]);

  const updateQuotationQuery = useCallback((quotationId?: string | number) => {
    const url = new URL(window.location.href);

    if (quotationId !== undefined) {
      url.searchParams.set("q", String(quotationId));
      window.history.pushState({}, "", url);
    } else {
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url);
    }

    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  useEffect(() => {
    const syncQuotationFromUrl = () => {
      const quotationId = new URLSearchParams(window.location.search).get("q");
      const quotation = quotationId
        ? data.find((item) => String(item.id) === quotationId)
        : undefined;

      setSelectedQuotation(quotation || null);
      setDetailsOpen(Boolean(quotation));
    };

    syncQuotationFromUrl();
    window.addEventListener("popstate", syncQuotationFromUrl);

    return () => {
      window.removeEventListener("popstate", syncQuotationFromUrl);
    };
  }, [data]);

  const sortableHeader = (title: string) => {
    return function SortableHeader({
      column,
    }: {
      column: {
        getIsSorted: () => false | "asc" | "desc";
        toggleSorting: (descending?: boolean) => void;
      };
    }) {
      return (
        <Button
          variant="ghost"
          className="h-8 px-0 text-[11px] font-bold tracking-wide text-slate-700 uppercase hover:bg-transparent dark:text-zinc-200"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {title}
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      );
    };
  };

  const columns: ColumnDef<QuotationData>[] = [
    {
      accessorKey: "date",
      header: sortableHeader("Quote Date"),

      cell: ({ row }) =>
        row.original.date
          ? moment(row.original.date).format("DD MMM YYYY")
          : "—",
    },
    {
      accessorKey: "customer_name",
      header: sortableHeader("Customer / Company"),
      cell: ({ row }) => (
        <span className="font-medium break-words">
          {row.original.customer_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "contact_person",
      header: sortableHeader("Contact person"),
      cell: ({ row }) => (
        <span className="break-words">
          {row.original.contact_person || "—"}
        </span>
      ),
    },
    {
      accessorKey: "contact_number",
      header: sortableHeader("Contact number"),
      cell: ({ row }) => (
        <span className="break-words">
          {row.original.contact_number || "—"}
        </span>
      ),
    },
    {
      accessorKey: "user_name",
      header: sortableHeader("Sales person"),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          title={row.original.user_name || "Unassigned"}
          className={`max-w-full text-[10px] ${
            row.original.user_name
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          <span className="min-w-0 truncate">
            {row.original.user_name || "Unassigned"}
          </span>
        </Badge>
      ),
    },
    {
      accessorKey: "machine_model",
      header: sortableHeader("Machine model"),
      cell: ({ row }) => (
        <span className="font-medium break-words">
          {row.original.machine_model || "—"}
        </span>
      ),
    },
    {
      accessorKey: "machine_power",
      header: sortableHeader("Power"),
      cell: ({ row }) =>
        row.original.machine_power ? (
          <Badge
            variant="outline"
            title={row.original.machine_power}
            className="max-w-full border-slate-200 bg-slate-50 text-[10px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <span className="min-w-0 truncate">
              {row.original.machine_power}
            </span>
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "price",
      header: sortableHeader("Price"),
      cell: ({ row }) =>
        row.original.price ? (
          <Badge
            variant="outline"
            title={row.original.price}
            className="max-w-full border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <span className="min-w-0 truncate">{row.original.price}</span>
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "validity",
      header: sortableHeader("Validity"),
      cell: ({ row }) =>
        row.original.validity ? (
          <Badge
            variant="outline"
            title={row.original.validity}
            className="max-w-full border-amber-200 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <span className="min-w-0 truncate">{row.original.validity}</span>
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "payment_terms",
      header: sortableHeader("Payment terms"),
      cell: ({ row }) => (
        <div className="max-w-full truncate" title={row.original.payment_terms}>
          {row.original.payment_terms || "—"}
        </div>
      ),
    },
    {
      accessorKey: "delivery_time",
      header: sortableHeader("Delivery time"),
      cell: ({ row }) =>
        row.original.delivery_time ? (
          <span>{row.original.delivery_time}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <div className="flex items-center gap-1.5">
            <QuotationFormEdit
              id={currentItem.id}
              data={currentItem}
              onRefresh={fetchData}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg px-2.5"
              aria-label="Download quotation"
              disabled={downloadItem === currentItem.id}
              onClick={(event) => {
                event.stopPropagation();
                handleDownloadQuotation(currentItem);
              }}
            >
              {downloadItem === currentItem.id ? (
                <Spinner className="size-3.5" />
              ) : (
                <Download className="size-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg bg-destructive px-2.5 text-white hover:bg-destructive/90 hover:text-white"
              aria-label="Delete quotation"
              disabled={deleteItem === currentItem.id}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(currentItem);
              }}
            >
              {deleteItem === currentItem.id ? (
                <Spinner className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];
  async function handleDownloadQuotation(quotation: QuotationData) {
    if (!quotation?.id) return;
    setDownloadItem(quotation.id);

    try {
      const pdfRes = await axios.post(
        `/${userID}/quotation/pdf`,
        {
          data: quotation,
        },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const blob = new Blob([pdfRes.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const fileName =
        pdfRes.headers["content-disposition"]
          ?.split("filename=")?.[1]
          ?.replaceAll('"', "") || `Quotation-${quotation.id}.pdf`;

      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error creating pdf",
      );
    } finally {
      setDownloadItem(null);
    }
  }

  async function handleOpenQuotation(quotation: QuotationData) {
    if (!quotation?.id || !userID) return;

    setOpeningItem(quotation.id);

    try {
      const pdfRes = await axios.post(
        `/${userID}/quotation/pdf`,
        { data: quotation },
        {
          responseType: "blob",
          headers: { "Content-Type": "application/json" },
        },
      );

      const blob = new Blob([pdfRes.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const fileName =
        pdfRes.headers["content-disposition"]
          ?.split("filename=")?.[1]
          ?.replaceAll('"', "") || `Quotation-${quotation.id}.pdf`;

      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error opening quotation",
      );
    } finally {
      setOpeningItem(null);
    }
  }

  function handleDetailsOpenChange(nextOpen: boolean) {
    setDetailsOpen(nextOpen);

    if (!nextOpen) {
      updateQuotationQuery();
    }
  }

  async function handleDelete(item: QuotationData) {
    if (!item?.id) return;
    setDeleteItem(item.id);
    try {
      await axios.delete(`/${userID}/quotation/${item.id}`);
      await fetchData();
    } finally {
      setDeleteItem(null);
    }
  }
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Heading panel title="Quotation" description="Create sales quotation" />
        <Button onClick={() => setOpen(true)}>Create Quotation</Button>
      </div>

      <AppTable data={data} columns={columns} loading={loading} />

      <QuotationForm
        open={open}
        onClose={() => setOpen(false)}
        onRefresh={fetchData}
      />

      <Dialog open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b bg-muted/30 px-5 py-4 pr-12">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle>Quotation Details</DialogTitle>
                <DialogDescription className="mt-1">
                  Quotation #{selectedQuotation?.id}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedQuotation ? (
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <QuotationDetail
                label="Customer / Company"
                value={selectedQuotation.customer_name}
              />
              <QuotationDetail
                label="Contact Person"
                value={selectedQuotation.contact_person}
              />
              <QuotationDetail
                label="Contact Number"
                value={selectedQuotation.contact_number}
              />
              <QuotationDetail label="Email" value={selectedQuotation.email} />
              <QuotationDetail
                label="Machine Model"
                value={selectedQuotation.machine_model}
              />
              <QuotationDetail
                label="Machine Power"
                value={selectedQuotation.machine_power}
              />
              <QuotationDetail label="Price" value={selectedQuotation.price} />
              <QuotationDetail
                label="Date"
                value={
                  selectedQuotation.date
                    ? moment(selectedQuotation.date).format("YYYY-MM-DD")
                    : undefined
                }
              />
              <QuotationDetail
                label="Validity"
                value={selectedQuotation.validity}
              />
              <QuotationDetail
                label="Delivery Time"
                value={selectedQuotation.delivery_time}
              />
              <QuotationDetail
                className="sm:col-span-2"
                label="Payment Terms"
                value={selectedQuotation.payment_terms}
              />
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4">
            <Button
              variant="outline"
              onClick={() => handleDetailsOpenChange(false)}
            >
              Close
            </Button>
            <Button
              disabled={
                !selectedQuotation || openingItem === selectedQuotation.id
              }
              onClick={() =>
                selectedQuotation && handleOpenQuotation(selectedQuotation)
              }
            >
              {openingItem === selectedQuotation?.id ? (
                <Spinner />
              ) : (
                <ExternalLink />
              )}
              Open Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuotationDetail({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-background px-3 py-2.5 ${className}`}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-words text-foreground">
        {value || "-"}
      </p>
    </div>
  );
}
