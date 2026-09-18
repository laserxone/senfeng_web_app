"use client";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import PageTable from "@/components/shared/tables/app-table";
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data";
import { CustomerMachines } from "@/components/features/machines/customer-machines";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/shared/search/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer, PartTradeIn, PartsReceiving } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpDown,
  ClipboardPlus,
  FileText,
  PackageCheck,
  Send,
  Wrench,
} from "lucide-react";
import moment from "moment";
import { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ReceiptRow = PartsReceiving & {
  china_part_id: number | null;
  send_to_china: boolean | null;
  sent_to_china_at: string | null;
  received_from_china_at: string | null;
  trade_in_id: number | null;
  trade_in_part_name: string | null;
  trade_in_part_model: string | null;
  trade_in_part_qty: number | null;
  trade_in_part_serial: string | null;
  trade_in_warranty_status: string | null;
  trade_in_delivered_by: string | null;
  trade_in_delivery_date: string | null;
  trade_in_remarks: string | null;
  customer_name: string;
  customer_contact: string | string[] | null;
  customer_location: string | null;
  linked_sale_serial: string | null;
  linked_sale_power: string | null;
  linked_sale_source: string | null;
  lab_tasks: Array<{
    id: number;
    status: string | null;
    priority: string | null;
    charges: number | string | null;
    assign_date: string | null;
    deliver_date: string | null;
    user_id: number | null;
    user_name: string | null;
  }>;
};

type ReceiptForm = {
  customer_id: number | null;
  sale_id: number | null;
  manual_machine_order_no: string;
  manual_machine_serial: string;
  manual_machine_model: string;
  part_name: string;
  part_model: string;
  part_qty: string;
  part_problem: string;
  normal: boolean;
  damaged: boolean;
  incomplete: boolean;
  accessories: boolean;
  overheated: boolean;
  non_repairable: boolean;
  physically_broken: boolean;
  water_damage: boolean;
  previously_repaired: boolean;
  other_condition: string;
  part_serial: string;
  warranty_status: string;
  part_accessories: string;
  delivery_method: string;
  received_by_id: number | null;
  receiving_date: Date | undefined;
  expected_return: Date | undefined;
};

const emptyForm: ReceiptForm = {
  customer_id: null,
  sale_id: null,
  manual_machine_order_no: "",
  manual_machine_serial: "",
  manual_machine_model: "",
  part_name: "",
  part_model: "",
  part_qty: "1",
  part_problem: "",
  normal: false,
  damaged: false,
  incomplete: false,
  accessories: false,
  overheated: false,
  non_repairable: false,
  physically_broken: false,
  water_damage: false,
  previously_repaired: false,
  other_condition: "",
  part_serial: "",
  warranty_status: "unknown",
  part_accessories: "",
  delivery_method: "",
  received_by_id: null,
  receiving_date: new Date(),
  expected_return: undefined,
};

const receivePartSchema = z
  .object({
    customer_id: z.number().int().positive("Customer is required"),
    company_name: z.string().min(1, "Company name is required"),
    customer_name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(1, "Phone number is required"),
    salesperson: z.string().min(1, "Salesperson is required"),
    city: z.string().min(1, "City is required"),
    sale_id: z.number().int().positive().nullable(),
    manual_machine_order_no: z.string(),
    manual_machine_model: z.string(),
    manual_machine_serial: z.string(),
    part_name: z.string().min(1, "Part name is required"),
    part_model: z.string().min(1, "Part model is required"),
    part_qty: z.coerce
      .number<number>()
      .positive("Quantity must be greater than zero"),
    part_serial: z.string(),
    warranty_status: z.string().min(1, "Warranty status is required"),
    part_problem: z.string().min(1, "Reported problem is required"),
    image: z.string().min(1, "At least one attachment is required"),
    normal: z.boolean(),
    damaged: z.boolean(),
    incomplete: z.boolean(),
    accessories: z.boolean(),
    overheated: z.boolean(),
    non_repairable: z.boolean(),
    physically_broken: z.boolean(),
    water_damage: z.boolean(),
    previously_repaired: z.boolean(),
    other_selected: z.boolean(),
    other_condition: z.string(),
    delivery_method: z.string().min(1, "Delivery method is required"),
    received_by_id: z.number().int().positive("Received by is required"),
    assigned_to: z.number().int().positive("Assigned to is required"),
    priority: z.enum(["normal", "urgent", "critical"]),
    receiving_date: z.date({ error: "Receiving date is required" }),
    expected_return: z.date({ error: "Expected return date is required" }),
    estimated_expenses: z.coerce
      .number<number>()
      .min(0, "Estimated expenses are required"),
  })
  .superRefine((data, ctx) => {
    if (
      !data.normal &&
      !data.damaged &&
      !data.incomplete &&
      !data.accessories &&
      !data.overheated &&
      !data.non_repairable &&
      !data.physically_broken &&
      !data.water_damage &&
      !data.previously_repaired &&
      !data.other_selected
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["normal"],
        message: "Select at least one receiving condition",
      });
    }

    if (data.other_selected && !data.other_condition.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_condition"],
        message: "Describe the other condition",
      });
    }

    if (!data.sale_id) {
      for (const field of [
        "manual_machine_order_no",
        "manual_machine_model",
        "manual_machine_serial",
      ] as const) {
        if (!data[field].trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: "Manual machine information is required",
          });
        }
      }
    }

    if (data.warranty_status !== "in_warranty" && data.estimated_expenses < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimated_expenses"],
        message:
          "Estimated expenses must be at least 1 for unknown or out-of-warranty parts",
      });
    }
  });

type ReceivePartValidation = z.infer<typeof receivePartSchema>;

function dateValue(value: string | null) {
  return value ? new Date(value) : undefined;
}

function receiptToForm(receipt: ReceiptRow): ReceiptForm {
  return {
    customer_id: receipt.customer_id,
    sale_id: receipt.sale_id,
    manual_machine_order_no: receipt.manual_machine_order_no ?? "",
    manual_machine_serial: receipt.manual_machine_serial ?? "",
    manual_machine_model: receipt.manual_machine_model ?? "",
    part_name: receipt.part_name,
    part_model: receipt.part_model ?? "",
    part_qty: String(receipt.part_qty),
    part_problem: receipt.part_problem ?? "",
    normal: receipt.normal,
    damaged: receipt.damaged,
    incomplete: receipt.incomplete,
    accessories: receipt.accessories,
    overheated: receipt.overheated,
    non_repairable: receipt.non_repairable,
    physically_broken: receipt.physically_broken,
    water_damage: receipt.water_damage,
    previously_repaired: receipt.previously_repaired,
    other_condition: receipt.other_condition ?? "",
    part_serial: receipt.part_serial ?? "",
    warranty_status: receipt.warranty_status,
    part_accessories: receipt.part_accessories ?? "",
    delivery_method: receipt.delivery_method ?? "",
    received_by_id: receipt.received_by_id,
    receiving_date: dateValue(receipt.receiving_date),
    expected_return: dateValue(receipt.expected_return),
  };
}

export default function PartsReceivingPage() {
  const { userID } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const office = `/${officeState.value.data || "lahore"}`;
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ReceiptRow | null>(null);
  const [pdfReceiptId, setPdfReceiptId] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("pr");

  const selectedReceiptDetail = useMemo(
    () => rows.find((item) => String(item.id) === receiptId) ?? null,
    [receiptId, rows],
  );

  function updateReceiptParam(id?: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("pr", String(id));
    else params.delete("pr");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function refresh(): Promise<ReceiptRow[]> {
    if (!userID) return [];
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/parts-receiving`, {
        office,
      });
      setRows(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userID, office]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const hasActiveTask = item.lab_tasks?.some(
        (task) => task.status !== "completed",
      );
      const task = item.lab_tasks?.[0];
      if (priorityFilter !== "all" && task?.priority !== priorityFilter)
        return false;
      if (warrantyFilter !== "all" && item.warranty_status !== warrantyFilter)
        return false;
      if (staffFilter !== "all" && String(task?.user_id) !== staffFilter)
        return false;
      if (dateFilter === "overdue") {
        return Boolean(
          hasActiveTask &&
          item.expected_return &&
          new Date(item.expected_return) < new Date(),
        );
      }
      if (dateFilter === "next_7_days") {
        const expected = item.expected_return
          ? new Date(item.expected_return)
          : null;
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        return Boolean(expected && expected >= now && expected <= nextWeek);
      }
      return true;
    });
  }, [dateFilter, priorityFilter, rows, staffFilter, warrantyFilter]);

  const staffOptions = useMemo(
    () =>
      Array.from(
        new Map(
          rows
            .flatMap((receipt) => receipt.lab_tasks ?? [])
            .filter(
              (
                task,
              ): task is typeof task & { user_id: number; user_name: string } =>
                Boolean(task.user_id && task.user_name),
            )
            .map((task) => [
              task.user_id,
              { id: task.user_id, name: task.user_name },
            ]),
        ).values(),
      ),
    [rows],
  );

  const summary = useMemo(() => {
    const active = (receipt: ReceiptRow) =>
      receipt.lab_tasks?.some((task) => task.status !== "completed");
    return {
      total: rows.length,
      pending: rows.filter(active).length,
      china: rows.filter(
        (item) => item.sent_to_china_at && !item.received_from_china_at,
      ).length,
      overdue: rows.filter(
        (item) =>
          active(item) &&
          item.expected_return &&
          new Date(item.expected_return) < new Date(),
      ).length,
      traded: rows.filter((item) => item.trade_in_id).length,
      chinaPending: rows.filter(
        (item) => item.send_to_china && !item.sent_to_china_at,
      ).length,
      chinaReceived: rows.filter((item) => item.received_from_china_at).length,
      repaired: rows.filter((item) =>
        item.lab_tasks?.some((task) => task.status === "completed"),
      ).length,
    };
  }, [rows]);

  const openReceiptPdf = async (receipt: ReceiptRow) => {
    if (pdfReceiptId !== null) return;
    setPdfReceiptId(receipt.id);
    const labTask = receipt.lab_tasks?.[0];
    try {
      const response = await axios.post(
        `/${userID}/parts-receiving/pdf`,
        {
          data: {
            receiptId: receipt.id,
            receiptNumber: receipt.receipt_number,
            customerName: receipt.customer_name,
            customerContact: Array.isArray(receipt.customer_contact)
              ? receipt.customer_contact.join(", ")
              : receipt.customer_contact || "",
            customerLocation: receipt.customer_location || "",
            machine:
              receipt.linked_sale_serial ||
              receipt.manual_machine_serial ||
              receipt.manual_machine_order_no ||
              "Manual machine",
            machineModel:
              receipt.linked_sale_power || receipt.manual_machine_model || "",
            partName: receipt.part_name,
            partModel: receipt.part_model || "",
            partQty: receipt.part_qty,
            partSerial: receipt.part_serial || "",
            warrantyStatus: formatWarranty(receipt.warranty_status),
            conditions: conditionLabels(receipt),
            accessories: receipt.part_accessories || "None recorded",
            problem: receipt.part_problem || "No problem description recorded.",
            deliveredBy: receipt.delivery_method || "",
            receivedBy: receipt.received_by_id
              ? `Staff #${receipt.received_by_id}`
              : "",
            receivingDate: receipt.receiving_date,
            assignedTo: labTask?.user_name || "Unassigned",
            priority: labTask?.priority || "Normal",
            expectedReturn: receipt.expected_return,
            estimatedExpenses: labTask?.charges,
          },
        },
        { office, responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch {
      toast.error("Unable to prepare the parts receiving note PDF");
    } finally {
      setPdfReceiptId(null);
    }
  };

  const sortableHeader =
    (title: string) =>
    ({
      column,
    }: {
      column: {
        getIsSorted: () => false | "asc" | "desc";
        toggleSorting: (descending?: boolean) => void;
      };
    }) => (
      <Button
        variant="ghost"
        className="h-8 px-0 text-[11px] font-bold tracking-wide text-slate-700 uppercase hover:bg-transparent dark:text-zinc-200"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {title}
        <ArrowUpDown className="ml-2 size-3.5" />
      </Button>
    );

  const columns: ColumnDef<ReceiptRow>[] = [
    {
      id: "receipt",
      header: sortableHeader("Part receipt ID"),
      accessorFn: (item) => item.receipt_number,
      size: 130,
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.receipt_number}</span>
      ),
    },
    {
      id: "customer",
      header: sortableHeader("Company / Customer"),
      accessorFn: (item) =>
        `${item.customer_name} ${item.customer_location ?? ""}`,
      size: 190,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium break-words">
            {row.original.customer_name}
          </p>
          <p className="text-[11px] break-words text-muted-foreground">
            {row.original.customer_location || "—"}
          </p>
        </div>
      ),
    },
    {
      id: "part",
      header: sortableHeader("Part name & no."),
      accessorFn: (item) => `${item.part_name} ${item.part_model ?? ""}`,
      size: 180,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium break-words">{row.original.part_name}</p>
          <p className="text-[11px] break-words text-muted-foreground">
            {row.original.part_model || "No model"}
          </p>
        </div>
      ),
    },
    {
      id: "condition",
      header: sortableHeader("Condition"),
      accessorFn: (item) => conditionLabels(item).join(", "),
      size: 240,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-wrap gap-1">
          {conditionLabels(row.original).map((label) => (
            <ConditionBadge key={label} value={label} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: "warranty_status",
      header: sortableHeader("Warranty"),
      size: 135,
      cell: ({ row }) => (
        <StatusBadge value={formatWarranty(row.original.warranty_status)} />
      ),
    },
    {
      id: "priority",
      header: sortableHeader("Priority"),
      accessorFn: (item) => item.lab_tasks?.[0]?.priority ?? "",
      size: 110,
      cell: ({ row }) => (
        <StatusBadge value={row.original.lab_tasks?.[0]?.priority || "—"} />
      ),
    },
    {
      id: "status",
      header: sortableHeader("Status"),
      accessorFn: receiptStatus,
      size: 125,
      cell: ({ row }) => <StatusBadge value={receiptStatus(row.original)} />,
    },
    {
      id: "assigned",
      header: sortableHeader("Assigned to"),
      accessorFn: (item) => item.lab_tasks?.[0]?.user_name ?? "",
      size: 145,
      cell: ({ row }) => (
        <span className="break-words">
          {row.original.lab_tasks?.[0]?.user_name || "—"}
        </span>
      ),
    },
    {
      id: "expected_return",
      header: sortableHeader("Expected return"),
      accessorFn: (item) => item.expected_return ?? "",
      size: 135,
      cell: ({ row }) =>
        row.original.expected_return
          ? moment(row.original.expected_return).format("DD MMM YYYY")
          : "—",
    },
    {
      id: "charges",
      header: sortableHeader("Charges"),
      accessorFn: (item) => item.lab_tasks?.[0]?.charges ?? "",
      size: 110,
      cell: ({ row }) => (
        <span>
          Rs.{" "}
          {Number(row.original.lab_tasks?.[0]?.charges ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "total_paid",
      header: sortableHeader("Total paid"),
      accessorFn: () => "",
      size: 110,
      cell: () => <span className="text-muted-foreground">—</span>,
    },
    {
      id: "actions",
      header: "Actions",
      size: 110,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg px-2.5 bg-destructive text-white"
          disabled={pdfReceiptId !== null}
          onClick={(event) => {
            event.stopPropagation();
            openReceiptPdf(row.original);
          }}
        >
          {pdfReceiptId === row.original.id ? (
            <Spinner className="size-3.5" />
          ) : (
            <FileText className="size-3.5" />
          )}
          <span className="sr-only">Open PDF</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 pb-2">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-lg font-semibold">Parts Receiving</h1>
          <p className="text-sm text-muted-foreground">
            Track received customer parts before lab repair.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Parts in System"
          value={summary.total}
          tone="blue"
        />
        <SummaryCard
          label="Pending Repairs"
          value={summary.pending}
          tone="orange"
        />
        <SummaryCard
          label="Currently in China"
          value={summary.china}
          tone="blue"
        />
        <SummaryCard
          label="Overdue Returns"
          value={summary.overdue}
          tone="red"
        />
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2.5 shadow-sm">
        <Button
          onClick={() => {
            setSelected(null);
            setDialogOpen(true);
          }}
        >
          <ClipboardPlus className="mr-2 size-4" />
          Receive Part
        </Button>
        <SummaryPill label="Traded Parts" value={summary.traded} />
        <SummaryPill label="Parts to China" value={summary.chinaPending} />
        <SummaryPill label="Parts from China" value={summary.chinaReceived} />
        <SummaryPill label="Parts to Repair" value={summary.pending} />
        <SummaryPill label="Repaired Parts" value={summary.repaired} />
      </div>
      <PageTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        tableWidth="min-w-[1800px]"
        onRowClick={(receipt, event) => {
          if ((event.target as HTMLElement).closest("button, a, input, select"))
            return;
          updateReceiptParam(receipt.id);
        }}
      >
        <div className="w-40">
          <FormSelect
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            options={[
              { value: "all", label: "Priority: All" },
              { value: "normal", label: "Normal" },
              { value: "urgent", label: "Urgent" },
              { value: "critical", label: "Critical" },
            ]}
          />
        </div>
        <div className="w-40">
          <FormSelect
            value={warrantyFilter}
            onValueChange={setWarrantyFilter}
            options={[
              { value: "all", label: "Warranty: All" },
              { value: "in_warranty", label: "In warranty" },
              { value: "out_of_warranty", label: "Out of warranty" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
        </div>
        <div className="w-40">
          <FormSelect
            value={dateFilter}
            onValueChange={setDateFilter}
            options={[
              { value: "all", label: "Date: All" },
              { value: "overdue", label: "Overdue returns" },
              { value: "next_7_days", label: "Next 7 days" },
            ]}
          />
        </div>
        <div className="w-40">
          <FormSelect
            value={staffFilter}
            onValueChange={setStaffFilter}
            options={[
              { value: "all", label: "Assigned: All" },
              ...staffOptions.map((task) => ({
                value: String(task.id),
                label: task.name,
              })),
            ]}
          />
        </div>
      </PageTable>

      <ReceiptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        receipt={selected}
        onSaved={refresh}
      />
      <ReceiptDetailDialog
        open={Boolean(selectedReceiptDetail)}
        onOpenChange={(open) => {
          if (!open) updateReceiptParam();
        }}
        receipt={selectedReceiptDetail}
        onEdit={() => {
          setSelected(selectedReceiptDetail);
          updateReceiptParam();
          setDialogOpen(true);
        }}
        onLabCreated={async () => {
          const updatedRows = await refresh();
          const updatedReceipt = updatedRows.find(
            (item) => item.id === selectedReceiptDetail?.id,
          );
          if (updatedReceipt) setSelected(updatedReceipt);
        }}
      />
    </div>
  );
}

function conditionLabels(
  receipt: Pick<
    ReceiptRow,
    | "normal"
    | "damaged"
    | "incomplete"
    | "accessories"
    | "overheated"
    | "non_repairable"
    | "physically_broken"
    | "water_damage"
    | "previously_repaired"
    | "other_condition"
  >,
) {
  return [
    [receipt.normal, "Normal"],
    [receipt.damaged, "Damaged"],
    [receipt.incomplete, "Incomplete"],
    [receipt.accessories, "Accessories"],
    [receipt.overheated, "Overheated"],
    [receipt.non_repairable, "Non-repairable"],
    [receipt.physically_broken, "Physically broken"],
    [receipt.water_damage, "Water damage"],
    [receipt.previously_repaired, "Previously repaired"],
    [Boolean(receipt.other_condition), receipt.other_condition || "Other"],
  ]
    .filter(([value]) => value)
    .map(([, label]) => label as string);
}

function formatWarranty(status: string) {
  return status === "in_warranty"
    ? "In warranty"
    : status === "out_of_warranty"
      ? "Out of warranty"
      : "Unknown";
}

function receiptStatus(receipt: ReceiptRow) {
  const task = receipt.lab_tasks?.[0];
  if (receipt.trade_in_id) return "Traded";
  if (receipt.received_from_china_at) return "Received from China";
  if (receipt.sent_to_china_at) return "Sent to China";
  if (receipt.send_to_china) return "Awaiting China dispatch";
  if (task?.status === "completed") return "Repaired";
  if (task?.status === "pending") return "Pending repair";
  if (task) return "To repair";
  return "Received";
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const color =
    normalized.includes("critical") ||
    normalized.includes("out of warranty") ||
    normalized.includes("overdue")
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
      : normalized.includes("urgent") ||
          normalized.includes("pending") ||
          normalized.includes("awaiting")
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        : normalized.includes("normal") ||
            normalized.includes("in warranty") ||
            normalized.includes("received") ||
            normalized.includes("repaired") ||
            normalized.includes("traded")
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          : normalized.includes("sent") || normalized.includes("to repair")
            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap text-[10px] ${color}`}
    >
      {value}
    </Badge>
  );
}

function ConditionBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const color =
    normalized === "normal"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      : normalized.includes("incomplete") || normalized.includes("overheated")
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300";
  return (
    <Badge
      variant="outline"
      className={`max-w-full whitespace-normal break-words text-[10px] leading-4 ${color}`}
    >
      {value}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "orange" | "red";
}) {
  const color =
    tone === "red"
      ? "text-destructive"
      : tone === "orange"
        ? "text-orange-600"
        : "text-primary";
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/20 px-3 text-xs font-medium">
      <span>{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}

function chinaStatus(receipt: ReceiptRow) {
  if (!receipt.send_to_china) return "Not sent to China";
  if (receipt.received_from_china_at) return "Received from China";
  if (receipt.sent_to_china_at) return "Sent to China";
  return "Awaiting dispatch to China";
}

function ReceiptDialog({
  open,
  onOpenChange,
  receipt,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow | null;
  onSaved: () => Promise<void>;
}) {
  const { userID, isAdmin } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const [form, setForm] = useState<ReceiptForm>(emptyForm);
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualMachine, setManualMachine] = useState(false);
  const [partSerial, setPartSerial] = useState("");
  const [phone, setPhone] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [receivedById, setReceivedById] = useState<number | null>(null);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [priority, setPriority] = useState("normal");
  const [estimatedExpenses, setEstimatedExpenses] = useState("0");
  const [sendToChina, setSendToChina] = useState(false);
  const [isTradeIn, setIsTradeIn] = useState(false);
  const [extraConditions, setExtraConditions] = useState<
    Record<string, boolean>
  >({});
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null,
  );
  const validationForm = useForm<ReceivePartValidation>({
    resolver: zodResolver(receivePartSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!open) return;
    const initialReceivedById = receipt?.received_by_id ?? userID ?? null;
    const initialForm = receipt ? receiptToForm(receipt) : emptyForm;
    setForm({ ...initialForm, received_by_id: initialReceivedById });
    setImage("");
    setManualMachine(receipt ? !receipt.sale_id : false);
    setPartSerial(receipt?.part_serial ?? "");
    setPhone(
      Array.isArray(receipt?.customer_contact)
        ? receipt.customer_contact.join(", ")
        : (receipt?.customer_contact ?? ""),
    );
    setSalesperson(receipt ? "Existing customer" : "");
    setReceivedById(initialReceivedById);
    setAssignedTo(receipt?.lab_tasks?.[0]?.user_id ?? null);
    setPriority(receipt?.lab_tasks?.[0]?.priority ?? "normal");
    setEstimatedExpenses(String(receipt?.lab_tasks?.[0]?.charges ?? 0));
    setSendToChina(false);
    setIsTradeIn(false);
    setExtraConditions({
      overheated: receipt?.overheated ?? false,
      non_repairable: receipt?.non_repairable ?? false,
      physically_broken: receipt?.physically_broken ?? false,
      water_damage: receipt?.water_damage ?? false,
      previously_repaired: receipt?.previously_repaired ?? false,
    });
    setSelectedCustomer(
      receipt
        ? ({
            id: receipt.customer_id,
            name: receipt.customer_name,
            owner: receipt.customer_name,
            label: receipt.customer_name,
            number: receipt.customer_contact,
            location: receipt.customer_location,
          } as MyCustomer)
        : null,
    );
  }, [open, receipt, userID]);

  function update<K extends keyof ReceiptForm>(key: K, value: ReceiptForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function save() {
    const validationData: ReceivePartValidation = {
      customer_id: form.customer_id || 0,
      company_name: selectedCustomer?.owner || receipt?.customer_name || "",
      customer_name: selectedCustomer?.name || receipt?.customer_name || "",
      phone,
      salesperson,
      city: selectedCustomer?.location || receipt?.customer_location || "",
      sale_id: form.sale_id,
      manual_machine_order_no: form.manual_machine_order_no,
      manual_machine_model: form.manual_machine_model,
      manual_machine_serial: form.manual_machine_serial,
      part_name: form.part_name,
      part_model: form.part_model,
      part_qty: Number(form.part_qty),
      part_serial: partSerial,
      warranty_status: form.warranty_status,
      part_problem: form.part_problem,
      image: image || receipt?.part_img || "",
      normal: form.normal,
      damaged: form.damaged,
      incomplete: form.incomplete,
      accessories: form.accessories,
      overheated: Boolean(extraConditions.overheated),
      non_repairable: Boolean(extraConditions.non_repairable),
      physically_broken: Boolean(extraConditions.physically_broken),
      water_damage: Boolean(extraConditions.water_damage),
      previously_repaired: Boolean(extraConditions.previously_repaired),
      other_selected: Boolean(extraConditions.other),
      other_condition: form.other_condition,
      delivery_method: form.delivery_method,
      received_by_id: form.received_by_id || 0,
      assigned_to: assignedTo || 0,
      priority: priority as ReceivePartValidation["priority"],
      receiving_date: form.receiving_date as Date,
      expected_return: form.expected_return as Date,
      estimated_expenses: Number(estimatedExpenses),
    };

    validationForm.reset(validationData);
    const valid = await validationForm.trigger();
    if (!valid) {
      toast.error("Complete all required fields before receiving the part.");
      return;
    }
    setSaving(true);
    try {
      let partImg = receipt?.part_img ?? null;
      if (image) {
        const office = officeState.value.data || "lahore";
        const fileName = `${office}/parts-receiving/${moment().valueOf()}.png`;
        await UploadImage(image, fileName);
        partImg = fileName;
      }
      const payload = {
        ...form,
        sale_id: form.sale_id,
        manual_machine_order_no: form.sale_id
          ? null
          : form.manual_machine_order_no,
        manual_machine_serial: form.sale_id ? null : form.manual_machine_serial,
        manual_machine_model: form.sale_id ? null : form.manual_machine_model,
        part_serial: partSerial,
        overheated: Boolean(extraConditions.overheated),
        non_repairable: Boolean(extraConditions.non_repairable),
        physically_broken: Boolean(extraConditions.physically_broken),
        water_damage: Boolean(extraConditions.water_damage),
        previously_repaired: Boolean(extraConditions.previously_repaired),
        other_condition: form.other_condition || null,
        part_qty: Number(form.part_qty),
        part_img: partImg,
        receiving_date: form.receiving_date?.toISOString(),
        expected_return: form.expected_return?.toISOString() ?? null,
        ...(receipt ? {} : { send_to_china: sendToChina }),
        ...(receipt ? {} : { is_trade_in: isTradeIn }),
        ...(receipt
          ? {
              lab_task: {
                user_id: assignedTo,
                priority,
                charges: Number(estimatedExpenses),
                remarks: form.part_problem,
                deliver_date: form.expected_return?.toISOString() ?? null,
              },
            }
          : {
              lab_task: {
                user_id: assignedTo,
                priority,
                charges: Number(estimatedExpenses || 0),
              },
            }),
      };
      if (receipt)
        await axios.put(`/${userID}/parts-receiving/${receipt.id}`, payload, {
          office: `/${officeState.value.data || "lahore"}`,
        });
      else
        await axios.post(`/${userID}/parts-receiving`, payload, {
          office: `/${officeState.value.data || "lahore"}`,
        });
      toast.success(
        receipt ? "Parts receipt updated" : "Part received successfully",
      );
      await onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to save parts receipt",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ReceivePartFormLayout
      open={open}
      onOpenChange={onOpenChange}
      receipt={receipt}
      form={form}
      update={update}
      selectedCustomer={selectedCustomer}
      setSelectedCustomer={setSelectedCustomer}
      image={image}
      onImage={handleImage}
      manualMachine={manualMachine}
      setManualMachine={setManualMachine}
      partSerial={partSerial}
      setPartSerial={setPartSerial}
      phone={phone}
      setPhone={setPhone}
      salesperson={salesperson}
      setSalesperson={setSalesperson}
      receivedById={receivedById}
      setReceivedById={setReceivedById}
      canChangeReceivedBy={isAdmin}
      assignedTo={assignedTo}
      setAssignedTo={setAssignedTo}
      priority={priority}
      setPriority={setPriority}
      estimatedExpenses={estimatedExpenses}
      setEstimatedExpenses={setEstimatedExpenses}
      sendToChina={sendToChina}
      setSendToChina={setSendToChina}
      isTradeIn={isTradeIn}
      setIsTradeIn={setIsTradeIn}
      extraConditions={extraConditions}
      setExtraConditions={setExtraConditions}
      errors={validationForm.formState.errors}
      saving={saving}
      onSave={save}
    />
  );

  /* Legacy compact layout retained temporarily for reference.
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-3xl"><DialogHeader className="border-b border-border bg-muted/40 px-4 py-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><PackageCheck className="size-4" /></span><div><DialogTitle className="text-sm font-semibold">{receipt ? "Edit Parts Receipt" : "Receive Part"}</DialogTitle><DialogDescription className="text-xs">Record the received part and its condition.</DialogDescription></div></div></DialogHeader><ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="space-y-4 p-3.5">
    <section className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2"><Field label="Customer"><CustomerSearch value={form.customer_id} onReturn={(value) => { update("customer_id", value); update("sale_id", null); }} /></Field><Field label="Sale / Machine linked"><div className="flex items-center gap-2"><Switch checked={Boolean(form.sale_id)} onCheckedChange={(checked) => { if (!checked) update("sale_id", null); }} /><span className="text-xs text-muted-foreground">{form.sale_id ? "Linked sale" : "Manual machine details"}</span></div>{form.customer_id && <CustomerMachines value={form.sale_id} customer_id={form.customer_id} onReturn={(value) => update("sale_id", value)} />}</Field>
      {!form.sale_id && <><Field label="Manual serial"><Input className="h-9 rounded-lg" value={form.sale_serial} onChange={(event) => update("sale_serial", event.target.value)} /></Field><Field label="Manual machine model"><Input className="h-9 rounded-lg" value={form.serial_model} onChange={(event) => update("serial_model", event.target.value)} /></Field></>}<Field label="Customer city"><Input className="h-9 rounded-lg" value={form.customer_city} onChange={(event) => update("customer_city", event.target.value)} /></Field></section>
    <section className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2"><Field label="Part name"><Input className="h-9 rounded-lg" value={form.part_name} onChange={(event) => update("part_name", event.target.value)} /></Field><Field label="Part model"><Input className="h-9 rounded-lg" value={form.part_model} onChange={(event) => update("part_model", event.target.value)} /></Field><Field label="Quantity"><Input type="number" min="0.01" className="h-9 rounded-lg" value={form.part_qty} onChange={(event) => update("part_qty", event.target.value)} /></Field><Field label="Part problem"><Input className="h-9 rounded-lg" value={form.part_problem} onChange={(event) => update("part_problem", event.target.value)} /></Field><Field label="Part image"><Input type="file" accept="image/*" className="h-9 rounded-lg" onChange={handleImage} />{image && <p className="text-xs text-emerald-600">New image ready to upload</p>}</Field></section>
    <section className="rounded-xl border p-3"><p className="mb-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Condition flags</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(["normal", "damaged", "incomplete", "accessories"] as const).map((field) => <label key={field} className="flex items-center justify-between rounded-lg border p-2.5 text-sm capitalize"><span>{field}</span><Switch checked={form[field]} onCheckedChange={(value) => update(field, value)} /></label>)}</div></section>
    <section className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2"><Field label="Under warranty"><div className="flex h-9 items-center gap-2"><Switch checked={form.warranty} onCheckedChange={(value) => update("warranty", value)} /><span className="text-xs text-muted-foreground">{form.warranty ? "Yes" : "No"}</span></div></Field><Field label="Warranty status"><Input className="h-9 rounded-lg" value={form.warranty_status} onChange={(event) => update("warranty_status", event.target.value)} /></Field><Field label="Accessories details"><Input className="h-9 rounded-lg" value={form.part_accessories} onChange={(event) => update("part_accessories", event.target.value)} /></Field><Field label="Delivered by"><Input className="h-9 rounded-lg" value={form.delivered_by} onChange={(event) => update("delivered_by", event.target.value)} /></Field><Field label="Received by"><Input className="h-9 rounded-lg" value={form.received_by} onChange={(event) => update("received_by", event.target.value)} /></Field><Field label="Receiver contact"><Input className="h-9 rounded-lg" value={form.received_by_contact} onChange={(event) => update("received_by_contact", event.target.value)} /></Field><Field label="Receiving date"><AppCalendar date={form.receiving_date} onChange={(value) => update("receiving_date", value)} /></Field><Field label="Expected return"><AppCalendar date={form.expected_return} onChange={(value) => update("expected_return", value)} /></Field></section>
    <Button className="h-9 w-full rounded-lg" disabled={saving} onClick={save}>{saving && <Spinner />} {receipt ? "Save Changes" : "Save Parts Receipt"}</Button>
  </div></ScrollArea></DialogContent></Dialog>;
*/
}

function ReceivePartFormLayout({
  open,
  onOpenChange,
  receipt,
  form,
  update,
  selectedCustomer,
  setSelectedCustomer,
  image,
  onImage,
  manualMachine,
  setManualMachine,
  partSerial,
  setPartSerial,
  phone,
  setPhone,
  salesperson,
  setSalesperson,
  receivedById,
  setReceivedById,
  canChangeReceivedBy,
  assignedTo,
  setAssignedTo,
  priority,
  setPriority,
  estimatedExpenses,
  setEstimatedExpenses,
  sendToChina,
  setSendToChina,
  isTradeIn,
  setIsTradeIn,
  extraConditions,
  setExtraConditions,
  errors,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow | null;
  form: ReceiptForm;
  update: <K extends keyof ReceiptForm>(key: K, value: ReceiptForm[K]) => void;
  selectedCustomer: MyCustomer | null;
  setSelectedCustomer: (customer: MyCustomer | null) => void;
  image: string;
  onImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  manualMachine: boolean;
  setManualMachine: (value: boolean) => void;
  partSerial: string;
  setPartSerial: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  salesperson: string;
  setSalesperson: (value: string) => void;
  receivedById: number | null;
  setReceivedById: (value: number | null) => void;
  canChangeReceivedBy: boolean;
  assignedTo: number | null;
  setAssignedTo: (value: number | null) => void;
  priority: string;
  setPriority: (value: string) => void;
  estimatedExpenses: string;
  setEstimatedExpenses: (value: string) => void;
  sendToChina: boolean;
  setSendToChina: (value: boolean) => void;
  isTradeIn: boolean;
  setIsTradeIn: (value: boolean) => void;
  extraConditions: Record<string, boolean>;
  setExtraConditions: (value: Record<string, boolean>) => void;
  errors: any;
  saving: boolean;
  onSave: () => Promise<void>;
}) {
  const allConditions = [
    ["damaged", "Damaged"],
    ["overheated", "Overheated"],
    ["incomplete", "Incomplete"],
    ["normal", "Normal"],
    ["non_repairable", "Non-repairable"],
    ["physically_broken", "Physically broken"],
    ["water_damage", "Water / liquid damage"],
    ["previously_repaired", "Previously repaired"],
    ["accessories", "Accessories"],
  ] as const;
  function conditionValue(key: string) {
    if (
      key === "damaged" ||
      key === "incomplete" ||
      key === "normal" ||
      key === "accessories"
    ) {
      return form[
        key as keyof Pick<
          ReceiptForm,
          "damaged" | "incomplete" | "normal" | "accessories"
        >
      ] as boolean;
    }
    return Boolean(extraConditions[key]);
  }
  function changeCondition(key: string, value: boolean) {
    if (
      key === "damaged" ||
      key === "incomplete" ||
      key === "normal" ||
      key === "accessories"
    )
      update(key, value);
    else setExtraConditions({ ...extraConditions, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[1180px]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <PackageCheck className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-sm font-semibold">
                  {receipt ? "Edit Received Part" : "Receive Part"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Add a newly received part to the system.
                </DialogDescription>
              </div>
            </div>
            <div className="hidden gap-5 text-xs sm:flex">
              <div>
                <p className="text-muted-foreground">Receiving Note No.</p>
                <p className="font-semibold">
                  {receipt ? receipt.receipt_number : "Generated on receipt"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {moment(form.receiving_date || new Date()).format(
                    "DD/MM/YYYY",
                  )}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3.5 p-3.5">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {Object.values(errors)
                  .map((error: any) => error?.message)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            <ReceiveSection
              number="1"
              title="Customer & Machine Information"
              description="Search and select an existing customer to auto-fill details."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Company name">
                  <Input
                    value={selectedCustomer?.owner || ""}
                    placeholder="Auto-filled"
                    disabled
                  />
                </Field>
                <Field label="Customer name">
                  <CustomerSearchWithData
                    value={selectedCustomer}
                    onReturn={(customer) => {
                      setSelectedCustomer(customer);
                      update("customer_id", customer.id);
                      update("sale_id", null);
                      setPhone(
                        Array.isArray(customer.number)
                          ? customer.number.join(", ")
                          : customer.number || "",
                      );
                      setSalesperson(
                        (
                          customer as MyCustomer & {
                            ownership_name?: string | null;
                          }
                        ).ownership_name || "",
                      );
                    }}
                  />
                </Field>
                <Field label="Phone number">
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="03XX XXX XXXX"
                  />
                </Field>
                <Field label="Machine order number">
                  <CustomerMachines
                    value={manualMachine ? null : form.sale_id}
                    customer_id={form.customer_id}
                    allowManualEntry
                    onManualEntry={() => {
                      setManualMachine(true);
                      update("sale_id", null);
                    }}
                    onReturn={(value) => {
                      setManualMachine(false);
                      update("sale_id", value);
                    }}
                  />
                </Field>
                {manualMachine ? (
                  <>
                    <Field label="Machine order number">
                      <Input
                        value={form.manual_machine_order_no}
                        onChange={(event) =>
                          update("manual_machine_order_no", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Machine model">
                      <Input
                        value={form.manual_machine_model}
                        onChange={(event) =>
                          update("manual_machine_model", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Machine serial number">
                      <Input
                        value={form.manual_machine_serial}
                        onChange={(event) =>
                          update("manual_machine_serial", event.target.value)
                        }
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Machine model">
                      <Input
                        placeholder="Auto-filled after selecting order"
                        disabled
                      />
                    </Field>
                    <Field label="Machine serial number">
                      <Input
                        placeholder="Auto-filled after selecting order"
                        disabled
                      />
                    </Field>
                  </>
                )}
                <Field label="Salesperson">
                  <Input
                    value={salesperson}
                    placeholder="Auto-filled"
                    disabled
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={selectedCustomer?.location || ""}
                    placeholder="Auto-filled"
                    disabled
                  />
                </Field>
              </div>
            </ReceiveSection>
            <ReceiveSection
              number="2"
              title="Part Details & Fault Description"
              description="Provide accurate information about the received part."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Part name / description">
                  <Input
                    value={form.part_name}
                    onChange={(event) =>
                      update("part_name", event.target.value)
                    }
                    placeholder="e.g. Laser source power supply"
                  />
                </Field>
                <Field label="Part no. / model">
                  <Input
                    value={form.part_model}
                    onChange={(event) =>
                      update("part_model", event.target.value)
                    }
                  />
                </Field>
                <Field label="Quantity">
                  <Input
                    type="number"
                    min="1"
                    value={form.part_qty}
                    onChange={(event) => update("part_qty", event.target.value)}
                  />
                </Field>
                <Field label="Serial number" required={false}>
                  <Input
                    value={partSerial}
                    onChange={(event) => setPartSerial(event.target.value)}
                    placeholder="If available"
                  />
                </Field>
                <Field label="Warranty status">
                  <FormSelect
                    value={form.warranty_status}
                    onValueChange={(value) => update("warranty_status", value)}
                    placeholder="Select warranty status"
                    options={[
                      { value: "unknown", label: "Unknown" },
                      { value: "in_warranty", label: "In warranty" },
                      { value: "out_of_warranty", label: "Out of warranty" },
                    ]}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Condition on receiving <RequiredStar />
                </Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {allConditions.map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs"
                    >
                      <Checkbox
                        checked={conditionValue(key)}
                        onCheckedChange={(checked) =>
                          changeCondition(key, checked === true)
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(extraConditions.other)}
                    onCheckedChange={(checked) =>
                      setExtraConditions({
                        ...extraConditions,
                        other: checked === true,
                      })
                    }
                  />
                  <Input
                    value={form.other_condition}
                    onChange={(event) =>
                      update("other_condition", event.target.value)
                    }
                    placeholder="Other condition"
                    disabled={!extraConditions.other}
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Field label="Reported problem / fault description">
                  <Textarea
                    className="min-h-28"
                    value={form.part_problem}
                    onChange={(event) =>
                      update("part_problem", event.target.value)
                    }
                    placeholder="Provide detailed notes about symptoms, errors, previous repairs, or other relevant information."
                  />
                </Field>
                <Field label="Photos / attachments">
                  <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-3 text-center">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={onImage}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Click to upload. JPG, PNG, PDF (max 10 MB each)
                    </p>
                    {image && (
                      <p className="mt-1 text-xs text-emerald-600">
                        Attachment ready
                      </p>
                    )}
                  </div>
                </Field>
              </div>
            </ReceiveSection>
            <ReceiveSection
              number="3"
              title="Logistics, Work Assignment & Cost Estimation"
              description="Assign responsibility and add cost details."
            >
              {!receipt && (
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <Checkbox
                      checked={sendToChina}
                      onCheckedChange={(checked) =>
                        setSendToChina(checked === true)
                      }
                    />
                    This part will be sent to China
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <Checkbox
                      checked={isTradeIn}
                      onCheckedChange={(checked) =>
                        setIsTradeIn(checked === true)
                      }
                    />
                    This part is a trade-in
                  </label>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Delivered by">
                  <FormSelect
                    value={form.delivery_method}
                    onValueChange={(value) => update("delivery_method", value)}
                    placeholder="Select delivery method"
                    options={[
                      { value: "Self Handover", label: "Self Handover" },
                      { value: "Courier", label: "Courier" },
                      { value: "Via Engineer", label: "Via Engineer" },
                    ]}
                  />
                </Field>
                <Field label="Received by (staff)">
                  <UserSearch
                    value={receivedById}
                    disabled={!canChangeReceivedBy}
                    onReturn={(value) => {
                      setReceivedById(value);
                      update("received_by_id", value);
                    }}
                  />
                </Field>
                <Field label="Assigned to">
                  <UserSearch value={assignedTo} onReturn={setAssignedTo} />
                </Field>
                <Field label="Priority level">
                  <FormSelect
                    value={priority}
                    onValueChange={setPriority}
                    options={[
                      { value: "normal", label: "Normal" },
                      { value: "urgent", label: "Urgent" },
                      { value: "critical", label: "Critical" },
                    ]}
                  />
                </Field>
                <Field label="Expected date of return">
                  <AppCalendar
                    date={form.expected_return}
                    onChange={(value) => update("expected_return", value)}
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() + 5),
                      )
                    }
                  />
                </Field>
                <Field label="Estimated expenses (PKR)">
                  <Input
                    type="number"
                    min="0"
                    value={estimatedExpenses}
                    onChange={(event) =>
                      setEstimatedExpenses(event.target.value)
                    }
                  />
                </Field>
              </div>
            </ReceiveSection>
            <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  className="h-9 rounded-lg"
                  disabled={saving}
                  onClick={onSave}
                >
                  {saving && <Spinner />}
                  {receipt ? "Save Receipt Changes" : "Receive Part"}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-1 border-b bg-primary/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {number}. {title}
        </p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function FormSelect({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ReceiptDetailDialog({
  open,
  onOpenChange,
  receipt,
  onEdit,
  onLabCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow | null;
  onEdit: () => void;
  onLabCreated: () => Promise<void>;
}) {
  const { userID, isAdmin, base_route } = useUserDetail();
  const router = useRouter();
  const { state: officeState } = useContext(OfficeContext)!;
  const [labDialog, setLabDialog] = useState(false);
  const [chinaDialog, setChinaDialog] = useState(false);
  const [tradeDialog, setTradeDialog] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<PartTradeIn | null>(null);

  useEffect(() => {
    async function loadTradeDetails() {
      if (!open || !receipt?.trade_in_id || !userID) {
        setTradeDetails(null);
        return;
      }
      try {
        const response = await axios.get(
          `/${userID}/parts-receiving/${receipt.id}/trade-in`,
          { office: `/${officeState.value.data || "lahore"}` },
        );
        setTradeDetails(response.data);
      } catch {
        setTradeDetails(null);
      }
    }
    loadTradeDetails();
  }, [
    open,
    receipt?.id,
    receipt?.trade_in_id,
    tradeDialog,
    userID,
    officeState.value.data,
  ]);

  if (!receipt) return null;
  const activeTask = receipt.lab_tasks?.[0];
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b bg-muted/40 px-4 py-3 pr-14 text-left">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
                <PackageCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm font-semibold">
                  Part Receipt #{receipt.receipt_number}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {receipt.customer_name} · {receipt.part_name}
                </SheetDescription>
              </div>
              <StatusBadge value={receiptStatus(receipt)} />
            </div>
          </SheetHeader>
          <div className="flex flex-wrap gap-1.5 border-b px-4 py-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-md px-2.5 text-xs"
              onClick={onEdit}
            >
              Edit Receipt
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                className="h-8 rounded-md px-2.5 text-xs"
                onClick={() => {
                  if (activeTask) {
                    router.push(
                      `/${base_route}/repairandmaintenance?r=${activeTask.id}`,
                    );
                    return;
                  }
                  setLabDialog(true);
                }}
              >
                {activeTask ? (
                  `Lab Task #${activeTask.id}`
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send to Lab
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-md px-2.5 text-xs"
              onClick={() => setChinaDialog(true)}
            >
              Manage China
            </Button>
            {receipt.is_trade_in && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-md px-2.5 text-xs"
                onClick={() => setTradeDialog(true)}
              >
                {receipt.trade_in_id ? "Edit Trade Part" : "Trade Part"}
              </Button>
            )}
          </div>
          <div className="space-y-3 p-4">
            <DetailSection title="Customer Information">
              <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                <Detail label="Customer" value={receipt.customer_name} />
                <Detail
                  label="Phone"
                  value={
                    Array.isArray(receipt.customer_contact)
                      ? receipt.customer_contact.join(", ")
                      : receipt.customer_contact || "—"
                  }
                />
                <Detail label="City" value={receipt.customer_location || "—"} />
                <Detail
                  label="Machine"
                  value={
                    receipt.linked_sale_serial ||
                    receipt.manual_machine_serial ||
                    "Manual machine"
                  }
                />
                <Detail
                  label="Machine model"
                  value={
                    receipt.linked_sale_power ||
                    receipt.manual_machine_model ||
                    "—"
                  }
                />
                <Detail
                  label="Machine source"
                  value={receipt.linked_sale_source || "—"}
                />
              </div>
            </DetailSection>
            <DetailSection title="Part & Fault Description">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Detail
                  label="Part"
                  value={`${receipt.part_name}${receipt.part_model ? ` · ${receipt.part_model}` : ""}`}
                />
                <Detail label="Quantity" value={String(receipt.part_qty)} />
                <Detail
                  label="Part serial"
                  value={receipt.part_serial || "—"}
                />
                <Detail
                  label="Warranty"
                  value={formatWarranty(receipt.warranty_status)}
                />
                <Detail
                  label="Condition"
                  value={conditionLabels(receipt).join(", ") || "Not marked"}
                />
                <Detail
                  label="Accessories"
                  value={receipt.part_accessories || "—"}
                />
              </div>
              <div className="mt-3">
                <Detail
                  label="Fault description"
                  value={receipt.part_problem || "—"}
                />
              </div>
              {receipt.part_img && (
                <div className="mt-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Attachment
                  </p>
                  <MyImgZooming
                    img={receipt.part_img}
                    className="h-24 rounded-lg border"
                  />
                </div>
              )}
            </DetailSection>
            <DetailSection title="Logistics & Assignment">
              <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                <Detail
                  label="Delivered by"
                  value={receipt.delivery_method || "—"}
                />
                <Detail
                  label="Received by"
                  value={
                    receipt.received_by_id
                      ? `Staff #${receipt.received_by_id}`
                      : "—"
                  }
                />
                <Detail
                  label="Assigned to"
                  value={activeTask?.user_name || "—"}
                />
                <Detail label="Priority" value={activeTask?.priority || "—"} />
                <Detail
                  label="Receiving date"
                  value={moment(receipt.receiving_date).format("DD MMM YYYY")}
                />
                <Detail
                  label="Expected return"
                  value={
                    receipt.expected_return
                      ? moment(receipt.expected_return).format("DD MMM YYYY")
                      : "—"
                  }
                />
              </div>
            </DetailSection>
            <DetailSection title="Cost, Repair & Tracking">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Detail label="Repair status" value={receiptStatus(receipt)} />
                <Detail
                  label="Charges"
                  value={`Rs. ${Number(activeTask?.charges ?? 0).toLocaleString()}`}
                />
                <Detail label="China status" value={chinaStatus(receipt)} />
                {receipt.send_to_china && (
                  <Detail
                    label="Sent to China"
                    value={
                      receipt.sent_to_china_at
                        ? moment(receipt.sent_to_china_at).format("DD MMM YYYY")
                        : "Awaiting dispatch"
                    }
                  />
                )}
                {receipt.received_from_china_at && (
                  <Detail
                    label="Received from China"
                    value={moment(receipt.received_from_china_at).format(
                      "DD MMM YYYY",
                    )}
                  />
                )}
                {receipt.is_trade_in && (
                  <Detail
                    label="Trade-in"
                    value={
                      receipt.trade_in_id
                        ? "Trade part sent"
                        : "Pending trade part"
                    }
                  />
                )}
              </div>
            </DetailSection>
            {(tradeDetails || receipt.trade_in_id) && (
              <DetailSection title="Trade Part Sent to Customer">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <Detail
                    label="Part"
                    value={`${tradeDetails?.part_name || receipt.trade_in_part_name || "—"}${tradeDetails?.part_model || receipt.trade_in_part_model ? ` · ${tradeDetails?.part_model || receipt.trade_in_part_model}` : ""}`}
                  />
                  <Detail
                    label="Quantity"
                    value={String(
                      tradeDetails?.part_qty ??
                        receipt.trade_in_part_qty ??
                        "—",
                    )}
                  />
                  <Detail
                    label="Part serial"
                    value={
                      tradeDetails?.part_serial ||
                      receipt.trade_in_part_serial ||
                      "—"
                    }
                  />
                  <Detail
                    label="Warranty"
                    value={formatWarranty(
                      tradeDetails?.warranty_status ||
                        receipt.trade_in_warranty_status ||
                        "unknown",
                    )}
                  />
                  <Detail
                    label="Delivered by"
                    value={
                      tradeDetails?.delivered_by ||
                      receipt.trade_in_delivered_by ||
                      "—"
                    }
                  />
                  <Detail
                    label="Delivery date"
                    value={
                      tradeDetails?.delivery_date ||
                      receipt.trade_in_delivery_date
                        ? moment(
                            tradeDetails?.delivery_date ||
                              receipt.trade_in_delivery_date,
                          ).format("DD MMM YYYY")
                        : "—"
                    }
                  />
                </div>
                {(tradeDetails?.remarks || receipt.trade_in_remarks) && (
                  <div className="mt-3">
                    <Detail
                      label="Remarks"
                      value={
                        tradeDetails?.remarks || receipt.trade_in_remarks || "—"
                      }
                    />
                  </div>
                )}
              </DetailSection>
            )}

            {/* Previous flat detail layout retained temporarily for reference.
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Customer" value={receipt.customer_name} />
                <Detail label="City" value={receipt.customer_location || "—"} />
                <Detail label="Phone" value={Array.isArray(receipt.customer_contact) ? receipt.customer_contact.join(", ") : receipt.customer_contact || "—"} />
                <Detail label="Machine" value={receipt.linked_sale_serial || receipt.manual_machine_serial || "Manual machine"} />
                <Detail label="Machine model" value={receipt.linked_sale_power || receipt.manual_machine_model || "—"} />
                <Detail label="Machine source" value={receipt.linked_sale_source || "—"} />
                <Detail
                  label="Part"
                  value={`${receipt.part_name}${receipt.part_model ? ` · ${receipt.part_model}` : ""}`}
                />
                <Detail label="Quantity" value={String(receipt.part_qty)} />
                <Detail label="Part serial" value={receipt.part_serial || "—"} />
                <Detail
                  label="Condition"
                  value={conditionLabels(receipt).join(", ") || "Not marked"}
                />
                <Detail
                  label="Warranty"
                  value={receipt.warranty_status || "Unknown"}
                />
                <Detail label="Accessories" value={receipt.part_accessories || "—"} />
                <Detail
                  label="Received by"
                  value={
                    receipt.received_by_id
                      ? `Staff #${receipt.received_by_id}`
                      : "—"
                  }
                />
                <Detail label="Delivery method" value={receipt.delivery_method || "—"} />
                <Detail label="Receiving date" value={moment(receipt.receiving_date).format("DD MMM YYYY")} />
                <Detail
                  label="Expected return"
                  value={
                    receipt.expected_return
                      ? moment(receipt.expected_return).format("DD MMM YYYY")
                      : "—"
                  }
                />
                <Detail label="China status" value={chinaStatus(receipt)} />
                <Detail label="Lab status" value={receiptStatus(receipt)} />
                <Detail label="Assigned to" value={activeTask?.user_name || "—"} />
                <Detail label="Priority" value={activeTask?.priority || "—"} />
                <Detail label="Charges" value={`Rs. ${Number(activeTask?.charges ?? 0).toLocaleString()}`} />
                {receipt.is_trade_in && (
                  <Detail
                    label="Trade-in"
                    value={
                      receipt.trade_in_id
                        ? "Trade part sent to customer"
                        : "Pending trade part"
                    }
                  />
                )}
              </div>
              <Detail label="Reported problem" value={receipt.part_problem || "—"} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-9 flex-1 rounded-lg"
                  onClick={onEdit}
                >
                  Edit Receipt
                </Button>
                <Button
                  className="h-9 flex-1 rounded-lg"
                  disabled={Boolean(activeTask)}
                  onClick={() => setLabDialog(true)}
                >
                  {activeTask ? (
                    `Active Lab Task #${activeTask.id}`
                  ) : (
                    <>
                      <Send className="mr-2 size-4" /> Send to Lab
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                className="h-9 w-full rounded-lg"
                onClick={() => setChinaDialog(true)}
              >
                Manage China Tracking
              </Button>
              {receipt.is_trade_in && (
                <Button
                  variant="outline"
                  className="h-9 w-full rounded-lg"
                  onClick={() => setTradeDialog(true)}
                >
                  {receipt.trade_in_id ? "Edit Trade Part" : "Trade Part"}
                </Button>
              )}
              */}
          </div>
        </SheetContent>
      </Sheet>
      <SendToLabDialog
        open={labDialog}
        onOpenChange={setLabDialog}
        receipt={receipt}
        onCreated={async () => {
          await onLabCreated();
          setLabDialog(false);
          onOpenChange(false);
        }}
      />
      <ChinaPartDialog
        open={chinaDialog}
        onOpenChange={setChinaDialog}
        receipt={receipt}
        onSaved={onLabCreated}
      />
      <TradeInDialog
        open={tradeDialog}
        onOpenChange={setTradeDialog}
        receipt={receipt}
        onSaved={onLabCreated}
      />
    </>
  );
}

function ChinaPartDialog({
  open,
  onOpenChange,
  receipt,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow;
  onSaved: () => Promise<void>;
}) {
  const { userID } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const [sendToChina, setSendToChina] = useState(false);
  const [sentAt, setSentAt] = useState<Date | undefined>();
  const [receivedAt, setReceivedAt] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSendToChina(Boolean(receipt.send_to_china));
    setSentAt(dateValue(receipt.sent_to_china_at));
    setReceivedAt(dateValue(receipt.received_from_china_at));
  }, [open, receipt]);

  async function save() {
    if (receivedAt && !sentAt) {
      toast.error("Add the sent-to-China date before the received date.");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `/${userID}/parts-receiving/${receipt.id}/china`,
        {
          send_to_china: sendToChina,
          sent_to_china_at: sendToChina
            ? (sentAt?.toISOString() ?? null)
            : null,
          received_from_china_at: sendToChina
            ? (receivedAt?.toISOString() ?? null)
            : null,
        },
        { office: `/${officeState.value.data || "lahore"}` },
      );
      toast.success("China tracking updated");
      await onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to update China tracking",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <PackageCheck className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold">
                China Part Tracking
              </DialogTitle>
              <DialogDescription className="text-xs">
                {receipt.part_name} · Receipt #{receipt.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-4 p-3.5">
            <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <Checkbox
                checked={sendToChina}
                onCheckedChange={(checked) => setSendToChina(checked === true)}
              />
              Send this part to China
            </label>
            {sendToChina && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sent to China date" required={false}>
                  <AppCalendar date={sentAt} onChange={setSentAt} />
                </Field>
                <Field label="Received from China date" required={false}>
                  <AppCalendar date={receivedAt} onChange={setReceivedAt} />
                </Field>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Current status:{" "}
              {chinaStatus({
                ...receipt,
                send_to_china: sendToChina,
                sent_to_china_at: sentAt?.toISOString() ?? null,
                received_from_china_at: receivedAt?.toISOString() ?? null,
              })}
            </p>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 rounded-lg"
                disabled={saving}
                onClick={save}
              >
                {saving && <Spinner />} Save Tracking
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TradeInDialog({
  open,
  onOpenChange,
  receipt,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow;
  onSaved: () => Promise<void>;
}) {
  const { userID } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const [trade, setTrade] = useState<Partial<PartTradeIn>>({
    part_qty: 1,
    warranty_status: "unknown",
    delivery_date: new Date().toISOString(),
  });
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImage("");
    async function load() {
      try {
        const response = await axios.get(
          `/${userID}/parts-receiving/${receipt.id}/trade-in`,
          { office: `/${officeState.value.data || "lahore"}` },
        );
        setTrade(
          response.data ?? {
            part_qty: 1,
            warranty_status: "unknown",
            delivery_date: new Date().toISOString(),
          },
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Unable to load trade part",
        );
      }
    }
    if (userID) load();
  }, [open, receipt.id, userID, officeState.value.data]);

  function update<K extends keyof PartTradeIn>(key: K, value: PartTradeIn[K]) {
    setTrade((current) => ({ ...current, [key]: value }));
  }

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    try {
      let partImg = trade.part_img ?? null;
      if (image) {
        const office = officeState.value.data || "lahore";
        const fileName = `${office}/part-trade-ins/${moment().valueOf()}.png`;
        await UploadImage(image, fileName);
        partImg = fileName;
      }
      await axios.put(
        `/${userID}/parts-receiving/${receipt.id}/trade-in`,
        {
          ...trade,
          part_img: partImg,
          part_qty: Number(trade.part_qty),
          delivery_date: trade.delivery_date,
        },
        { office: `/${officeState.value.data || "lahore"}` },
      );
      toast.success("Trade part saved");
      await onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to save trade part",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <PackageCheck className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold">
                Trade Part
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send a replacement part to {receipt.customer_name}. Machine and
                customer remain linked to receipt #{receipt.id}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-4 p-3.5">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p>{receipt.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Machine</p>
                <p>
                  {receipt.linked_sale_serial ||
                    receipt.manual_machine_serial ||
                    "Manual machine"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Part name / description">
                <Input
                  value={trade.part_name ?? ""}
                  onChange={(event) => update("part_name", event.target.value)}
                />
              </Field>
              <Field label="Part no. / model">
                <Input
                  value={trade.part_model ?? ""}
                  onChange={(event) => update("part_model", event.target.value)}
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  min="1"
                  value={trade.part_qty ?? 1}
                  onChange={(event) =>
                    update("part_qty", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="Serial number" required={false}>
                <Input
                  value={trade.part_serial ?? ""}
                  onChange={(event) =>
                    update("part_serial", event.target.value)
                  }
                />
              </Field>
              <Field label="Warranty status">
                <FormSelect
                  value={trade.warranty_status ?? "unknown"}
                  onValueChange={(value) => update("warranty_status", value)}
                  options={[
                    { value: "unknown", label: "Unknown" },
                    { value: "in_warranty", label: "In warranty" },
                    { value: "out_of_warranty", label: "Out of warranty" },
                  ]}
                />
              </Field>
              <Field label="Delivered by">
                <FormSelect
                  value={trade.delivered_by ?? ""}
                  onValueChange={(value) => update("delivered_by", value)}
                  placeholder="Select delivery method"
                  options={[
                    { value: "Self Handover", label: "Self Handover" },
                    { value: "Courier", label: "Courier" },
                    { value: "Via Engineer", label: "Via Engineer" },
                  ]}
                />
              </Field>
              <Field label="Delivery date">
                <AppCalendar
                  date={dateValue(trade.delivery_date ?? null)}
                  onChange={(value) =>
                    update("delivery_date", value?.toISOString() ?? "")
                  }
                />
              </Field>
              <Field label="Photos / attachments" required={false}>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={selectImage}
                />
              </Field>
              <Field label="Remarks" required={false}>
                <Textarea
                  value={trade.remarks ?? ""}
                  onChange={(event) => update("remarks", event.target.value)}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 rounded-lg"
                disabled={saving}
                onClick={save}
              >
                {saving && <Spinner />} Save Trade Part
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SendToLabDialog({
  open,
  onOpenChange,
  receipt,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptRow;
  onCreated: () => Promise<void>;
}) {
  const { userID } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const [userId, setUserId] = useState<number | null>(null);
  const [priority, setPriority] = useState("normal");
  const [assignDate, setAssignDate] = useState<Date | undefined>(new Date());
  const [deliverDate, setDeliverDate] = useState<Date | undefined>();
  const [charges, setCharges] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!userId || !assignDate || !deliverDate || !remarks) {
      toast.error("Assignment dates, engineer, and remarks are required.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`/${userID}/lab`, {
        customer_id: receipt.customer_id,
        parts_receiving_id: receipt.id,
        user_id: userId,
        priority,
        assign_date: assignDate.toISOString(),
        deliver_date: deliverDate.toISOString(),
        charges: Number(charges || 0),
        remarks,
        managing_office: officeState.value.data || "lahore",
      });
      toast.success("Lab task created");
      await onCreated();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to create lab task",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Wrench className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold">
                Send Part to Lab
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create a repair task for {receipt.part_name}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5">
            <Field label="Assign to">
              <UserSearch value={userId} onReturn={setUserId} />
            </Field>
            <Field label="Priority">
              <select
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Assigned date">
              <AppCalendar date={assignDate} onChange={setAssignDate} />
            </Field>
            <Field label="Expected delivery">
              <AppCalendar date={deliverDate} onChange={setDeliverDate} />
            </Field>
            <Field label="Repair charges">
              <Input
                type="number"
                min="0"
                className="h-9 rounded-lg"
                value={charges}
                onChange={(event) => setCharges(event.target.value)}
              />
            </Field>
            <Field label="Repair remarks">
              <Textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Describe the repair work required"
              />
            </Field>
            <Button
              className="h-9 w-full rounded-lg"
              disabled={saving}
              onClick={submit}
            >
              {saving && <Spinner />} Create Lab Task
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  required = true,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label} {required && <RequiredStar />}
      </Label>
      {children}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
          <PackageCheck className="size-3" />
        </span>
        <p className="text-[10px] font-semibold tracking-[0.1em] text-foreground uppercase">
          {title}
        </p>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-border/60 pl-2.5 first:border-l-0 first:pl-0">
      <p className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-semibold leading-4 text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}
