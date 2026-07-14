"use client";

import { AlertTriangle, ArrowUpDown, ArrowUpRight, CalendarClock } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";

import PageTable from '@/components/app-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useChequeAlerts } from "@/hooks/use-cheque-alerts";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TriggerFirebaseForChequeAlerts } from "@/lib/triggerFirebase";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import ConfirmationDialog from "../alert-dialog";

type ChequeAlertItem = {
  id: number;
  link: string;
  date: string;
  amount: string | number;
  serial_no: string;
  customer_name: string;
  customer_owner: string;
};

export default function ChequeClearanceAlert() {
  const { info } = useChequeAlerts();
  const { base_route } = useUserDetail();

  const alerts = useMemo(
    () =>
      [...info].sort((a, b) => {
        const first = moment(a.date).valueOf();
        const second = moment(b.date).valueOf();
        return first - second;
      }),
    [info]
  );
  const previewAlerts = alerts.slice(0, 10);

  return (
    <Card className="h-full w-full overflow-hidden border border-slate-200/80 shadow-sm ring-1 ring-black/5 xl:h-[600px] p-0">
      <CardContent className="flex h-full min-h-0 flex-col p-4">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">
                Cheque Clearance Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                Overdue and next 3 days
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {alerts.length > 5 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs"
                  >
                    View All
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[86vh] overflow-hidden p-0 sm:max-w-5xl">
                  <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>Cheque Clearance Alerts</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {alerts.length} pending installments sorted by due date
                    </p>
                  </DialogHeader>
                  <div className="max-h-[calc(86vh-88px)] overflow-auto p-5">
                    <ChequeAlertsTable alerts={alerts} baseRoute={base_route} />
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Badge variant={alerts.length ? "destructive" : "secondary"} className="rounded-md">
              {alerts.length}
            </Badge>
          </div>
        </div>

        {alerts.length ? (
          <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200/80 bg-background/85">
            <ChequeAlertsTable alerts={previewAlerts} baseRoute={base_route} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed bg-background/70 p-6 text-center">
            <div>
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No cheque alerts</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pending cheques will appear here when due.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChequeAlertsTable({
  alerts,
  baseRoute,
}: {
  alerts: ChequeAlertItem[];
  baseRoute: string;
}) {

  const [selected, setSelected] = useState<null | ChequeAlertItem>(null)
  const [loading, setLoading] = useState(false)
  const { userID } = useUserDetail()


  const columns: ColumnDef<ChequeAlertItem>[] = [


    {
      accessorKey: "customer_name",
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
        <Link target="_blank" href={`/${baseRoute}${row.original.link}`} className="hover:underline">
          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-sm font-medium">
              {row.original.customer_name || "-"}
            </p>
            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
              {row.original.customer_owner || "-"}
            </p>
          </div>
        </Link>
      ),
    },
    {
      accessorKey: "serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Serial No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link target="_blank" href={`/${baseRoute}${row.original.link}`} className="hover:underline">
          <div>{row.getValue("serial_no")}</div>
        </Link>

      ),
    },
    {
      accessorKey: "amount",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{formatAmount(row.original.amount)}</div>,
    },

    {
      accessorKey: "date",
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

    {
      accessorKey: "status",
      filterFn: "includesString",
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
      cell: ({ row }) => {
        const status = getChequeStatus(row.original.date);
        return (<Badge
          variant={status.variant}
          className="whitespace-nowrap rounded-md"
        >
          {status.label}
        </Badge>)
      },
    },

    {
      id: "actions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
          >
            Action
          </Button>
        );
      },
      cell: ({ row }) => {

        const currentItem = row.original;

        return (
          <Button size={"sm"} onClick={() => setSelected(currentItem)}>Paid</Button>
        );
      },
    },

  ];

  async function handleSubmit(item: ChequeAlertItem | null) {
    if (!item?.id) return
    setLoading(true)
    try {
      await axios.put(`/${userID}/reminders/${item.id}`, { pending: false })
      toast.success("Cheque status updated")
      TriggerFirebaseForChequeAlerts()
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <PageTable
        columns={columns}
        data={alerts}
        disableInput
        hideFooter 
        height="min-h-[calc(100dvh-310px)]"/>
      <ConfirmationDialog
        description="Make sure this cheque is submitted"
        onPressCancel={() => setSelected(null)}
        onPressYes={() => handleSubmit(selected)
        }
        open={!!selected}
        title="Mark this cheque paid?"
        loading={loading}
      />
    </>
  );
}

function getChequeStatus(date: string) {
  const today = moment().startOf("day");
  const dueDate = moment(date).startOf("day");

  if (!dueDate.isValid()) {
    return { label: "-", variant: "outline" as const };
  }

  if (dueDate.isBefore(today, "day")) {
    return { label: "Overdue", variant: "destructive" as const };
  }

  if (dueDate.isSame(today, "day")) {
    return { label: "Today", variant: "secondary" as const };
  }

  const daysLeft = dueDate.diff(today, "days");
  return {
    label: `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`,
    variant: "outline" as const,
  };
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  const value = moment(date);
  return value.isValid() ? value.format("YYYY-MM-DD") : "-";
}

function formatAmount(amount?: string | number | null) {
  if (amount === undefined || amount === null || amount === "") return "-";

  const number = Number(String(amount).replace(/[^\d.-]/g, ""));

  if (Number.isNaN(number)) {
    return String(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(number);
}
