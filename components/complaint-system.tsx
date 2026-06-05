"use client";

import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ComplaintPaymentDetail, ComplaintProps } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import {
  ChevronDown,
  Filter,
  MapPin,
  MapPinOff,
  Search,
  Trash,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import { z } from "zod";

import ConfimationDialog from "./alert-dialog";
import { CustomerSearch } from "./customer-search";
import { RequiredStar } from "./RequiredStar";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "./ui/field";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import Spinner from "./ui/spinner";
import { UserSearch } from "./user-search";
import { MyImg } from "./users/addVisit";
import FilterSheet from "./users/filterSheet";

const formSchema = z
  .object({
    title: z.string().min(1, "Required"),
    customer_id: z.number({ message: "Required" }),
    problem: z.string().optional(),
    solution: z.string().optional(),
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
      fetchData(dates.start.toISOString(), dates.end.toISOString());
    }
  }, [userID]);

  async function fetchData(startDate: string, endDate: string) {
    setLoading(true);

    axios
      .get(`/${userID}/complaint?start_date=${startDate}&end_date=${endDate}`)
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

  const filteredData = data.filter((item) => {
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
  });

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

  async function handleReset() {
    setResetLoading(true);

    const startDate = moment().startOf("month").toISOString();
    const endDate = moment().endOf("month").toISOString();

    setDates({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
    });

    setSearch("");
    setSelected("all");

    await fetchData(startDate, endDate);
    setResetLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-6">
     
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Heading
            title="Complaint & Installation System"
            description="Manage complaints, installations, engineers and payments"
          />

          <div className="flex flex-wrap items-center gap-3">
            <SummaryBox label="Paid" value={totals.totalPaid} />
            <SummaryBox label="Pending" value={totals.totalPending} />

            {(complaint_assigned || isAdmin) && (
              <Button onClick={() => setVisible(true)}>Register</Button>
            )}
          </div>
        </div>
      

    
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                placeholder="Search by title, customer, owner or manager..."
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selected} onValueChange={(v) => setSelected(v)}>
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
        ) : filteredData.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border bg-card text-center">
            <p className="font-medium">No records found</p>
            <p className="text-sm text-muted-foreground">
              Try changing filters or search text.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map((complaint) => (
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
          </div>
        )}
   

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end);
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

      <ConfimationDialog
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
  return (
    <div className="min-w-[120px] rounded-lg border bg-background px-4 py-2 bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
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
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        statusColor[status?.toLowerCase() as keyof typeof statusColor] ||
        "bg-gray-100 text-gray-800"
      }`}
    >
      {status || "N/A"}
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value || "N/A"}</div>
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
    <div className="rounded-lg border bg-background p-3">
      <p className="mb-3 text-sm font-semibold">{title}</p>
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
      open={isOpen}
      onOpenChange={onOpenChange}
      className="rounded-xl border bg-card shadow-sm"
    >
      <CollapsibleTrigger asChild>
        <button className="w-full px-4 py-3 text-left transition hover:bg-muted/50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">
                  {complaint.complaint_title}
                </p>
                <StatusBadge status={complaint.complaint_status} />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {complaint.customer_name} • {complaint.customer_owner}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 lg:justify-end">
              <div className="text-left lg:text-right">
                <p className="text-xs text-muted-foreground">Manager</p>
                <p className="text-sm font-medium">
                  {complaint.customer_ownership_name || "N/A"}
                </p>
              </div>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-4 border-t p-4">
          <div className="flex flex-wrap gap-2">
            {complaint.complaint_status !== "completed" && (
              <Button
                size="sm"
                onClick={() => onCloseComplaint(complaint.complaint_id)}
              >
                Close Complaint
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditComplaint(complaint)}
            >
              Edit Complaint
            </Button>

            {complaint.payment_details?.length > 0 ? (
              <RenderPaymentViewButton
                onRefresh={onRefresh}
                id={complaint.complaint_id}
                payments={complaint.payment_details}
              />
            ) : (
              complaint.complaint_paid && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAddPayment(complaint.complaint_id)}
                >
                  Add Payment
                </Button>
              )
            )}
          </div>

          {(complaint.complaint_problem || complaint.complaint_solution) && (
            <SectionCard title="Complaint Details">
              <div className="grid gap-3 md:grid-cols-2">
                <InfoItem label="Problem" value={complaint.complaint_problem} />
                <InfoItem
                  label="Solution"
                  value={complaint.complaint_solution}
                />
              </div>
            </SectionCard>
          )}

          <SectionCard title="Customer Info">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Name" value={complaint.customer_name} />
              <InfoItem label="Owner" value={complaint.customer_owner} />
              <InfoItem
                label="Manager"
                value={complaint.customer_ownership_name}
              />
              <InfoItem label="Address" value={complaint.customer_address} />
              <InfoItem label="Location" value={complaint.customer_location} />
              <InfoItem
                label="Contact"
                value={complaint.customer_number?.join(", ")}
              />

              {complaint?.customer_pin?.includes("http") && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Link target="_blank" href={complaint.customer_pin}>
                    <Button variant="outline" size="sm">
                      Open Google Location
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Engineer Info">
            {complaint.engineer_id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="Engineer" value={complaint.engineer_name} />
                <InfoItem
                  label="Assigned By"
                  value={complaint.assigned_by_name}
                />
              </div>
            ) : (
              <Button
                size="sm"
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
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {item?.remark || "No remarks"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {moment(item.created_at).format("YYYY-MM-DD HH:mm A")}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.location && item.location.length > 0 ? (
                          <MapPin
                            onClick={() => {
                              const mapUrl = `https://www.google.com/maps?q=${item.location[0]},${item.location[1]}`;
                              window.open(mapUrl, "_blank");
                            }}
                            className="h-5 w-5 cursor-pointer text-red-500 hover:opacity-70"
                          />
                        ) : (
                          <MapPinOff className="h-5 w-5 text-red-500 opacity-50" />
                        )}

                        {item.signature && <MyImg img={item.signature} />}
                        {item.image && <MyImg img={item.image} />}
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
  );
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
  const { state: OfficeState } = useContext(OfficeContext);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
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
      installation: false,
      paid: false,
    });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Registration</DialogTitle>
        </DialogHeader>

        <ComplaintFormContent form={form} loading={loading} onSubmit={onSubmit} />
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
    <form onSubmit={form.handleSubmit(onSubmit,  (errors : any) => {
      console.log("Validation Errors:", errors);
    })} className="space-y-4">
      <FieldSet className="rounded-lg border p-4">
        <FieldLegend className="px-1 text-sm font-medium">
          Complaint Details
        </FieldLegend>

        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            name="installation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <FieldLabel>Machine Installation?</FieldLabel>
                  <Checkbox
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
                placeholder={`Enter ${
                  form.watch("installation") ? "title" : "complaint"
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

      {!form.watch("installation") && (
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Engineer</DialogTitle>
        </DialogHeader>

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close Complaint</DialogTitle>
        </DialogHeader>

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

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
              <RenderEachImage key={item.slip} img={item.slip} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const RenderEachImage = ({ img }: { img: string }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    } else {
      setLocalImage(null);
    }
  }, [img]);

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
  }, []);

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
  };

  if (!localImage) return null;

  return (
    <ControlledZoom
      isZoomed={isZoomed}
      onZoomChange={handleZoomChange}
      ZoomContent={({ img }) =>
        isZoomed ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              zIndex: 9999,
              pointerEvents: "auto",
            }}
          >
            <img
              src={localImage}
              alt="payment-img"
              style={{
                transform: `rotate(${rotation}deg)`,
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                pointerEvents: "auto",
              }}
            />

            <div
              className="mt-2 flex gap-3"
              style={{
                pointerEvents: "auto",
                zIndex: 10000,
              }}
            >
              <Button variant="outline" size="sm" onClick={rotateImageLeft}>
                Rotate Left
              </Button>

              <Button variant="outline" size="sm" onClick={rotateImageRight}>
                Rotate Right
              </Button>

              <Button variant="outline" size="sm" onClick={onPressClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          img ?? <></>
        )
      }
    >
      <img
        src={localImage}
        alt="payment-img"
        className="max-h-[400px] w-full cursor-zoom-in rounded-lg border object-contain"
      />
    </ControlledZoom>
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
      installation: false,
      paid: false,
    });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Complaint</DialogTitle>
        </DialogHeader>

        <ComplaintFormContent form={form} loading={loading} onSubmit={onSubmit} />

        {data && (
          <DialogFooter>
            <Button
              onClick={() => onDelete(data)}
              variant="destructive"
              type="button"
              className="w-full"
            >
              Delete
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};