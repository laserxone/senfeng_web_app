"use client";

import Dropzone from "@/components/shared/uploads/dropzone";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ComplaintPaymentDetail, ComplaintProps } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpCircle,
  CircleDollarSign,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Factory,
  Filter,
  Headphones,
  MapPin,
  MapPinOff,
  Presentation,
  Search,
  Settings2,
  ShieldCheck,
  Trash,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import { CustomerSearch } from "@/components/features/customers/components/customer-search";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/shared/search/user-search";

import { MyImgZooming } from "@/components/shared/media/img-zooming";
import { Badge } from "@/components/ui/badge";
import FilterSheet from "@/components/features/users/filter-sheet";

const formSchema = z
  .object({
    title: z.string().min(1, "Required"),
    customer_id: z.number({ message: "Required" }),
    problem: z.string().optional(),
    solution: z.string().optional(),
    category: z.string().min(1, "Required"),
    installation: z.boolean(),
    paid: z.boolean(),
    charges: z.coerce.number<number>().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paid) {
      if (!data.charges || Number(data.charges) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["charges"],
          message: "Amount is required",
        });
      }
    }
  });

const formSchemaEngineer = z.object({
  engineer_id: z.number({ message: "Engineer is required" }),
});

const formSchemaClosing = z.object({
  status: z.string().min(1, "Required"),
});

const formSchemaPayment = z.object({
  method: z.string().min(1, "Required"),
  purpose: z.string().min(1, "Required"),
  amount: z.coerce.number<number>().min(1, "Amount is required"),
  slip: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof formSchema>;
type FormValuesPayment = z.infer<typeof formSchemaPayment>;

const taskCategories: Array<{
  label: string;
  value: string;
  icon: LucideIcon;
}> = [
    { label: "Installation", value: "Installation", icon: ShieldCheck },
    { label: "Complaint", value: "Complaint", icon: Wrench },
    { label: "Overhauling", value: "Overhauling", icon: Settings2 },
    { label: "Machine Shifting", value: "Machine Shifting", icon: Truck },
    { label: "Machine Preparation", value: "Machine Preparation", icon: Factory },
    { label: "Demonstration", value: "Demonstration", icon: Presentation },
    { label: "Machine Upgradation", value: "Machine Upgradation", icon: ArrowUpCircle },
    { label: "Online Support", value: "Online Support", icon: Headphones },
  ];

export default function ComplaintSystem() {
  const [loading, setLoading] = useState(false);
  const { userID, isAdmin, complaint_assigned } = useUserDetail();

  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ComplaintProps[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [selected, setSelected] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [linkedComplaintId, setLinkedComplaintId] = useState<number | null>(null);
  const pageSize = 10;

  const [dates, setDates] = useState({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  });

  const [selectedComplaintForClose, setSelectedComplaintForClose] =
    useState<number | null>(null);

  const [selectedComplaintForEdit, setSelectedComplaintForEdit] =
    useState<ComplaintProps | null>(null);

  const [selectedComplaintForPayment, setSelectedComplaintForPayment] =
    useState<number | null>(null);

  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedComplaintForDelete, setSelectedComplaintForDelete] =
    useState<ComplaintProps | null>(null);

  useEffect(() => {
    if (userID) {
      const complaintId = new URLSearchParams(window.location.search).get("c");
      const start = new URLSearchParams(window.location.search).get("start");
      const end = new URLSearchParams(window.location.search).get("end");
      if (complaintId) {
        fetchData(start ?? undefined, end ?? undefined);
      } else {
        fetchData(dates.start.toISOString(), dates.end.toISOString());
      }
    }
  }, [userID]);

  useEffect(() => {
    const syncComplaintFromUrl = () => {
      const complaintId = new URLSearchParams(window.location.search).get("c");
      if (!complaintId) return;

      const complaint = data.find(
        (item) => String(item.complaint_id) === complaintId
      );
      if (!complaint) return;

      setSelected("all");
      setSearch("");
      setPage(1);
      setLinkedComplaintId(complaint.complaint_id);
      setOpenItems((prev) => ({
        ...prev,
        [complaint.complaint_id]: true,
      }));

      const hash = `complaint-${complaint.complaint_id}`;
      if (window.location.hash !== `#${hash}`) {
        window.location.hash = hash;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      });
    };

    syncComplaintFromUrl();
    window.addEventListener("popstate", syncComplaintFromUrl);

    return () => {
      window.removeEventListener("popstate", syncComplaintFromUrl);
    };
  }, [data]);

  async function fetchData(startDate?: string, endDate?: string) {
    setLoading(true);

    const query = startDate && endDate
      ? `?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
      : "";

    axios
      .get(`/${userID}/complaint${query}`)
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const getTotalPaid = (payments: ComplaintPaymentDetail[]) => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  };

  const calculateTotals = (complaints: ComplaintProps[]) => {
    return complaints.reduce(
      (acc, c) => {
        if (!c.complaint_paid) return acc;

        const paid = getTotalPaid(c.payment_details);
        const total = Number(c.complaint_charges || 0);
        const pending = Math.max(total - paid, 0);

        acc.totalPaid += paid;
        acc.totalPending += pending;
        acc.totalCharges += total;

        return acc;
      },
      {
        totalPaid: 0,
        totalPending: 0,
        totalCharges: 0,
      }
    );
  };

  const totals = useMemo(() => calculateTotals(data), [data]);

  const filteredData = useMemo(() => data.filter((item) => {
    if (selected === "paid" && !item.complaint_paid) return false;
    if (selected === "unpaid" && item.complaint_paid) return false;

    if (!search) return true;

    const searchLower = search.toLowerCase();

    return (
      (item?.complaint_title || "").toLowerCase().includes(searchLower) ||
      (item?.customer_name || "").toLowerCase().includes(searchLower) ||
      (item?.customer_owner || "").toLowerCase().includes(searchLower) ||
      (item?.customer_ownership_name || "").toLowerCase().includes(searchLower)
    );
  }), [data, search, selected]);

  const orderedData = useMemo(() => {
    if (!linkedComplaintId) return filteredData;

    const linkedComplaint = data.find(
      (item) => item.complaint_id === linkedComplaintId
    );
    if (!linkedComplaint) return filteredData;

    return [
      linkedComplaint,
      ...filteredData.filter(
        (item) => item.complaint_id !== linkedComplaintId
      ),
    ];
  }, [data, filteredData, linkedComplaintId]);

  const totalPages = Math.max(1, Math.ceil(orderedData.length / pageSize));
  const paginatedData = orderedData.slice((page - 1) * pageSize, page * pageSize);
  const pageStart = orderedData.length ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, orderedData.length);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const handleAssignEngineer = (complaintId: number) => {
    setSelectedComplaint(complaintId);
  };

  async function handleDelete(item: ComplaintProps | null) {
    if (!item?.complaint_id) return;

    setDeleteLoading(true);

    try {
      await axios.delete(`/${userID}/complaint/${item.complaint_id}`);
      await fetchData(dates.start.toISOString(), dates.end.toISOString());
      setSelectedComplaintForDelete(null);
      setSelectedComplaintForEdit(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function clearUrl (){
    const url = new URL(window.location.href);
    url.searchParams.delete("c");
    url.searchParams.delete("start");
    url.searchParams.delete("end");
    url.hash = "";
    window.history.replaceState({}, "", url);
  }

  async function handleReset() {
    setResetLoading(true);

    clearUrl()

    const startDate = moment().startOf("month").toISOString();
    const endDate = moment().endOf("month").toISOString();

    setDates({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
    });

    setSearch("");
    setSelected("all");
    setPage(1);
    setLinkedComplaintId(null);

    await fetchData(startDate, endDate);
    setResetLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-6">

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <Heading panel title="Complaint & Installation System" description="Manage complaints, installations, engineers and payments" />
          {(complaint_assigned || isAdmin) && (
            <Button onClick={() => setVisible(true)}>Register</Button>
          )}
        </div>
        <div className="grid border-t bg-muted/20 sm:grid-cols-2 sm:divide-x">
          <SummaryBox label="Paid" value={totals.totalPaid} />
          <SummaryBox label="Pending" value={totals.totalPending} />
        </div>
      </section>



      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder="Search by title, customer, owner or manager..."
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selected} onValueChange={(v) => {
            setSelected(v);
            setPage(1);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Payable</SelectItem>
              <SelectItem value="unpaid">Free</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setFilterVisible(true)}
            variant="outline"
            size="icon"
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Button variant="destructive" onClick={handleReset}>
            {resetLoading && <Spinner />}
            Reset
          </Button>
        </div>
      </div>



      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-card">
          <Spinner />
        </div>
      ) : orderedData.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border bg-card text-center">
          <p className="font-medium">No records found</p>
          <p className="text-sm text-muted-foreground">
            Try changing filters or search text.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedData.map((complaint) => (
            <ComplaintCard
              key={complaint.complaint_id}
              complaint={complaint}
              isOpen={!!openItems[complaint.complaint_id]}
              onOpenChange={(open) =>
                setOpenItems((prev) => ({
                  ...prev,
                  [complaint.complaint_id]: open,
                }))
              }
              onAssignEngineer={handleAssignEngineer}
              onCloseComplaint={setSelectedComplaintForClose}
              onEditComplaint={setSelectedComplaintForEdit}
              onAddPayment={setSelectedComplaintForPayment}
              onRefresh={() =>
                fetchData(dates.start.toISOString(), dates.end.toISOString())
              }
            />
          ))}

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {pageStart}-{pageEnd} of {orderedData.length} complaints
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <span className="min-w-20 text-center text-xs font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}


      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          clearUrl()
          await fetchData(val.start, val.end);
          setPage(1);
          setDates({
            start: moment(val.start).toDate(),
            end: moment(val.end).toDate(),
          });
        }}
      />

      <AddNewComplaint
        visible={visible}
        onClose={setVisible}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
      />

      <EditComplaint
        visible={!!selectedComplaintForEdit}
        onClose={() => setSelectedComplaintForEdit(null)}
        data={selectedComplaintForEdit}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
        onDelete={(item) => setSelectedComplaintForDelete(item)}
      />

      <AssignEngineerModal
        visible={!!selectedComplaint}
        complaint_id={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
      />

      <CloseComplaint
        visible={!!selectedComplaintForClose}
        complaint_id={selectedComplaintForClose}
        onClose={() => setSelectedComplaintForClose(null)}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
      />

      <AddPaymentForComplaint
        visible={!!selectedComplaintForPayment}
        complaint_id={selectedComplaintForPayment}
        onClose={() => setSelectedComplaintForPayment(null)}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
      />

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedComplaintForDelete}
        title="Are you sure you want to delete?"
        description="Your action will remove complaint from the system"
        onPressYes={() => handleDelete(selectedComplaintForDelete)}
        onPressCancel={() => setSelectedComplaintForDelete(null)}
      />
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  const Icon = label === "Paid" ? CircleDollarSign : Clock3;
  return (
    <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:border-t-0 sm:px-5">
      <Icon className={`size-4 ${label === "Paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="text-sm font-bold">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const statusColor = {
    pending: "bg-red-100 text-red-800",
    assigned: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    completed: "bg-gray-200 text-gray-800",
    ongoing: "bg-orange-100 text-orange-800",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[status?.toLowerCase() as keyof typeof statusColor] ||
        "bg-gray-100 text-gray-800"
        }`}
    >
      {status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        : "N/A"}
    </span>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-xs font-semibold leading-5 text-foreground">{value || "N/A"}</div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background/70 p-3 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function ComplaintCard({
  complaint,
  isOpen,
  onOpenChange,
  onAssignEngineer,
  onCloseComplaint,
  onEditComplaint,
  onAddPayment,
  onRefresh,
}: {
  complaint: ComplaintProps;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignEngineer: (id: number) => void;
  onCloseComplaint: (id: number) => void;
  onEditComplaint: (item: ComplaintProps) => void;
  onAddPayment: (id: number) => void;
  onRefresh: () => Promise<void>;
}) {

  return (
    <Collapsible
      id={`complaint-${complaint.complaint_id}`}
      open={isOpen}
      onOpenChange={onOpenChange}
      className="w-[calc(100vw-44px)] overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-primary/20 hover:shadow-md sm:w-full"
    >
      <CollapsibleTrigger asChild>
        <button className="w-full px-3 py-2.5 text-left transition hover:bg-muted/40 sm:px-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 max-w-full truncate text-sm font-bold leading-5">
                  {complaint.complaint_title}
                </p>
                <Badge>{complaint.complaint_category}</Badge>
                <StatusBadge status={complaint.complaint_status} />

              </div>

              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="truncate font-medium text-foreground/80">{complaint.customer_name}</span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="truncate">{complaint.customer_owner || "No owner"}</span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="truncate">ID #{complaint.complaint_id}</span>
              </div>

              <p className="hidden">
                {complaint.customer_name} • {complaint.customer_owner}
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:justify-end">

              <div className="min-w-0 rounded-xl border bg-muted/25 px-3 py-1.5 text-left lg:min-w-36 lg:text-right">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Manager</p>
                <p className="truncate text-xs font-bold">
                  {complaint.customer_ownership_name || "N/A"}
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""
                  }`}
              />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-3 border-t bg-muted/10 p-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {complaint.complaint_status !== "completed" && (
              <Button
                size="sm"
                className="h-8 w-full rounded-lg text-xs sm:w-auto"
                onClick={() => onCloseComplaint(complaint.complaint_id)}
              >
                Close
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8 w-full rounded-lg text-xs sm:w-auto"
              onClick={() => onEditComplaint(complaint)}
            >
              Edit
            </Button>

            {complaint.payment_details?.length > 0 ? (
              <div className="col-span-2 w-full sm:w-auto">
                <RenderPaymentViewButton
                  onRefresh={onRefresh}
                  id={complaint.complaint_id}
                  payments={complaint.payment_details}
                />
              </div>
            ) : (
              complaint.complaint_paid && (
                <Button
                  size="sm"
                  className="col-span-2 h-8 w-full rounded-lg bg-green-600 text-xs hover:bg-green-700 sm:w-auto"
                  onClick={() => onAddPayment(complaint.complaint_id)}
                >
                  Add Payment
                </Button>
              )
            )}
          </div>

          {(complaint.complaint_problem || complaint.complaint_solution) && (
            <SectionCard title="Complaint Details">
              <div className="grid gap-2 md:grid-cols-2">
                <InfoItem label="Problem" value={complaint.complaint_problem} />
                <InfoItem label="Solution" value={complaint.complaint_solution} />
              </div>
            </SectionCard>
          )}

          <SectionCard title="Customer Info">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Name" value={complaint.customer_name} />
              <InfoItem label="Owner" value={complaint.customer_owner} />
              <InfoItem label="Manager" value={complaint.customer_ownership_name} />
              <InfoItem label="Address" value={complaint.customer_address} />
              <InfoItem label="Location" value={complaint.customer_location} />
              <InfoItem label="Contact" value={complaint.customer_number?.join(", ")} />

              {complaint?.customer_pin?.includes("http") && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Link target="_blank" href={complaint.customer_pin}>
                    <Button variant="outline" size="sm" className="h-8 w-full rounded-lg text-xs sm:w-auto">
                      Open Google Location
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Engineer Info">
            {complaint.engineer_id ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoItem label="Engineer" value={complaint.engineer_name} />
                <InfoItem label="Assigned By" value={complaint.assigned_by_name} />
              </div>
            ) : (
              <Button
                size="sm"
                className="h-8 w-full rounded-lg text-xs sm:w-auto"
                onClick={() => onAssignEngineer(complaint.complaint_id)}
              >
                Assign Engineer
              </Button>
            )}
          </SectionCard>

          {complaint?.logs && complaint.logs.length > 0 && (
            <SectionCard title="Complaint Updates">
              <div className="grid gap-2">
                {complaint.logs.map((item, index) => (
                  <div key={index} className="rounded-xl border bg-card p-2.5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-xs font-semibold leading-5">
                          {item?.remark || "No remarks"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {moment(item.created_at).format("YYYY-MM-DD HH:mm A")}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {item.location && item.location.length > 0 ? (
                          <MapPin
                            onClick={() => {
                              const mapUrl = `https://www.google.com/maps?q=${item.location[0]},${item.location[1]}`
                              window.open(mapUrl, "_blank")
                            }}
                            className="h-4 w-4 cursor-pointer text-red-500 hover:opacity-70"
                          />
                        ) : (
                          <MapPinOff className="h-4 w-4 text-red-500 opacity-50" />
                        )}

                        {item.signature && <MyImgZooming img={item.signature} />}
                        {item.image && <MyImgZooming img={item.image} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const AddNewComplaint = ({
  visible,
  onClose,
  onRefresh,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext)!

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
      category: "Complaint",
      installation: false,
      paid: false,
      charges: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    try {
      await axios.post(`/${userID}/complaint`, {
        ...values,
        managing_office: OfficeState.value.data || "lahore",
        status: "pending",
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    form.reset({
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
      category: "Complaint",
      installation: false,
      paid: false,
    });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><Headphones className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">New Registration</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Register customer complaint and service information.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="p-3.5 pb-4">
        <ComplaintFormContent form={form} loading={loading} onSubmit={onSubmit} />
        </div></ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

function ComplaintFormContent({
  form,
  loading,
  onSubmit,
}: {
  form: any;
  loading: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit, (errors: any) => {
      console.log("Validation Errors:", errors);
    })} className="space-y-4">
      <FieldSet className="rounded-lg border p-4">
        <FieldLegend className="px-1 text-sm font-medium">
          Complaint Details
        </FieldLegend>

        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            name="category"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel>
                    Select Task Category <RequiredStar />
                  </FieldLabel>
                  <Select value={field.value} onValueChange={(e) => {
                    field.onChange(e)
                    if (e === "Installation") {
                      form.setValue("installation", true)
                    } else {
                      form.setValue("installation", false)
                    }
                  }}>
                    <SelectTrigger
                      className="h-11 w-full rounded-lg border bg-background px-3 shadow-sm"
                      aria-invalid={fieldState.invalid}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <SelectValue placeholder="Select task category" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="min-w-[260px]">
                      {taskCategories.map((category) => {
                        const Icon = category.icon;

                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {category.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />

          <Controller
            name="installation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <FieldLabel>Machine Installation?</FieldLabel>
                  <Checkbox
                    disabled
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="paid"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <FieldLabel>Payable?</FieldLabel>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked: boolean) =>
                      field.onChange(checked)
                    }
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                {form.watch("installation") ? "Title" : "Complaint"}{" "}
                <RequiredStar />
              </FieldLabel>
              <Input
                {...field}
                placeholder={`Enter ${form.watch("installation") ? "title" : "complaint"
                  }`}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="customer_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Select Customer <RequiredStar />
              </FieldLabel>
              <CustomerSearch value={field.value} onReturn={field.onChange} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {form.watch("paid") === true && (
          <Controller
            name="charges"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Charges <RequiredStar />
                </FieldLabel>
                <Input
                  {...field}
                  placeholder="Enter charges"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </FieldSet>

      {form.watch("category") === 'Complaint' && (
        <FieldSet className="rounded-lg border p-4">
          <FieldLegend className="px-1 text-sm font-medium">
            Problem & Solution
          </FieldLegend>

          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="problem"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Warranty</FieldLabel>
                  <Input
                    {...field}
                    placeholder="Enter warranty information"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="solution"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Solution</FieldLabel>
                  <Input
                    {...field}
                    placeholder="Enter solution"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldSet>
      )}

      <Button disabled={loading} type="submit" className="w-full">
        {loading && <Spinner />}
        Save
      </Button>
    </form>
  );
}

const AssignEngineerModal = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
  complaint_id: number | null;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  const form = useForm({
    resolver: zodResolver(formSchemaEngineer),
    defaultValues: {
      engineer_id: undefined,
    },
  });

  const onSubmit = async (values: { engineer_id: number }) => {
    setLoading(true);

    try {
      await axios.post(`/${userID}/complaint-assignments`, {
        ...values,
        complaint_id,
        assigned_by: userID,
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><Wrench className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Assign Engineer</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Select the engineer responsible for this complaint.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="p-3.5 pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet className="rounded-lg border p-4">
              <FieldLegend className="px-1 text-sm font-medium">
                Engineer Details
              </FieldLegend>

              <Controller
                name="engineer_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Engineer <RequiredStar />
                    </FieldLabel>

                    <UserSearch value={field.value} onReturn={field.onChange} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />}
              Save
            </Button>
          </FieldGroup>
        </form>
        </div></ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const CloseComplaint = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
  complaint_id: number | null;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  const form = useForm({
    resolver: zodResolver(formSchemaClosing),
    defaultValues: {
      status: "",
    },
  });

  const onSubmit = async (values: { status: string }) => {
    if (!complaint_id) return;

    setLoading(true);

    try {
      await axios.post(`/${userID}/complaint-logs`, {
        remark: values.status,
        engineer_id: userID,
        complaint_id,
      });

      await axios.put(`/${userID}/complaint`, {
        status: "completed",
        id: complaint_id,
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><ShieldCheck className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Close Complaint</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Record the resolution details before closing.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="p-3.5 pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet className="rounded-lg border p-4">
              <FieldLegend className="px-1 text-sm font-medium">
                Closing Information
              </FieldLegend>

              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Closing Remarks <RequiredStar />
                    </FieldLabel>

                    <Input {...field} aria-invalid={fieldState.invalid} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />}
              Save
            </Button>
          </FieldGroup>
        </form>
        </div></ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const AddPaymentForComplaint = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
  complaint_id: number | null;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  const form = useForm({
    resolver: zodResolver(formSchemaPayment),
    defaultValues: {
      method: "",
      slip: "",
      purpose: "",
      amount: 0,
    },
  });

  const onSubmit = async (values: FormValuesPayment) => {
    if (!complaint_id) return;

    setLoading(true);

    try {
      const name = `complaints/${complaint_id}/payments/${moment()
        .valueOf()
        .toString()}.png`;

      await UploadImage(values.slip, name, "image/png");

      await axios.post(`/${userID}/complaint/${complaint_id}/payment`, {
        ...values,
        complaint_id,
        slip: name,
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><CircleDollarSign className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Add Payment</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Record complaint payment and supporting information.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="p-3.5 pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet className="rounded-lg border p-4">
              <FieldLegend className="px-1 text-sm font-medium">
                Payment Details
              </FieldLegend>

              <Controller
                name="purpose"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Purpose <RequiredStar />
                    </FieldLabel>

                    <Input {...field} aria-invalid={fieldState.invalid} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Amount <RequiredStar />
                    </FieldLabel>

                    <Input
                      {...field}
                      type="number"
                      min="0"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="method"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Receiving Method <RequiredStar />
                    </FieldLabel>

                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select receiving method" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Cheque", "Cash", "Deposit", "Online", "Pay Order"].map(
                          (m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="slip"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Attach Image <RequiredStar />
                    </FieldLabel>

                    <Dropzone
                      value={field.value}
                      onDrop={(file) => field.onChange(file)}
                      title="Click to upload"
                      subheading="or drag and drop"
                      description="PNG or JPG"
                      drag="Drop the files here..."
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />}
              Save
            </Button>
          </FieldGroup>
        </form>
        </div></ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const RenderPaymentViewButton = ({
  payments,
  id,
  onRefresh,
}: {
  id: number;
  payments: ComplaintPaymentDetail[];
  onRefresh: () => Promise<void>;
}) => {
  const [visible, setVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { userID } = useUserDetail();

  function handleClose() {
    setVisible(false);
  }

  async function handleDelete() {
    if (!payments?.length) return;

    setDeleteLoading(true);

    try {
      await Promise.all(
        payments.map((payment) =>
          axios.delete(
            `/${userID}/complaint/${payment.complaint_id}/payment/${payment.id}`
          )
        )
      );

      await onRefresh();
      handleClose();
      toast.success("Payments Deleted");
    } catch (error) {
      toast.error("Failed to delete some payments");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setVisible(true)}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        View Payment
      </Button>

      <Sheet open={visible} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Payment Detail</SheetTitle>

              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Spinner /> : <Trash size={16} />}
              </Button>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            {payments.map((item) => (
              <MyImgZooming key={item.slip} img={item.slip} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const EditComplaint = ({
  visible,
  onClose,
  onRefresh,
  data,
  onDelete,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
  data: ComplaintProps | null;
  onDelete: (item: ComplaintProps) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
      category: "Complaint",
      installation: false,
      paid: false,
      charges: 0,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.complaint_title,
        customer_id: data.customer_id,
        problem: data.complaint_problem,
        solution: data.complaint_solution,
        category: data.complaint_category,
        installation: data.complaint_installation,
        paid: data.complaint_paid,
        charges: data.complaint_charges || 0,
      });
    }
  }, [data]);

  const onSubmit = async (values: FormValues) => {
    if (!data?.complaint_id) return;

    setLoading(true);

    try {
      await axios.put(`/${userID}/complaint`, {
        ...values,
        id: data.complaint_id,
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    form.reset({
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
      category: "Complaint",
      installation: false,
      paid: false,
    });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><Settings2 className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Edit Complaint</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Update complaint and customer service details.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]"><div className="space-y-3 p-3.5 pb-4">
        <ComplaintFormContent form={form} loading={loading} onSubmit={onSubmit} />

        {data && (
          <div>
            <Button
              onClick={() => onDelete(data)}
              variant="destructive"
              type="button"
              className="w-full"
            >
              Delete
            </Button>
          </div>
        )}
        </div></ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
