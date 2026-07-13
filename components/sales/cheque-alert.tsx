"use client";

import { AlertTriangle, ArrowUpRight, CalendarClock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useMemo } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChequeAlerts } from "@/hooks/use-cheque-alerts";
import useUserDetail from "@/hooks/use-user-detail";

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
    <Card className="h-full w-full overflow-hidden border border-slate-200/80 bg-gradient-to-br from-background via-slate-50 to-red-50/25 p-0 shadow-sm ring-1 ring-black/5 xl:h-[600px]">
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
          <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-md border border-slate-200/80 bg-background/85">
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
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100 hover:bg-slate-100">
          <TableHead className="h-9 min-w-[180px] px-4 text-xs">
            Customer
          </TableHead>
          <TableHead className="h-9 min-w-[110px] text-xs">
            Serial No
          </TableHead>
          <TableHead className="h-9 min-w-[110px] text-xs">
            Amount
          </TableHead>
          <TableHead className="h-9 min-w-[105px] text-xs">
            Date
          </TableHead>
          <TableHead className="h-9 min-w-[110px] text-xs">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {alerts.map((item) => {
          const status = getChequeStatus(item.date);

          return (
            <TableRow key={item.id} className="hover:bg-muted/30">
              <TableCell className="px-4 py-2.5">
                <Link
                  href={`/${baseRoute}${item.link}`}
                  className="block min-w-0 hover:underline"
                >
                  <p className="max-w-[190px] truncate text-sm font-medium">
                    {item.customer_name || "-"}
                  </p>
                  <p className="max-w-[190px] truncate text-xs text-muted-foreground">
                    {item.customer_owner || "-"}
                  </p>
                </Link>
              </TableCell>
              <TableCell className="py-2.5 text-sm font-medium">
                {item.serial_no || "-"}
              </TableCell>
              <TableCell className="py-2.5 text-sm font-semibold tabular-nums">
                {formatAmount(item.amount)}
              </TableCell>
              <TableCell className="py-2.5 text-sm text-muted-foreground">
                {formatDate(item.date)}
              </TableCell>
              <TableCell className="py-2.5">
                <Badge
                  variant={status.variant}
                  className="whitespace-nowrap rounded-md"
                >
                  {status.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
