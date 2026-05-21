import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useContext, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TriggerFirebaseForMachine, TriggerFirebaseForPendingPayments } from "@/lib/triggerFirebase";
import { DeliveryInformation, DeliveryType, DispatchPdf } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { Controller, useForm } from "react-hook-form";
import { RequiredStar } from "../RequiredStar";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "../ui/field";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { Textarea } from "../ui/textarea";

const dispatchSchema = z.object({
  orderNo: z
    .array(z.string().min(1, "Order number is required"))
    .min(1, "At least one order number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  transporter: z.string().min(1, "Transporter name is required"),
  driverNumber: z.string().min(1, "Driver number is required"),
  vehicleNo: z.string().min(1, "Driver number is required"),
  dispatchTime: z.string().min(1, "Dispatch time is required"),
  manager: z.string().min(1, "Manager name is required"),
  image: z.string().min(1, "Image is required"),
  transportation: z.coerce.number<number>().min(0, "Amount is required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof dispatchSchema>;

export function DispatchOrderEditDialog({ open, onClose, onRefresh, data }:
  {
    open: boolean,
    onClose: () => void,
    onRefresh: () => Promise<void>,
    data: DeliveryType | null,
  }) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const { userID } = useUserDetail();
  const [originalImage, setOriginalImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      orderNo: [""],
      driverName: "",
      driverNumber: "",
      vehicleNo: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
      transportation: 0,
      transporter : ""
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
        transporter : dispatchInformation?.other_information?.transporter ?? ""
      });
      setOriginalImage(dispatchInformation?.other_information?.image);
      setChecklist(dispatchInformation?.checklist);
    }
  }

  function handleChnage(key: string, val: string) {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(values: FormValues) {
    if (!data) return
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
        order_no_arr: values.orderNo,
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
            transporter : values.transporter
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
    form.reset({
      orderNo: [""],
      driverName: "",
      driverNumber: "",
      vehicleNo: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
      transportation: 0,
      transporter : ""
    })
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

                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldSet className="md:col-span-2 border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Order Information
                      </FieldLegend>

                      <Controller
                        name="orderNo"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-sm">
                              Order No <RequiredStar />
                            </FieldLabel>

                            <div className="space-y-2">
                              {(field.value || []).map((order: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter order number"
                                    value={order}
                                    onChange={(e) => {
                                      const updated = [...(field.value || [])]
                                      updated[index] = e.target.value
                                      field.onChange(updated)
                                    }}
                                  />

                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="size-8"
                                    disabled={(field.value || []).length === 1}
                                    onClick={() => {
                                      field.onChange(
                                        (field.value || []).filter(
                                          (_: string, i: number) => i !== index
                                        )
                                      )
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              size="icon"
                              className="mt-2 size-8"
                              onClick={() => field.onChange([...(field.value || []), ""])}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>

                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Driver Details
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="driverName"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Driver Name <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter driver name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="driverNumber"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Driver Number <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter vehicle number" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                         <Controller
                          name="transporter"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Transporter Name <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter transporter name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Vehicle & Transport
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="vehicleNo"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Vehicle No <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter vehicle number" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="transportation"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Transportation Charges <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter transportation charges" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="dispatchTime"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Time of Dispatch <RequiredStar />
                              </FieldLabel>
                              <Input type="datetime-local" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <FieldSet className="md:col-span-2 border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Machine Details
                      </FieldLegend>

                      <Controller
                        name="image"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-sm">
                              Machine Nameplate <RequiredStar />
                            </FieldLabel>

                            <Dropzone
                              dbImage={originalImage}
                              value={field.value}
                              onDrop={(file) => {
                                field.onChange(file)
                                setOriginalImage(null)
                              }}
                              title="Click to upload"
                              subheading="or drag and drop"
                              description="PNG or JPG"
                              drag="Drop the files here..."
                              className="w-full"
                            />

                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Manager & Note
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="manager"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Manager <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter manager name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="note"
                          control={form.control}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel className="text-sm">Receiving Note</FieldLabel>
                              <Textarea placeholder="Enter note (optional)" {...field} />
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        CheckList
                      </FieldLegend>

                      <div className="space-y-3">
                        {checklistLoading ? (
                          <Spinner />
                        ) : (
                          Object.entries(checklist).map(([k, v]) => (
                            <Field key={k}>
                              <FieldLabel className="text-sm capitalize">
                                {k.replaceAll("_", " ")}
                              </FieldLabel>

                              <Input
                                value={v as string}
                                placeholder={`Enter ${k.replaceAll("_", " ")}`}
                                onChange={(e) => handleChnage(k, e.target.value)}
                              />
                            </Field>
                          ))
                        )}
                      </div>
                    </FieldSet>
                  </div>

                  {progress > 0 && (
                    <div className="mt-4 space-y-1">
                      <Label className="text-sm">Uploading Image</Label>
                      <Progress
                        className="mt-2"
                        value={progress}
                        id="progress-upload-nameplate"
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Processing..." : "Dispatch"}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </form>

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
                          : String(data?.delivery_information[key as keyof DeliveryInformation])}
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
}:
  {
    open: boolean,
    onClose: () => void,
    onRefresh: () => Promise<void>,
    data: DeliveryType | null,
    openPdf: (item: DispatchPdf) => Promise<void>,
  }) {
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, any>>({});
  const { state: OfficeState } = useContext(OfficeContext);
  const [progress, setProgress] = useState(0);
  const { userID, name: userName } = useUserDetail();

  useEffect(() => {
    if (userID && open) {
      fetchData();
    }
  }, [userID, open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      orderNo: [""],
      driverName: "",
      driverNumber: "",
      vehicleNo: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
      transportation: 0,
      transporter : ""
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

  function handleChnage(key: string, val: string) {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(values: FormValues) {
    if (!data) return
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
        transportation: values?.transportation,
        delivery_date: values?.dispatchTime
          ? new Date(values.dispatchTime)
          : new Date(),
        order_no_arr: values.orderNo,
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
            transporter : values.transporter
          },
        },
      };

      await axios.post(`/${userID}/delivery`, apiData);
      TriggerFirebaseForMachine()
      TriggerFirebaseForPendingPayments()
      await openPdf({
        order_no: `${apiData?.order_no_arr?.join(" ")} - ${data?.serial_no} - ${data?.power} - ${data?.source}`,
        gate_pass: `DO-${data?.id}`,
        delivery_date: apiData.delivery_date,
        to: data?.customer_name || data?.customer_owner,
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
    form.reset({
      orderNo: [""],
      driverName: "",
      driverNumber: "",
      vehicleNo: "",
      dispatchTime: "",
      manager: "",
      image: "",
      note: "",
      transportation: 0,
      transporter : ""
    })
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


                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ORDER INFORMATION */}
                    <FieldSet className="md:col-span-2 border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Order Information
                      </FieldLegend>

                      <Controller
                        name="orderNo"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-sm">
                              Order No <RequiredStar />
                            </FieldLabel>

                            <div className="space-y-2">
                              {(field.value || []).map((order: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter order number"
                                    value={order}
                                    onChange={(e) => {
                                      const updated = [...(field.value || [])]
                                      updated[index] = e.target.value
                                      field.onChange(updated)
                                    }}
                                  />

                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="size-8"
                                    disabled={(field.value || []).length === 1}
                                    onClick={() => {
                                      field.onChange(
                                        (field.value || []).filter(
                                          (_: string, i: number) => i !== index
                                        )
                                      )
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => field.onChange([...(field.value || []), ""])}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Order No
                            </Button>

                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Driver Details
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="driverName"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Driver Name <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter driver name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="driverNumber"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Driver Number <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter driver number" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                          <Controller
                          name="transporter"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Transporter Name <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter transporter name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Vehicle & Transport
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="vehicleNo"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Vehicle No <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter vehicle number" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="transportation"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Transportation Charges <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter transportation charges" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="dispatchTime"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Time of Dispatch <RequiredStar />
                              </FieldLabel>
                              <Input type="datetime-local" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <FieldSet className="md:col-span-2 border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Machine Details
                      </FieldLegend>

                      <Controller
                        name="image"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel className="text-sm">
                              Machine Nameplate <RequiredStar />
                            </FieldLabel>
                            <Dropzone
                              value={field.value}
                              onDrop={(file) => field.onChange(file)}
                              title="Click to upload"
                              subheading="or drag and drop"
                              description="PNG or JPG"
                              drag="Drop the files here..."
                              className="w-full"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        Manager & Note
                      </FieldLegend>

                      <div className="space-y-3">
                        <Controller
                          name="manager"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-sm">
                                Manager <RequiredStar />
                              </FieldLabel>
                              <Input placeholder="Enter manager name" {...field} />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        <Controller
                          name="note"
                          control={form.control}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel className="text-sm">Receiving Note</FieldLabel>
                              <Textarea placeholder="Enter note (optional)" {...field} />
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <FieldSet className="border rounded-md p-3">
                      <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                        CheckList
                      </FieldLegend>

                      <div className="space-y-3">
                        {checklistLoading ? (
                          <Spinner />
                        ) : (
                          Object.entries(checklist).map(([k, v]) => (
                            <Field key={k}>
                              <FieldLabel className="text-sm capitalize">
                                {k.replaceAll("_", " ")}
                              </FieldLabel>

                              <Input
                                value={v as string}
                                placeholder={`Enter ${k.replaceAll("_", " ")}`}
                                onChange={(e) => handleChnage(k, e.target.value)}
                              />
                            </Field>
                          ))
                        )}
                      </div>
                    </FieldSet>
                  </div>

                  {progress > 0 && (
                    <div className="mt-4 space-y-1">
                      <Label className="text-sm">Uploading Image</Label>
                      <Progress value={progress} id="progress-upload-nameplate" />
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Processing..." : "Dispatch"}
                    </Button>
                  </div>
                </form>


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
                          : String(data?.delivery_information[key as keyof DeliveryInformation])}
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
