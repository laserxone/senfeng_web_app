import { ArrowUpDown, ArrowUpRight, FileText } from "lucide-react";
import moment from "moment";

import PageTable from "@/components/shared/tables/app-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import { QuotationData } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function RecentQuotations({
  data = [],
}: {
  data?: QuotationData[];
}) {
  const quotations = data.slice(0, 10);
  const { base_route } = useUserDetail();
  const columns: ColumnDef<QuotationData>[] = [
    {
      accessorKey: "id",
      size: 56,
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>#{row.getValue("id")}</div>,
    },

    {
      accessorKey: "customer_name",
      size: 160,
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="max-w-[220px] truncate text-sm font-medium">
            {row.original.customer_name || "-"}
          </p>
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">
            {row.original.machine_model || row.original.contact_person || "-"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "price",
      size: 110,
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{formatPrice(row.original.price)}</div>,
    },

    {
      accessorKey: "date",
      size: 105,
      filterFn: "includesString",
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
      cell: ({ row }) => <div>{formatDate(row.original.date)}</div>,
    },
  ];

  return (
    <Card className="flex h-[500px] w-full flex-col overflow-hidden border border-slate-200/80 p-0 shadow-sm ring-1 ring-black/5 xl:h-full">
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">
                Recent Quotations
              </p>
              <p className="text-xs text-muted-foreground">
                Latest quoted machines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${base_route}/quotation`}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Badge variant="secondary" className="rounded-md">
              {quotations.length}
            </Badge>
          </div>
        </div>

        {quotations.length ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-md border border-slate-200/80 bg-background/80">
            <PageTable
            download={false}
              columns={columns}
              data={quotations}
              disableInput
              hideFooter
              height="h-full min-h-0"
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-muted-foreground">
            No recent quotations found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(date?: Date | string | null) {
  if (!date) return "-";

  const value = moment(date);
  return value.isValid() ? value.format("YYYY-MM-DD") : "-";
}

function formatPrice(price?: string | number | null) {
  if (price === undefined || price === null || price === "") return "-";

  const number = Number(String(price).replace(/[^\d.-]/g, ""));

  if (Number.isNaN(number)) {
    return String(price);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(number);
}
