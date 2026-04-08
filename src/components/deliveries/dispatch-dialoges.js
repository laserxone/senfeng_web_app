import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useContext, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
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
import { Progress } from "@/components/ui/progress";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import moment from "moment";
import { RequiredStar } from "../RequiredStar";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { TriggerFirebaseForMachine } from "@/lib/triggerFirebase";

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

export function DispatchOrderEditDialog({ open, onClose, onRefresh, data }) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [progress, setProgress] = useState(0);
  const { userID } = useUserDetail();
  const [originalImage, setOriginalImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  useEffect(() => {
    if (userID && open) {
      setData();
    }
  }, [userID, open]);

  async function setData() {
    if (!userID) return;
    const dispatchInformation = data?.dispatch_information;
    if (dispatchInformation) {
      form.reset({
        dispatchTime: dispatchInformation?.other_information?.dispatchTime,
        driverName: dispatchInformation?.other_information?.driverName,
        driverNumber: dispatchInformation?.other_information?.driverNumber,
        vehicleNo: dispatchInformation?.other_information?.vehicleNo,
        orderNo: dispatchInformation?.other_information?.orderNo,
        manager: dispatchInformation?.other_information?.manager,
        note: dispatchInformation?.other_information?.note,
        image: dispatchInformation?.other_information?.image,
      });
      setOriginalImage(dispatchInformation?.other_information?.image);
      setChecklist(dispatchInformation?.checklist);
    }
  }

  function handleChnage(key, val) {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(values) {
    setLoading(true);

    try {
      let name = data?.dispatch_information?.other_information?.image;
      if (
        values.image !== data?.dispatch_information?.other_information?.image
      ) {
        const imageRefResult = await UploadImage(
          values.image,
          name,
          "image/png",
          (p) => setProgress(p),
        );
      }

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
            vehicleNo: values.vehicleNo,
            dispatchTime: values.dispatchTime,
            manager: values.manager,
            note: values.note,
            image: name,
          },
        },
      };

      await axios.put(`/${userID}/delivery`, apiData);
      TriggerFirebaseForMachine()
      await onRefresh?.();
      handleClose();
      form.reset();
    } finally {
      setProgress(0);
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

  async function handleDelete() {
    if (!userID || !data?.id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/${userID}/delivery?id=${data.id}`);
       TriggerFirebaseForMachine()
      await onRefresh?.();
      handleClose();
    } finally {
      setDeleteLoading(false);
    }
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
                              dbImage={originalImage}
                              value={field.value}
                              onDrop={(file) => {
                                field.onChange(file);
                                setOriginalImage(null);
                              }}
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

                    <div className="flex flex-col w-full">
                      {progress > 0 && (
                        <div className="mt-1 space-y-1">
                          <Label>Uploading Image</Label>
                          <Progress
                            className="mt-2"
                            value={progress}
                            id="progress-upload-nameplate"
                          />
                        </div>
                      )}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>

                        <Button type="submit" disabled={loading}>
                          {loading ? "Processing..." : "Dispatch"}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          type="button"
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
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

export function DispatchOrderDialog({
  open,
  onClose,
  onRefresh,
  data,
  openPdf,
}) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState({});
  const { state: OfficeState } = useContext(OfficeContext);
  const [progress, setProgress] = useState(0);
  const { userID, name: userName } = useUserDetail();

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
      const imageRefResult = await UploadImage(
        values.image,
        name,
        "image/png",
        (p) => setProgress(p),
      );

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
            vehicleNo: values.vehicleNo,
            dispatchTime: values.dispatchTime,
            manager: values.manager,
            note: values.note,
            image: name,
            issuedBy: userName,
          },
        },
      };

      await axios.post(`/${userID}/delivery`, apiData);
       TriggerFirebaseForMachine()
      await openPdf({
        order_no: apiData.order_no_arr,
        gate_pass: `DO-${data?.id}`,
        delivery_date: apiData.delivery_date,
        to: data?.customer_name || data?.customer?.owner,
        tod: moment(apiData.delivery_date).format("YYYY-MM-DD hh:mm A"),
        driver_number:
          apiData.dispatch_information.other_information.driverNumber,
        driver_name: apiData.dispatch_information.other_information.driverName,
        vehicle_no: apiData.dispatch_information.other_information.vehicleNo,
        manager: apiData.dispatch_information.other_information.manager,
        delivery_issued_by:
          apiData.dispatch_information.other_information.issuedBy,
        checklist: apiData.dispatch_information.checklist,
      });
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

                    <div className="flex flex-col w-full">
                      {progress > 0 && (
                        <div className="mt-1 space-y-1">
                          <Label>Uploading Image</Label>
                          <Progress
                            className="mt-2"
                            value={progress}
                            id="progress-upload-nameplate"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>

                        <Button type="submit" disabled={loading}>
                          {loading ? "Processing..." : "Dispatch"}
                        </Button>
                      </div>
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
