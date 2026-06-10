import { ArrowUpDown } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import "./Button.css";
import PageTable from "./app-table";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import useUserDetail from "@/hooks/use-user-detail";
import formatCurrency from "@/lib/formatCurrency";
import { SearchItem } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import axios from "axios";
import Spinner from "../ui/spinner";

type PageTableRef = {
  handleClear: () => void;
};

const SearchResultModal = ({
  visible,
  onClose,
  data,
  onselect,
  
}: {
  visible: boolean,
  onClose: Dispatch<SetStateAction<boolean>>,
  data: SearchItem[],
  onselect: (item: SearchItem) => void,
  
}) => {
  const pageTableRef = useRef<PageTableRef | null>(null);
  const [value, setValue] = useState("");
  const total = data.reduce((sum, item) => sum + (item.final_amount || 0), 0);
  const { base_route, } = useUserDetail();

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
      cell: ({ row }) => <div>{row.getValue("total")}</div>,
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
            <Button variant="secondary" onClick={() => onselect(row.original)}>
              Select
            </Button>
            {id && (
              <Link href={`/${base_route}/pos/${id}`} target="_blank">
                <Button >
                  Payment Record
                </Button>
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  const tableHeader = [
    {
      value: "invoicenumber",
      label: "Invoice Number",
    },
    {
      value: "name",
      label: "Name",
    },
    {
      value: "company",
      label: "Company",
    },
    {
      value: "phone",
      label: "Phone Number",
    },
  ];

  function handleClear() {
    if (pageTableRef.current) {
      pageTableRef.current?.handleClear();
      setValue("");
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] min-w-[90vw]">
        <DialogHeader className={"hidden"}>
          <DialogTitle>Select Invoice</DialogTitle>
        </DialogHeader>

        <PageTable
          ref={pageTableRef}
          columns={columns}
          data={data}
          totalItems={data.length}
          searchItem={value.toLowerCase()}
          searchName={value ? `Search ${value}...` : "Select filter first..."}
          tableHeader={tableHeader}
        >
          <div className="flex flex-1 flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-4">
              <Select
                onValueChange={(val) => {
                  setValue(val);
                }}
                value={value}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select filter..." />
                </SelectTrigger>
                <SelectContent>
                  {tableHeader.map((framework) => (
                    <SelectItem
                      key={framework.value}
                      value={framework.value}
                      onClick={() => {
                        setValue(
                          framework.value === value ? "" : framework.value,
                        );
                      }}
                    >
                      {framework.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  handleClear();
                }}
              >
                Clear
              </Button>
            </div>

            <div className="flex justify-between items-center p-2 w-full max-w-xs border-b border-gray-300 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Amount
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(total || 0)}
              </span>
            </div>
          </div>
        </PageTable>
      </DialogContent>
    </Dialog>
  );
};


export default SearchResultModal;
