import PageTable from "@/components/shared/tables/app-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import useUserDetail from "@/hooks/use-user-detail";
import formatCurrency from "@/lib/formatCurrency";
import { SearchItem } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";

type InvoiceStatusFilter = "all" | "proforma" | "issued" | "cancelled";

type PageTableRef = {
  handleClear: () => void;
};

const SearchResultModal = ({
  visible,
  onClose,
  data,
  onselect,
  showSelect = true,
  total = 0,
}: {
  visible: boolean;
  onClose: Dispatch<SetStateAction<boolean>>;
  data: SearchItem[];
  onselect?: (item: SearchItem) => void;
  showSelect?: boolean;
  total: number;
}) => {
  const { base_route } = useUserDetail();
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatusFilter>("all");

  const filteredData = useMemo(
    () =>
      invoiceStatusFilter === "all"
        ? data
        : data.filter((item) => item.invoice_status === invoiceStatusFilter),
    [data, invoiceStatusFilter],
  );

  const filteredTotal = useMemo(
    () =>
      filteredData.reduce(
        (sum, item) => sum + Number(item.total || item.final_amount || 0),
        0,
      ),
    [filteredData],
  );

  const columns: ColumnDef<SearchItem>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("created_at")
            ? new Date(row.getValue("created_at")).toLocaleDateString("en-GB")
            : ""}
        </div>
      ),
    },
    {
      accessorKey: "invoicenumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Invoice No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("invoicenumber")}</div>,
    },
    {
      accessorKey: "invoice_status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Document Status
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const invoiceStatus = row.original.invoice_status || "issued";
        const statusClasses = {
          proforma: "bg-amber-100 text-amber-800",
          issued: "bg-emerald-100 text-emerald-800",
          cancelled: "bg-rose-100 text-rose-800",
        };

        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusClasses[invoiceStatus]}`}
          >
            {invoiceStatus === "proforma" ? "Pro Forma" : invoiceStatus}
          </span>
        );
      },
    },

    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },

    {
      accessorKey: "company",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("company")}</div>,
    },

    {
      accessorKey: "customer_location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_location")}</div>,
    },

    {
      accessorKey: "manager",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sale Person
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("manager")}</div>,
    },

    {
      accessorKey: "total",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Invoice Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const pending = Number(row.original.total_paid || 0);
        return (
          <div>
            {row.getValue("total")} {pending > 0 && `(${pending})`}
          </div>
        );
      },
    },

    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("status")}</div>,
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.original?.id ?? null;
        return (
          <div className="flex gap-2">
            {showSelect && (
              <Button
                variant="secondary"
                onClick={() => onselect?.(row.original)}
              >
                Select
              </Button>
            )}
            {id && (
              <Link href={`/${base_route}/pos/${id}`} target="_blank">
                <Button variant={"outline"}>Record</Button>
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="h-[90vh] max-w-[90vw] min-w-[90vw]">
        <DialogHeader className={"hidden"}>
          <DialogTitle>Select Invoice</DialogTitle>
        </DialogHeader>

        <PageTable columns={columns} data={filteredData}>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  // ["proforma", "Pro Forma"],
                  // ["issued", "Issued"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    invoiceStatusFilter === value ? "default" : "outline"
                  }
                  onClick={() => setInvoiceStatusFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="flex w-full max-w-xs items-center justify-between border-b border-gray-300 p-2 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Amount
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(filteredTotal)}
              </span>
            </div>
          </div>
        </PageTable>
      </DialogContent>
    </Dialog>
  );
};

export default SearchResultModal;
