
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
import { ChevronDown, Filter, MapPin, MapPinOff, Trash } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import { z } from "zod";
import { CustomerSearch } from "./customer-search";
import { RequiredStar } from "./RequiredStar";
import { Checkbox } from "./ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "./ui/field";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import Spinner from "./ui/spinner";
import { UserSearch } from "./user-search";
import { MyImg } from "./users/addVisit";
import FilterSheet from "./users/filterSheet";



const formSchema = z.object({
  title: z.string().min(1, "Required"),
  customer_id: z.number({ message: "Required" }),
  problem: z.string().optional(),
  solution: z.string().optional(),
  installation: z.boolean(),
  paid: z.boolean(),
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

type FormValuesPayment = z.infer<typeof formSchemaPayment>;

export default function ComplaintSystem() {
  const [loading, setLoading] = useState(false);
  const { userID, isAdmin, complaint_assigned } = useUserDetail()
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ComplaintProps[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [selected, setSelected] = useState("all")
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  });
  const [selectedComplaintForClose, setSelectedComplaintForClose] =
    useState<number | null>(null);
  const [selectedComplaintForPayment, setSelectedComplaintForPayment] = useState<number | null>(null);
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});



  useEffect(() => {
    if (userID) {
      fetchData(dates.start.toISOString(), dates.end.toISOString());
    }
  }, [userID]);

  async function fetchData(startDate: string, endDate: string) {
    setLoading(true);
    axios
      .get(
        `/${userID}/complaint?start_date=${startDate}&end_date=${endDate}`
      )
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const handleAssignEngineer = (complaintId: number) => {
    setSelectedComplaint(complaintId);
  };


  const filteredData = data.filter((item) => {
    if (selected === "paid" && !item.complaint_paid) {
      return false;
    }

    if (selected === "unpaid" && item.complaint_paid) {
      return false;
    }
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (item?.complaint_title || "").toLowerCase().includes(searchLower) ||
      (item?.customer_name || "").toLowerCase().includes(searchLower) ||
      (item?.customer_owner || "").toLowerCase().includes(searchLower) ||
      (item?.customer_ownership_name || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between items-center">
        <Heading
          title="Complaint & Installation System"
          description="Manage complaints and machine installations"
        />
        {(complaint_assigned || isAdmin) && (
          <Button onClick={() => setVisible(true)}>Register</Button>
        )}
      </div>

      <div className="flex w-full flex-wrap gap-4 items-center ">
        <Input
          value={search}
          placeholder={`Search...`}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          className="w-[60vw] max-w-sm"
        />

        <Button
          onClick={() => setFilterVisible(true)}
          variant="ghost"
          className="p-0 w-8"
        >
          <Filter />
        </Button>

        <Button
          variant="destructive"
          onClick={async () => {
            setResetLoading(true);
            const startDate = moment().startOf("month").toISOString();
            const endDate = moment().endOf("month").toISOString();
            setDates({
              start: moment().startOf("month").toDate(),
              end: moment().endOf("month").toDate(),
            });
            setSearch("");
            await fetchData(startDate, endDate);
            setResetLoading(false);
          }}
        >
          {resetLoading && <Spinner />} Reset
        </Button>
        <div>

          <Select onValueChange={(v) => setSelected(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>

              <SelectItem value={"all"}>
                All
              </SelectItem>
              <SelectItem value={"paid"}>
                Paid
              </SelectItem>
              <SelectItem value={"unpaid"}>
                Unpaid
              </SelectItem>

            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[calc(100dvh-220px)]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (

          filteredData.map((complaint) => {
            const isOpen = !!openItems[complaint.complaint_id];
            const statusColor = {
              pending: "bg-red-100 text-red-800",
              assigned: "bg-blue-100 text-blue-800",
              resolved: "bg-green-100 text-green-800",
              completed: "bg-gray-200 text-gray-800",
              ongoing: "bg-orange-100 text-orange-800",
            };

            return (
              <Collapsible
                key={complaint.complaint_id}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenItems((prev) => ({
                    ...prev,
                    [complaint.complaint_id]: open,
                  }))
                }
                className="border rounded-lg shadow-sm mb-2"
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left px-4 py-3 font-semibold text-lg hover:bg-muted transition-colors rounded-md">
                    <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div>
                        <p className="text-base font-medium">
                          {complaint?.complaint_title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Manager: {complaint?.customer_ownership_name}
                        </p>
                      </div>

                      <div className="flex items-start gap-3 sm:items-center">
                        <div className="flex flex-col sm:items-end">
                          <p className="text-sm text-muted-foreground">
                            Company: {complaint?.customer_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Owner: {complaint?.customer_owner}
                          </p>
                        </div>

                        <ChevronDown
                          className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent >
                  <div className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[complaint.complaint_status?.toLowerCase() as keyof typeof statusColor] ||
                          "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {complaint.complaint_status}
                      </span>
                      {complaint.complaint_status !== "completed" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            // handleCloseComplaint(complaint.id)
                            setSelectedComplaintForClose(complaint.complaint_id)
                          }
                        >
                          {/* {closeLoading === complaint.id && <Spinner />} */}
                          Close Complaint
                        </Button>
                      )}
                      {complaint.payment_details?.length > 0 ? <RenderPaymentViewButton onRefresh={() =>
                        fetchData(dates.start.toISOString(), dates.end.toISOString())
                      } id={complaint.complaint_id} payments={complaint.payment_details} /> :
                        complaint.complaint_paid && <Button onClick={() => setSelectedComplaintForPayment(complaint.complaint_id)} size={"sm"} className="bg-green-600" >Add Payment</Button>}
                    </div>
                    {complaint?.complaint_problem && (
                      <div>
                        <strong>Problem:</strong> {complaint.complaint_problem}
                      </div>
                    )}
                    {complaint?.complaint_solution && (
                      <div>
                        <strong>Solution:</strong> {complaint.complaint_solution || "N/A"}
                      </div>
                    )}

                    <hr />

                    <div className="text-md font-semibold">Customer Info</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                      <p>
                        <strong>Name:</strong> {complaint.customer_name}
                      </p>
                      <p>
                        <strong>Owner:</strong> {complaint.customer_owner}
                      </p>
                      <p>
                        <strong>Address:</strong> {complaint.customer_address}
                      </p>
                      <p>
                        <strong>Location:</strong> {complaint.customer_location}
                      </p>
                      <p>
                        <strong>Contact:</strong>{" "}
                        {complaint.customer_number.join(", ")}
                      </p>
                      <p>
                        <strong>Manager:</strong>{" "}
                        {complaint.customer_ownership_name}
                      </p>
                      {complaint?.customer_pin &&
                        complaint?.customer_pin.includes("http") && (
                          <Link target="blank" href={complaint?.customer_pin}>
                            <Button variant="outline">
                              Open Google location
                            </Button>
                          </Link>
                        )}
                    </div>

                    <hr />

                    <div className="text-md font-semibold">Engineer Info</div>
                    {complaint.engineer_id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Engineer:</strong> {complaint.engineer_name}
                        </p>
                        <p>
                          <strong>Assigned By:</strong>{" "}
                          {complaint.assigned_by_name}
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="mt-2"
                        onClick={() => handleAssignEngineer(complaint.complaint_id)}
                      >
                        Assign Engineer
                      </Button>
                    )}

                    {complaint?.logs && complaint.logs.length > 0 && (
                      <>
                        <hr />

                        <div className="text-md font-semibold">
                          Complaints updates
                        </div>
                        <div className="grid grid-cols-1 text-sm text-muted-foreground gap-2">
                          {complaint.logs.map((item, index) => (
                            <div key={index} className="border rounded-md p-2 flex flex-col gap-2 w-fit">
                              <Label>
                                <strong>Remarks:</strong> {item?.remark}
                              </Label>
                              <Label>
                                {moment(item.created_at).format(
                                  "YYYY-MM-DD HH:mm A"
                                )}
                              </Label>
                              <div className="flex flex-row gap-5 mt-2">
                                {item.location && item.location.length > 0 ? (
                                  <MapPin
                                    onClick={() => {
                                      const mapUrl = `https://www.google.com/maps?q=${item.location[0]},${item.location[1]}`;
                                      window.open(mapUrl, "_blank");
                                    }}
                                    className="text-red-500 h-5 w-5 cursor-pointer hover:opacity-50"
                                  />
                                ) : (
                                  <MapPinOff className="text-red-500 h-5 w-5 opacity-50" />
                                )}
                                {item.signature && (
                                  <MyImg img={item.signature} />
                                )}
                                {item.image && <MyImg img={item.image} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })

        )}
      </ScrollArea>

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
    </div>
  );
}

type FormValues = z.infer<typeof formSchema>;

const AddNewComplaint = ({ visible, onClose, onRefresh }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()
  const { state: OfficeState } = useContext(OfficeContext);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: undefined,
      problem: "",
      solution: "",
      installation: false,
      paid: false
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await axios.post(
        `/${userID}/complaint`,
        {
          ...values,
          managing_office: OfficeState.value.data || "lahore",
          status: "pending",
        }
      );
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
      paid: false
    });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">New registration</DialogTitle>
        </DialogHeader>

        <form id="complaint-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

          {/* Complaint Details */}
          <FieldSet className="border rounded-md p-3 gap-3">
            <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Complaint Details</FieldLegend>

            {/* Installation */}
            <div className="flex items-center gap-4 justify-between">
              <Controller
                name="installation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center gap-2">
                      <FieldLabel>
                        Machine Installation? <RequiredStar />
                      </FieldLabel>
                      <div>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </div>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="paid"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center gap-2">
                      <FieldLabel>
                        Paid?
                      </FieldLabel>
                      <div>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => field.onChange(checked)}
                        />
                      </div>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

            </div>

            {/* Title / Complaint */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="complaint-title">
                    {form.watch("installation") ? "Title" : "Complaint"} <RequiredStar />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="complaint-title"
                    placeholder={`Enter ${form.watch("installation") ? "title" : "complaint"}`}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Customer */}
            <Controller
              name="customer_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Select Customer <RequiredStar />
                  </FieldLabel>
                  <CustomerSearch
                    value={field.value}
                    onReturn={(val) => field.onChange(val)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldSet>

          {/* Problem & Solution */}
          {!form.watch("installation") && (
            <FieldSet className="border rounded-md p-3 gap-3">
              <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Problem & Solution</FieldLegend>

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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldSet>
          )}

          {/* Submit */}
          <Button disabled={loading} type="submit" className="w-full">
            {loading && <Spinner />} Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AssignEngineerModal = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,

}: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, complaint_id: number | null }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()
  const form = useForm({
    resolver: zodResolver(formSchemaEngineer),
    defaultValues: {
      engineer_id: undefined,
    },
  });

  const onSubmit = async (values: { engineer_id: number }) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/${userID}/complaint-assignments`,
        {
          ...values,
          complaint_id: complaint_id,
          assigned_by: userID,
        }
      );
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Engineer</DialogTitle>
        </DialogHeader>

        <form id="engineer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FieldGroup>

            <Controller
              name="engineer_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Engineer <RequiredStar />
                  </FieldLabel>

                  <UserSearch
                    value={field.value}
                    onReturn={field.onChange}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />} Save
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

}: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, complaint_id: number | null }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()
  const form = useForm({
    resolver: zodResolver(formSchemaClosing),
    defaultValues: {
      status: "",
    },
  });

  const onSubmit = async (values: { status: string }) => {
    if (!complaint_id) return
    setLoading(true);
    try {
      const responseLog = await axios.post(
        `/${userID}/complaint-logs`,
        {
          remark: values.status,
          engineer_id: userID,
          complaint_id: complaint_id,
        }
      );
      const response = await axios.put(
        `/${userID}/complaint`,
        {
          status: "completed",
          id: complaint_id,
        }
      );
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Complaint</DialogTitle>
        </DialogHeader>

        <form id="closing-remarks-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FieldGroup>

            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Closing Remarks <RequiredStar />
                  </FieldLabel>

                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />} Save
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

}: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, complaint_id: number | null }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()
  const form = useForm({
    resolver: zodResolver(formSchemaPayment),
    defaultValues: {
      method: "",
      slip: "",
      purpose: "",
      amount: 0
    },
  });

  const onSubmit = async (values: FormValuesPayment) => {
    if (!complaint_id) return
    setLoading(true);
    try {

      let name = `complaints/${complaint_id}/payments/${moment().valueOf().toString()}.png`
      const imageRefResult = await UploadImage(
        values.slip,
        name,
        "image/png",
      );

      await axios.post(`/${userID}/complaint/${complaint_id}/payment`, {
        ...values, complaint_id: complaint_id, slip: name
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FieldGroup>
            <Controller
              name="purpose"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Purpose <RequiredStar />
                  </FieldLabel>

                  <Input {...field} aria-invalid={fieldState.invalid} />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select receiving method" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Cheque", "Cash", "Deposit", "Online", "Pay Order"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="slip"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Attach Image</FieldLabel>

                  <Dropzone
                    value={field.value}
                    onDrop={(file) => {
                      field.onChange(file)
                    }}
                    title={"Click to upload"}
                    subheading={"or drag and drop"}
                    description={"PNG or JPG"}
                    drag={"Drop the files here..."}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button disabled={loading} type="submit" className="w-full">
              {loading && <Spinner />} Save
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RenderPaymentViewButton = ({ payments, id, onRefresh }: { id: number, payments: ComplaintPaymentDetail[], onRefresh: () => Promise<void> }) => {

  const [visible, setVisible] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { userID } = useUserDetail()

  function handleClose() {

    setVisible(false)
  }

  async function handleDelete() {
  if (!payments?.length) return;

  setDeleteLoading(true);

  try {
    await Promise.all(
      payments.map(payment =>
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
      <Button onClick={() => setVisible(true)} size={"sm"} className="bg-green-600" >View Payment</Button>
      <Sheet open={visible} onOpenChange={handleClose}>
        <SheetContent>
          <SheetHeader className="mb-4">
            <SheetTitle>Payment Detail</SheetTitle>

            <Button
              className="mb-2"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                // e.stopPropagation()
                // setSelectedCustomerId(currentItem?.id);
                // setShowConfirmation(true);
               
                
                handleDelete();
              }}
            >
              {deleteLoading ? <Spinner /> : <Trash size={16} />}
            </Button>
            {payments.map((item) => (

              <RenderEachImage key={item.slip} img={item.slip} />
            ))}



          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  )
}

const RenderEachImage = ({ img }: { img: string }) => {

  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);

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
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
    setImageOpen(false);
  };

  if (!localImage) return null

  return (
    localImage ? (
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
                className="mt-2 flex gap-5"
                style={{
                  pointerEvents: "auto",
                  zIndex: 10000,
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateImageLeft}
                >
                  Rotate Left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotateImageRight}
                >
                  Rotate Right
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPressClose}
                >
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
          onClick={() => setImageOpen(true)}
          src={localImage}
          alt="payment-img"
          style={{
            maxWidth: "100%",
            maxHeight: "400px",
            objectFit: "contain",
            cursor: "zoom-in",
          }}
        />
      </ControlledZoom>
    ) : (
      <Label>No Image found</Label>
    )
  )
}