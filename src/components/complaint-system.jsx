// components/ComplaintForm.js
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, MapPin, MapPinOff } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CustomerSearch } from "./customer-search";
import { RequiredStar } from "./RequiredStar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Heading } from "./ui/heading";
import { ScrollArea } from "./ui/scroll-area";
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
});

const formSchemaEngineer = z.object({
  engineer_id: z.number({ message: "Engineer is required" }),
});

const formSchemaClosing = z.object({
  status: z.string().min(1, "Required"),
});

export default function ComplaintSystem({ base }) {
  const [loading, setLoading] = useState(false);

  const { state: UserState } = useContext(UserContext);
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [closeLoading, setCloseLoading] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  });
  const [selectedComplaintForClose, setSelectedComplaintForClose] =
    useState(null);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData(dates.start.toISOString(), dates.end.toISOString());
    }
  }, [UserState]);

  async function fetchData(startDate, endDate) {
    setLoading(true);
    axios
      .get(
        `/${UserState.value.data?.id}/complaint?start_date=${startDate}&end_date=${endDate}`
      )
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const handleAssignEngineer = (complaintId) => {
    setSelectedComplaint(complaintId);
  };

  async function handleCloseComplaint(id) {
    if (!id) return;
    setCloseLoading(id);
    await axios.put(`/${UserState.value.data?.id}/complaint`, {
      id: id,
      status: "completed",
    });
    await fetchData(dates.start.toISOString(), dates.end.toISOString());
    setCloseLoading(null);
  }

  const filteredData = data.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (item?.title || "").toLowerCase().includes(searchLower) ||
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
        {UserState.value.data?.complaint_assigned && (
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
              state: moment().startOf("month").toDate(),
              end: moment().endOf("month").toDate(),
            });
            setSearch("");
            await fetchData(startDate, endDate);
            setResetLoading(false);
          }}
        >
          {resetLoading && <Spinner />} Reset
        </Button>
      </div>

      <ScrollArea className="h-[calc(100dvh-220px)]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Accordion type="single" className="w-full space-y-4">
            {filteredData.map((complaint) => {
              const statusColor = {
                pending: "bg-red-100 text-red-800",
                assigned: "bg-blue-100 text-blue-800",
                resolved: "bg-green-100 text-green-800",
                completed: "bg-gray-200 text-gray-800",
                ongoing: "bg-orange-100 text-orange-800",
              };

              return (
                <AccordionItem
                  key={complaint.id}
                  value={`complaint-${complaint.id}`}
                  className="border rounded-lg shadow-sm"
                >
                  <AccordionTrigger className="text-left px-4 py-3 font-semibold text-lg hover:bg-muted transition-colors rounded-md">
                    <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div>
                        <p className="text-base font-medium">
                          {complaint?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Manager: {complaint?.customer_ownership_name}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <p className="text-sm text-muted-foreground">
                          Company: {complaint?.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Owner: {complaint?.customer_owner}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          statusColor[complaint.status?.toLowerCase()] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {complaint.status}
                      </span>
                      {complaint.status !== "completed" && (
                        <Button
                          size="sm"
                          disabled={!!closeLoading}
                          onClick={() =>
                            // handleCloseComplaint(complaint.id)
                            setSelectedComplaintForClose(complaint.id)
                          }
                        >
                          {/* {closeLoading === complaint.id && <Spinner />} */}
                          Close Complaint
                        </Button>
                      )}
                    </div>
                    {complaint?.problem && (
                      <div>
                        <strong>Problem:</strong> {complaint.problem}
                      </div>
                    )}
                    {complaint?.solution && (
                      <div>
                        <strong>Solution:</strong> {complaint.solution || "N/A"}
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
                        onClick={() => handleAssignEngineer(complaint.id)}
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
                            <div key={index}>
                              <p>
                                <strong>Remarks:</strong> {item?.remark}
                              </p>
                              <p>
                                {moment(item.created_at).format(
                                  "YYYY-MM-DD HH:mm A"
                                )}
                              </p>
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>

      <FilterSheet
        user={false}
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
        base={base}
      />

      <AssignEngineerModal
        visible={!!selectedComplaint}
        complaint_id={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
        base={base}
      />

      <CloseComplaint
        visible={!!selectedComplaintForClose}
        complaint_id={selectedComplaintForClose}
        onClose={() => setSelectedComplaintForClose(null)}
        onRefresh={() =>
          fetchData(dates.start.toISOString(), dates.end.toISOString())
        }
        base={base}
      />
    </div>
  );
}

const AddNewComplaint = ({ visible, onClose, onRefresh, base }) => {
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: null,
      problem: "",
      solution: "",
      installation: false,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/${UserState.value.data?.id}/complaint`,
        {
          ...values,
          status: "pending",
        }
      );
      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (err) => {
              console.log("Validation Errors", err);
            })}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="installation"
              render={({ field }) => (
                <div className="flex flex-row items-center gap-2">
                  <FormLabel>
                    Machine Installation? <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <div>
                  <FormLabel>
                    {form.watch("installation") === true
                      ? "Title"
                      : "Complaint"}{" "}
                    <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter ${
                        form.watch("installation") === true
                          ? "title"
                          : "complaint"
                      }`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <div>
                  <FormLabel>
                    Select Customer <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <CustomerSearch
                      value={field.value}
                      onReturn={(val) => field.onChange(val)}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            {form.watch("installation") === false && (
              <>
                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <div>
                      <FormLabel>Problem</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter problem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="solution"
                  render={({ field }) => (
                    <div>
                      <FormLabel>Solution</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter solution" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
              </>
            )}

            <Button disabled={loading} type="submit" className="mt-2 w-full">
              {loading && <Spinner />} Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const AssignEngineerModal = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,
  base,
}) => {
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);

  const form = useForm({
    resolver: zodResolver(formSchemaEngineer),
    defaultValues: {
      engineer_id: null,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/${UserState.value.data?.id}/complaint-assignments`,
        {
          ...values,
          complaint_id: complaint_id,
          assigned_by: UserState.value.data.id,
        }
      );
      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Engineer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (err) => {
              console.log("Validation Errors", err);
            })}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="engineer_id"
              render={({ field }) => (
                <div>
                  <FormLabel>
                    Engineer <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <UserSearch value={field.value} onReturn={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <Button disabled={loading} type="submit" className="mt-2 w-full">
              {loading && <Spinner />} Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const CloseComplaint = ({
  visible,
  onClose,
  onRefresh,
  complaint_id,
  base,
}) => {
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);

  const form = useForm({
    resolver: zodResolver(formSchemaClosing),
    defaultValues: {
      status: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const responseLog = await axios.post(
        `/${UserState.value.data?.id}/complaint-logs`,
        {
          remark: values.status,
          engineer_id: UserState.value.data?.id,
          complaint_id: complaint_id,
        }
      );
      const response = await axios.put(
        `/${UserState.value.data?.id}/complaint`,
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

  function handleClose(val) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Complaint</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (err) => {
              console.log("Validation Errors", err);
            })}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <div>
                  <FormLabel>
                    Closing Remarks <RequiredStar />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <Button disabled={loading} type="submit" className="mt-2 w-full">
              {loading && <Spinner />} Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
