"use client";

import PageTable from "@/components/shared/tables/app-table";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import AddBackupPartDialog from "@/components/features/machines/add-backup-part-dialog";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Box,
  Clock3,
  MoreVertical,
  Package,
  Plus,
  UserRound,
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type BackupPartStatus = "in_stock" | "given_to_customer";

export type BackupApplicationStatus =
  "pending" | "approved" | "rejected" | "issued" | "returned";

type BackupDetail = {
  id: number;
  name: string;
  date_of_delivery: string | null;
  amount: number | null;
  shipment_name: string | null;
  image: string | null;
  expected_return_date: string | null;
  user_id: number;
  status: BackupApplicationStatus | string;
  issued: boolean;
  issue_date: string | null;
  actual_return_date: string | null;
  hierarchy_id: number | null;
  current_approver_order: number;
  created_at: string;
  updated_at: string;
  sale_id: number | null;
  backup_inventory_id: number | null;
  customer_name: string;
  user_name: string;
};

interface BackupPart {
  id: number;
  name: string;
  power: string;
  serial_no: string;
  size: string;
  created_at: string | Date;
  backup_application_detail: null | BackupDetail;
  status: BackupPartStatus;
  image: string | null;
}

type BackupPartTableRow = BackupPart & {
  part_name_display: string;
  serial_display: string;
  image_display: string;
  power_display: string;
  size_display: string;
  status_label: string;
  customer_machine: string;
  issue_date_display: string;
  expected_return_display: string;
  actual_return_display: string;
};

function getColumns({
  actionLoadingId,
  onIssueItem,
  onReceiveBack,
}: {
  actionLoadingId: number | null;
  onIssueItem: (part: BackupPartTableRow) => void;
  onReceiveBack: (part: BackupPartTableRow) => void;
}): ColumnDef<BackupPartTableRow>[] {
  return [
    {
      accessorKey: "part_name_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Part Name
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {row.original.part_name_display}
        </div>
      ),
    },
    {
      accessorKey: "image_display",
      filterFn: "includesString",
      header: () => <div className="px-2">Image</div>,
      cell: ({ row }) => {
        const image = row.original.image;

        if (!image) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div
            className="flex h-12 w-20 items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <MyImgZooming
              img={image}
              compact
              className="max-h-12 rounded-md object-contain"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "serial_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Serial Number
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {row.original.serial_display}
        </span>
      ),
    },
    {
      accessorKey: "power_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Power
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "size_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Size
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "status_label",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <StatusBadge part={row.original} />,
    },
    {
      accessorKey: "customer_machine",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer / Machine
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const detail = row.original.backup_application_detail;

        if (!detail?.customer_name && !detail?.name) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900">
              {detail?.customer_name || "-"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Machine: {detail?.name || "-"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "issue_date_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sending Time
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <DateTimeCell
          value={row.original.backup_application_detail?.issue_date}
        />
      ),
    },
    {
      accessorKey: "expected_return_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expected Return
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <DateTimeCell
          value={row.original.backup_application_detail?.expected_return_date}
          danger={isPartOverdue(row.original)}
        />
      ),
    },
    {
      accessorKey: "actual_return_display",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Actual Return
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <DateTimeCell
          value={row.original.backup_application_detail?.actual_return_date}
          success={Boolean(
            row.original.backup_application_detail?.actual_return_date,
          )}
        />
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const part = row.original;
        const detail = part.backup_application_detail;

        if (!detail || detail.actual_return_date) {
          return <div className="text-center text-muted-foreground">-</div>;
        }

        const isLoading = actionLoadingId === detail.id;
        const isIssued = Boolean(detail.issued || detail.issue_date);

        return (
          <div className="flex justify-center">
            <Button
              type="button"
              variant={isIssued ? "outline" : "default"}
              size="sm"
              className="h-8 gap-2 whitespace-nowrap"
              disabled={isLoading}
              onClick={(event) => {
                event.stopPropagation();
                // if (detail.status !== 'approved') {
                //     toast.error("Request is not approved yet")
                //     return
                // }
                if (isIssued) {
                  onReceiveBack(part);
                } else {
                  onIssueItem(part);
                }
              }}
            >
              {isLoading ? <Spinner /> : <MoreVertical className="h-4 w-4" />}
              {isIssued ? "Receive Back" : "Issue Item"}
            </Button>
          </div>
        );
      },
    },
  ];
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return moment(value).format("YYYY-MM-DD");
}

function isPartOverdue(part: BackupPart) {
  if (
    getPartStatus(part) !== "given_to_customer" ||
    !part.backup_application_detail?.expected_return_date
  ) {
    return false;
  }

  return (
    new Date(part.backup_application_detail.expected_return_date).getTime() <
    Date.now()
  );
}

function getPartName(part: BackupPart) {
  return part.name || "-";
}

function getPartSerial(part: BackupPart) {
  return part.serial_no || "-";
}

function getPartStatus(part: BackupPart): BackupPartStatus {
  return part.status || "in_stock";
}

function getPartPower(part: BackupPart) {
  return part.power || "-";
}

function getPartSize(part: BackupPart) {
  return part.size || "-";
}

function getStatusLabel(part: BackupPart) {
  if (isPartOverdue(part)) return "Overdue";
  if (getPartStatus(part) === "in_stock") return "In Stock";
  return "Given to Customer";
}

export default function BackupPartsPage() {
  const [parts, setParts] = useState<BackupPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const { userID } = useUserDetail();
  const [statusFilter, setStatusFilter] = useState<
    "all" | BackupPartStatus | "overdue"
  >("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (userID) fetchData();
  }, [userID]);

  async function fetchData() {
    if (!userID) return;

    setLoading(true);
    setParts([]);

    try {
      const response = await axios.get(`/${userID}/backup-parts`);
      setParts(Array.isArray(response.data) ? response.data : []);
    } finally {
      setLoading(false);
    }
  }

  async function updateBackupApplication(
    detailId: number,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!userID) return;

    setActionLoadingId(detailId);

    try {
      await axios.put(`/${userID}/backup-applications/${detailId}`, payload);
      await fetchData();
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update backup application.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleIssueItem(part: BackupPartTableRow) {
    const detailId = part.backup_application_detail?.id;
    if (!detailId) return;

    updateBackupApplication(
      detailId,
      {
        issue_date: new Date().toISOString(),
        issued: true,
        status: "issued",
      },
      "Backup item issued.",
    );
  }

  function handleReceiveBack(part: BackupPartTableRow) {
    const detailId = part.backup_application_detail?.id;
    if (!detailId) return;

    updateBackupApplication(
      detailId,
      {
        return_date: new Date().toISOString(),
        actual_return_date: new Date().toISOString(),
        issued: false,
        backup_inventory_id: null,
      },
      "Backup item received back.",
    );
  }

  const stats = useMemo(() => {
    const total = parts.length;
    const inStock = parts.filter(
      (part) => getPartStatus(part) === "in_stock",
    ).length;
    const givenToCustomers = parts.filter(
      (part) =>
        getPartStatus(part) === "given_to_customer" &&
        !part.backup_application_detail?.actual_return_date,
    ).length;
    const overdue = parts.filter(isPartOverdue).length;

    return {
      total,
      inStock,
      givenToCustomers,
      overdue,
    };
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "overdue"
            ? isPartOverdue(part)
            : getPartStatus(part) === statusFilter;

      return matchesStatus;
    });
  }, [parts, statusFilter]);

  const tableData = useMemo<BackupPartTableRow[]>(() => {
    return filteredParts.map((part) => {
      const detail = part.backup_application_detail;
      const issueDate = detail?.issue_date;
      const expectedReturn = detail?.expected_return_date;
      const actualReturn = detail?.actual_return_date;

      return {
        ...part,
        part_name_display: getPartName(part),
        serial_display: getPartSerial(part),
        image_display: part.image || "",
        power_display: getPartPower(part),
        size_display: getPartSize(part),
        status_label: getStatusLabel(part),
        customer_machine: [detail?.customer_name, detail?.name]
          .filter(Boolean)
          .join(" "),
        issue_date_display: formatDateTime(issueDate),
        expected_return_display: formatDateTime(expectedReturn),
        actual_return_display: formatDateTime(actualReturn),
      };
    });
  }, [filteredParts]);

  const columns = useMemo(
    () =>
      getColumns({
        actionLoadingId,
        onIssueItem: handleIssueItem,
        onReceiveBack: handleReceiveBack,
      }),
    [actionLoadingId, userID],
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <Heading
            panel
            title="Backup Parts"
            description="Manage and track all backup parts inventory and movements."
          />

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Backup Part
          </Button>
        </div>

        <div className="grid border-t bg-muted/20 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <StatCard
            label="Total Backup Parts"
            value={stats.total}
            description="All backup parts"
            icon={<Package className="h-5 w-5" />}
            variant="blue"
          />
          <StatCard
            label="In Stock"
            value={stats.inStock}
            description="Ready to use"
            icon={<Box className="h-5 w-5" />}
            variant="green"
          />
          <StatCard
            label="Given to Customers"
            value={stats.givenToCustomers}
            description="Currently assigned"
            icon={<UserRound className="h-5 w-5" />}
            variant="orange"
          />
          <StatCard
            label="Overdue Returns"
            value={stats.overdue}
            description="Require attention"
            icon={<Clock3 className="h-5 w-5" />}
            variant="red"
          />
        </div>
      </section>

      <PageTable
        tableWidth="w-[calc(100dvw-30px)]"
        loading={loading}
        columns={columns}
        data={tableData}
        defaultPageSize={50}
        pageSizeOptions={[25, 50, 100, 200]}
        height="min-h-[calc(100dvh-360px)]"
        onRowClick={() => {}}
      >
        <div className="w-full sm:w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | BackupPartStatus | "overdue")
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="given_to_customer">
                  Given to Customer
                </SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </PageTable>

      <AddBackupPartDialog
        visible={isAddDialogOpen}
        onClose={setIsAddDialogOpen}
        onRefresh={fetchData}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  variant,
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  variant: "blue" | "green" | "orange" | "red";
}) {
  const variants = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-emerald-600 dark:text-emerald-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5 xl:border-t-0 sm:[&:nth-child(2)]:border-t-0">
      <div className={`shrink-0 [&>svg]:size-4 ${variants[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-sm font-bold">{value}</span>
        </div>
        <p className="truncate text-[10px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ part }: { part: BackupPart }) {
  if (isPartOverdue(part)) {
    return (
      <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-red-700 ring-1 ring-red-200 ring-inset">
        Overdue
      </span>
    );
  }

  if (getPartStatus(part) === "in_stock") {
    return (
      <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-emerald-700 ring-1 ring-emerald-200 ring-inset">
        In Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-orange-700 ring-1 ring-orange-200 ring-inset">
      Given to Customer
    </span>
  );
}

function DateTimeCell({
  value,
  danger,
  success,
}: {
  value?: string | null;
  danger?: boolean;
  success?: boolean;
}) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span
      className={`text-xs leading-5 font-medium ${
        danger
          ? "text-red-600"
          : success
            ? "text-emerald-600"
            : "text-slate-700"
      }`}
    >
      {formatDateTime(value)}
    </span>
  );
}
