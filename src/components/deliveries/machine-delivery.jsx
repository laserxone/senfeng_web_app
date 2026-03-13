"use client";

import PageTable from "@/components/app-table-without-pagination";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import Dropzone from "@/components/dropzone";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { RequiredStar } from "../RequiredStar";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import moment from "moment";
import Spinner from "../ui/spinner";
import { Label } from "../ui/label";

export default function MachineDelivery() {
  const { userID } = useUserDetail();
  const [data, setData] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    const response = await axios.get(`/${userID}/delivery`);
    setData(response.data);
    setLoading(false);
  }

  const columns = [
    {
      accessorKey: "customer_owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("customer_owner")}</div>
      ),
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
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
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },
    {
      accessorKey: "ownership_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manager
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("ownership_name")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("serial_no")}</div>,
    },

    {
      accessorKey: "power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("power")}</div>,
    },

    {
      accessorKey: "source",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("source")}</div>,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        return (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log(row.original);
              setSelectedDelivery(row.original);
              //   setSelectedCustomerId(currentItem?.id);
              //   setShowConfirmation(true);
            }}
          >
            Create Delivery
          </Button>
        );
      },
    },
  ];

  const tableHeader = [
    {
      value: "Owner",
      label: "Owner",
    },
    {
      value: "Name",
      label: "Company Name",
    },
    {
      value: "Number",
      label: "Number",
    },
    {
      value: "Industry",
      label: "Industry",
    },
    {
      value: "customer_group",
      label: "Group",
    },
    {
      value: "Location",
      label: "Location",
    },
    {
      value: "Machines",
      label: "Machines",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Machine Delivery"
          description="Manage machine deliveries"
        />
      </div>

      <PageTable
        columns={columns}
        data={data}
        tableHeader={tableHeader}
        onRowClick={(val, event) => {}}
      >
        <MachineChecklist />
      </PageTable>

      <DispatchOrderDialog
        open={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onRefresh={() => {}}
        data={selectedDelivery}
      />
    </div>
  );
}

const machineChecklistKeys = [
  "machine_sf",
  "motor_cover",
  "dust_cover",
  "nozzle",
  "lens",
  "cermaic_ring",
  "keyboard",
  "remote",
  "toolbox",
  "laser_source",
  "nitrogen_guage",
  "oxygen_guage",
  "mouse",
  "chain_side_cover",
  "lcd_stand",
  "lcd_frame",
  "motor",
  "tray",
  "foot_pad",
  "chiller",
  "blower",
  "lcd",
  "avr",
  "blower_pipe",
];

const MachineChecklist = () => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const [open, setOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [ID, setID] = useState(null);
  const [form, setForm] = useState(
    Object.fromEntries(machineChecklistKeys.map((key) => [key, ""])),
  );


  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/settings`);
      setID(response.data?.id);
      const apiList = response.data?.machine_checklist;
      console.log(apiList)
      setForm(
        Object.fromEntries(
          machineChecklistKeys.map((key) => [key, apiList?.[key] ?? ""]),
        ),
      );
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleChnage(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function onClose() {
    setOpen(false);
  }

  async function handleSave() {
    if (!userID || !ID) return;
    setSaveLoading(true);
    try {
      await axios.put(`/${userID}/settings`, {
        id: ID,
        machine_checklist: form,
      });
      onClose();
    } finally {
      setSaveLoading(false);
    }
  }
  return (
    <>
      <Button disabled={loading} onClick={fetchData}>
        {" "}
        {loading && <Spinner />}Configure Checklist
      </Button>

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Machine Checklist</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[70dvh] pr-4">
            <div className="space-y-4 px-2">
              {machineChecklistKeys.map((item) => (
                <div key={item}>
                  <Label className="capitalize">
                    {item.replaceAll("_", " ")}
                  </Label>
                  <Input
                  value={form?.[item]}
                    placeholder={`Enter ${item.replaceAll("_", " ")}`}
                    onChange={(e) => handleChnage(item, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saveLoading} onClick={handleSave}>
              {saveLoading && <Spinner />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const dispatchSchema = z.object({
  orderNo: z.string().min(1, "Order number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  driverNumber: z.string().min(1, "Driver number is required"),
  dispatchTime: z.string().min(1, "Dispatch time is required"),
  manager: z.string().min(1, "Manager name is required"),
  image: z.string().min(1, "Image is required"),
  note: z.string().optional(),
});

function DispatchOrderDialog({ open, onClose, onRefresh, data }) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID && open) {
      fetchData();
    }
  }, [userID, open]);

  const form = useForm({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      orderNo: "",
      driverName: "",
      driverNumber: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
    },
  });

  const [checklist, setChecklist] = useState(
    Object.fromEntries(machineChecklistKeys.map((key) => [key, ""])),
  );

  async function fetchData() {
    if (!userID) return;
    setChecklistLoading(true);
    try {
      const response = await axios.get(`/${userID}/settings`);
      const apiList = response.data?.machine_checklist;
      setChecklist(
        Object.fromEntries(
          machineChecklistKeys.map((key) => [key, apiList?.[key] ?? ""]),
        ),
      );
    } finally {
      setChecklistLoading(false);
    }
  }

  function handleChnage(key, val) {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(values) {
    setLoading(true);

    try {
      await axios.post("/dispatch", {
        ...values,
        dispatchTime: new Date(values.dispatchTime),
      });

      await onRefresh?.();
      onClose();
      form.reset();
    } finally {
      setLoading(false);
    }
  }

  const DELIVERY_INFORMATION_KEYS = [
    "name",
    "city",
    "address",
    "number",
    "tod",
    "pin",
    "note",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Dispatch Order</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT SIDE - FORM */}
          <div className="md:col-span-2 border rounded-lg">
            <ScrollArea className="h-[75vh]">
              <div className="p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-5"
                  >
                    {/* Order No */}
                    <FormField
                      control={form.control}
                      name="orderNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Order No <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter order number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Driver Name */}
                    <FormField
                      control={form.control}
                      name="driverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Driver Name <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter driver name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Driver Number */}
                    <FormField
                      control={form.control}
                      name="driverNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Driver Number <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter driver contact number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Time of Dispatch */}
                    <FormField
                      control={form.control}
                      name="dispatchTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Time of Dispatch <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image */}
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Machine Nameplate <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Dropzone
                              value={field.value}
                              onDrop={(file) => field.onChange(file)}
                              title="Click to upload"
                              subheading="or drag and drop"
                              description="PNG or JPG"
                              drag="Drop the files here..."
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Manager */}
                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Manager <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter manager name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Note */}
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receiving Note</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter note (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 border border-[#d6d6d6] rounded-md p-4 bg-slate-50">
                      <Label className="font-bold text-lg">CheckList</Label>
                      {checklistLoading ? <Spinner /> : machineChecklistKeys.map((item) => (
                        <div key={item}>
                          <Label className="capitalize">
                            {item.replaceAll("_", " ")}
                          </Label>
                          <Input
                          value={checklist?.[item]}
                            placeholder={`Enter ${item.replaceAll("_", " ")}`}
                            onChange={(e) => handleChnage(item, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>

                      <Button type="submit" disabled={loading}>
                        {loading ? "Processing..." : "Dispatch"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT SIDE - DELIVERY INFO */}
          <div className="border rounded-lg p-5 bg-muted/30">
            <h3 className="text-sm font-semibold mb-4 tracking-wide text-muted-foreground uppercase">
              Delivery Information
            </h3>

            {data?.delivery_information ? (
              <div className="space-y-3 text-sm">
                {DELIVERY_INFORMATION_KEYS.map((key, i) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-2 border-b pb-2 last:border-none"
                  >
                    <p className="text-muted-foreground capitalize">
                      {key === "tod"
                        ? "Delivery Time"
                        : key === "pin"
                          ? "Google location"
                          : key.replaceAll("_", " ")}
                    </p>
                    <p className="font-medium break-words">
                      {key === "tod"
                        ? moment(
                            new Date(data?.delivery_information[key]),
                          ).format("YYYY-MM-DD hh:mm A")
                        : String(data?.delivery_information[key])}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No delivery information available.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
