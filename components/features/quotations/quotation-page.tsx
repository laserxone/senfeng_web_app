"use client"
import AppTable from "@/components/shared/tables/app-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "@/components/ui/spinner";
import { QuotationForm } from "@/components/features/quotations/quotation-form";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { QuotationData } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Heading from "@/components/ui/heading";
import { QuotationFormEdit } from "./quotation-form-edit";

export default function QuotationPage() {
  const [data, setData] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(false)
  const { userID } = useUserDetail()
  const [deleteItem, setDeleteItem] = useState<number | string | null | undefined>(null)
  const [downloadItem, setDownloadItem] = useState<number | string | null | undefined>(null)
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null)
  const [openingItem, setOpeningItem] = useState<number | string | null | undefined>(null)

  const fetchData = useCallback(async () => {
    if (!userID) return
    setLoading(true)
    try {
      const res = await axios.get(`/${userID}/quotation`)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [userID])

  useEffect(() => {
    if (userID) {
      fetchData()
    }
  }, [fetchData, userID])

  const updateQuotationQuery = useCallback((quotationId?: string | number) => {
    const url = new URL(window.location.href)

    if (quotationId !== undefined) {
      url.searchParams.set("q", String(quotationId))
      window.history.pushState({}, "", url)
    } else {
      url.searchParams.delete("q")
      window.history.replaceState({}, "", url)
    }

    window.dispatchEvent(new PopStateEvent("popstate"))
  }, [])

  useEffect(() => {
    const syncQuotationFromUrl = () => {
      const quotationId = new URLSearchParams(window.location.search).get("q")
      const quotation = quotationId
        ? data.find((item) => String(item.id) === quotationId)
        : undefined

      setSelectedQuotation(quotation || null)
      setDetailsOpen(Boolean(quotation))
    }

    syncQuotationFromUrl()
    window.addEventListener("popstate", syncQuotationFromUrl)

    return () => {
      window.removeEventListener("popstate", syncQuotationFromUrl)
    }
  }, [data])

  const columns: ColumnDef<QuotationData>[] = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="ml-2">
          {row.original.date
            ? moment(new Date(row.original.date)).format("YYYY-MM-DD")
            : "-"}
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
          Customer / Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.customer_name || "-"}</div>,
    },
    {
      accessorKey: "contact_person",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contact Person
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.contact_person || "-"}</div>,
    },
    {
      accessorKey: "contact_number",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contact Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.contact_number || "-"}</div>,
    },
    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sales Person
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.user_name || "-"}</div>,
    },
    {
      accessorKey: "machine_model",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Machine Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.machine_model || "-"}</div>,
    },
    {
      accessorKey: "machine_power",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Power
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.machine_power || "-"}</div>,
    },
    {
      accessorKey: "price",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.price || "-"}
        </div>
      ),
    },
    {
      accessorKey: "validity",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Validity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.validity || "-"}</div>,
    },
    {
      accessorKey: "payment_terms",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Terms
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[220px] truncate">
          {row.original.payment_terms || "-"}
        </div>
      ),
    },
    {
      accessorKey: "delivery_time",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delivery Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.delivery_time || "-"}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const currentItem = row.original

        return (
          <div className="flex gap-2">
            <QuotationFormEdit id={currentItem.id} data={currentItem} onRefresh={fetchData} />
            <Button
              size="icon"
              variant="outline"
              disabled={downloadItem === currentItem?.id}
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadQuotation(currentItem)
              }}
            >
              {downloadItem === currentItem?.id ? <Spinner /> : <Download className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              disabled={deleteItem === currentItem?.id}
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(currentItem)
              }}
            >
              {deleteItem === currentItem?.id ? <Spinner /> : <Trash2 className="h-4 w-4" />}
            </Button>

          </div>
        )
      },
    },
  ]



  async function handleDownloadQuotation(quotation: QuotationData) {
    if (!quotation?.id) return
    setDownloadItem(quotation.id)

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
        }
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
      toast.error(error instanceof Error ? error.message : "Error creating pdf")
    } finally {
      setDownloadItem(null)
    }





  }

  async function handleOpenQuotation(quotation: QuotationData) {
    if (!quotation?.id || !userID) return

    setOpeningItem(quotation.id)

    try {
      const pdfRes = await axios.post(
        `/${userID}/quotation/pdf`,
        { data: quotation },
        {
          responseType: "blob",
          headers: { "Content-Type": "application/json" },
        }
      )

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
      toast.error(error instanceof Error ? error.message : "Error opening quotation")
    } finally {
      setOpeningItem(null)
    }
  }

  function handleDetailsOpenChange(nextOpen: boolean) {
    setDetailsOpen(nextOpen)

    if (!nextOpen) {
      updateQuotationQuery()
    }
  }

  async function handleDelete(item: QuotationData) {
    if (!item?.id) return
    setDeleteItem(item.id)
    try {
      await axios.delete(`/${userID}/quotation/${item.id}`)
      await fetchData()
    } finally {
      setDeleteItem(null)
    }
  }
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between gap-4 mt-2">
        <Heading title="Quotation" description="Create sales quotation" />
        <Button onClick={() => setOpen(true)}>Create Quotation</Button>
      </div>

      <AppTable data={data}
        columns={columns}
        loading={loading} />

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
              <QuotationDetail label="Customer / Company" value={selectedQuotation.customer_name} />
              <QuotationDetail label="Contact Person" value={selectedQuotation.contact_person} />
              <QuotationDetail label="Contact Number" value={selectedQuotation.contact_number} />
              <QuotationDetail label="Email" value={selectedQuotation.email} />
              <QuotationDetail label="Machine Model" value={selectedQuotation.machine_model} />
              <QuotationDetail label="Machine Power" value={selectedQuotation.machine_power} />
              <QuotationDetail label="Price" value={selectedQuotation.price} />
              <QuotationDetail
                label="Date"
                value={selectedQuotation.date ? moment(selectedQuotation.date).format("YYYY-MM-DD") : undefined}
              />
              <QuotationDetail label="Validity" value={selectedQuotation.validity} />
              <QuotationDetail label="Delivery Time" value={selectedQuotation.delivery_time} />
              <QuotationDetail
                className="sm:col-span-2"
                label="Payment Terms"
                value={selectedQuotation.payment_terms}
              />
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4">
            <Button variant="outline" onClick={() => handleDetailsOpenChange(false)}>
              Close
            </Button>
            <Button
              disabled={!selectedQuotation || openingItem === selectedQuotation.id}
              onClick={() => selectedQuotation && handleOpenQuotation(selectedQuotation)}
            >
              {openingItem === selectedQuotation?.id ? <Spinner /> : <ExternalLink />}
              Open Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function QuotationDetail({
  label,
  value,
  className = "",
}: {
  label: string
  value?: string | number | null
  className?: string
}) {
  return (
    <div className={`rounded-lg border bg-background px-3 py-2.5 ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value || "-"}
      </p>
    </div>
  )
}
