"use client";

import PageTable from "@/components/app-table-without-pagination";
import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";

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
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import moment from "moment";
import { RequiredStar } from "../RequiredStar";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import DOPDFGatepass from "./do-pdf-gatepass";
import { pdf } from "@react-pdf/renderer";

export default function MachineDelivery() {
  const { userID, name } = useUserDetail();
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
        if (row.original?.delivery_date) {
          return (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                generatePDF(row.original);
              }}
            >
              Open DO
            </Button>
          );
        } else {
          return (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDelivery(row.original);
                //   setSelectedCustomerId(currentItem?.id);
                //   setShowConfirmation(true);
              }}
            >
              Create Delivery
            </Button>
          );
        }
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

  const generatePDF = async (item) => {
    const PDFData = {
      order_no : item?.order_no_arr?.join(" "),
      gate_pass: item.id,
      to: item?.customer_name || customer?.owner,
      tod: moment(item?.delivery_date).format("YYYY-MM-DD hh:mm A"),
      driver_number:
        item?.dispatch_information?.other_information?.driverNumber,
      driver_name: item?.dispatch_information?.other_information?.driverName,
      vehicle_no : item?.dispatch_information?.other_information?.vehicleNo,
      manager: item?.dispatch_information?.other_information?.manager,
      deliver_issued_by: name,
      checklist: item?.dispatch_information?.checklist,
    };

    try {
      const blob = await pdf(
        <DOPDFGatepass
          from={PDFData.deliver_issued_by}
          vehicle_no={PDFData.vehicle_no}
          driver_no={PDFData.driver_number}
          driver_name={PDFData.driver_name}
          received_by={PDFData.to}
          order_no={PDFData.order_no}
          manager={PDFData.manager}
          gatepass={PDFData.gate_pass}
          gatepassType={"Outward Gate Pass"}
          time={PDFData.tod}
          items={PDFData.checklist}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch (error) {
      console.log(error);
    }
  };
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
        onRefresh={fetchData}
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
  const [form, setForm] = useState({});

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/settings`);
      setID(response.data?.id);
      const apiList = response.data?.machine_checklist;
      (setForm(apiList), setOpen(true));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, val) {
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));
  }

  function handleChangeKey(oldKey, newKey) {
    if (!newKey || oldKey === newKey) return;

    setForm((prev) => {
      const updated = { ...prev };
      if (updated[newKey]) return prev;

      updated[newKey] = updated[oldKey];
      delete updated[oldKey];

      return updated;
    });
  }

  function handleAddNew() {
    const newKey = `new_key_${Date.now()}`;

    setForm((prev) => ({
      ...prev,
      [newKey]: "",
    }));
  }

  function onClose() {
    setOpen(false);
  }

  function normalizeKey(key) {
    return key.toLowerCase().trim().replace(/\s+/g, "_");
  }

  async function handleSave() {
    if (!userID || !ID) return;
    setSaveLoading(true);
    try {
      const formattedForm = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [normalizeKey(k), v]),
      );

      await axios.put(`/${userID}/settings`, {
        id: ID,
        machine_checklist: formattedForm,
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

          <ScrollArea className="h-[70dvh] pr-4 py-2">
            <div className="space-y-4 px-2">
              {Object.entries(form).map(([k, v]) => (
                <div key={k} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Field Name</Label>
                    <Input
                      value={k}
                      onChange={(e) => handleChangeKey(k, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Field Value</Label>
                    <Input
                      value={v}
                      placeholder={`Enter ${k.replaceAll("_", " ")}`}
                      onChange={(e) => handleChange(k, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={handleAddNew}>
                <Plus /> Add Field
              </Button>
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
  vehicleNo: z.string().min(1, "Driver number is required"),
  dispatchTime: z.string().min(1, "Dispatch time is required"),
  manager: z.string().min(1, "Manager name is required"),
  image: z.string().min(1, "Image is required"),
  note: z.string().optional(),
});

function DispatchOrderDialog({ open, onClose, onRefresh, data }) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState({});
  const { state: OfficeState } = useContext(OfficeContext);
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
      vehicleNo: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
    },
  });

  async function fetchData() {
    if (!userID) return;
    setChecklistLoading(true);
    try {
      const response = await axios.get(`/${userID}/settings`);
      const apiList = response.data?.machine_checklist || {};
      const sorted = Object.fromEntries(
        Object.entries(apiList).sort(([a], [b]) => a.localeCompare(b)),
      );
      setChecklist(sorted);
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
      const name = `${OfficeState.value.data}/customer/${data?.customer_id}/machine/${data?.id}/dispatch/${moment().valueOf().toString()}.png`;

      // const imgName =
      const imageRefResult = await UploadImage(values.image, name);

      const apiData = {
        machine_id: data.id,
        delivery_date: values?.dispatchTime
          ? new Date(values.dispatchTime)
          : new Date(),
        order_no_arr: [values.orderNo],
        machine_nameplate_images: [name],
        dispatch_information: {
          checklist: checklist,
          other_information: {
            orderNo: values.orderNo,
            driverName: values.driverName,
            driverNumber: values.driverNumber,
            vehicleNo : values.vehicleNo,
            dispatchTime: values.dispatchTime,
            manager: values.manager,
            note: values.note,
            image: name,
          },
        },
      };

      await axios.post(`/${userID}/delivery`, apiData);

      await onRefresh?.();
      handleClose();
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

  function handleClose() {
    setLoading(false);
    setChecklistLoading(false);
    setChecklist({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Dispatch Order</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 border rounded-lg">
            <ScrollArea className="h-[85dvh]">
              <div className="p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-5"
                  >
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
                              placeholder="Enter vehicle number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Vehicle No <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter vehicle number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                      {checklistLoading ? (
                        <Spinner />
                      ) : (
                        Object.entries(checklist).map(([k, v]) => (
                          <div key={k}>
                            <Label className="capitalize">
                              {k.replaceAll("_", " ")}
                            </Label>
                            <Input
                              value={v}
                              placeholder={`Enter ${k.replaceAll("_", " ")}`}
                              onChange={(e) => handleChnage(k, e.target.value)}
                            />
                          </div>
                        ))
                      )}
                    </div>

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

          <div className="border rounded-lg  bg-muted/30">
            <ScrollArea className="h-[85dvh] p-5">
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
