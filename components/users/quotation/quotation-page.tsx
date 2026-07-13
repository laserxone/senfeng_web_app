"use client"
import AppTable from "@/components/app-table";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { QuotationForm } from "@/components/users/quotation/quotation-form";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { QuotationData } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Download, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Heading from "../../ui/heading";
import { QuotationFormEdit } from "./quotation-form-edit";

export default function QuotationPage() {
  const [data, setData] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(false)
  const { userID } = useUserDetail()
  const [deleteItem, setDeleteItem] = useState<number | string | null | undefined>(null)
  const [downloadItem, setDownloadItem] = useState<number | string | null | undefined>(null)
   const [open, setOpen] = useState(false)

  useEffect(() => {
    if (userID) {
      fetchData()
    }
  }, [userID])

  async function fetchData() {
    if (!userID) return
    setLoading(true)
    try {
      const res = await axios.get(`/${userID}/quotation`)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

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


    } catch (error: any) {
      toast.error(error?.message || "Error creating pdf")
    } finally {
      setDownloadItem(null)
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
        columns={columns} />

         <QuotationForm
         open={open}
         onClose={()=> setOpen(false)}
          onRefresh={fetchData}
        />

    </div>
  )
}