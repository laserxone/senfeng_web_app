import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data";
import Dropzone from "@/components/shared/uploads/dropzone";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { UserSearch } from "@/components/shared/search/user-search";

const AddReimbursementDialog = ({
  onRefresh,
  id,
  open,
  onClose,
}: {
  onRefresh?: () => Promise<void>;
  id?: number | string | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null,
  );
  const { state: OfficeState } = useContext(OfficeContext)!;
  const [loading, setLoading] = useState(false);

  const formSchema = z
    .object({
      title: z.string().min(1, { message: "Purpose is required." }),
      customer: z.number({ error: "Customer is required." }).nullable(),
      description: z.string().min(1, { message: "Description is required." }),
      amount: z.coerce.number<number>().min(1, "Amount is required"),
      date: z.date({ error: "Date is required." }),
      image: z.string().min(1, { message: "Image is required." }),
      submitted_by: z.number().min(1, { message: "User is required" }),
      city: z.string().min(1, { message: "City is required." }),
      resolved: z.boolean().optional(),
    })
    .refine(
      (data) =>
        selectedRadio !== "customer" ||
        (data.customer !== undefined && data.customer !== null),
      {
        path: ["customer"],
        message: "Customer is required.",
      },
    );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      date: undefined,
      submitted_by: undefined,
      image: "",
      city: "",
      customer: null,
      resolved: false,
    },
  });

  useEffect(() => {
    if (id) {
      form.setValue("submitted_by", Number(id));
    }
  }, [id]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const name = `${OfficeState.value.data}/${id}/reimbursement/${moment().valueOf().toString()}.png`;
      const imgRef = await UploadImage(values.image, name);
      const response = await axios.post(`/${id}/reimbursement`, {
        amount: values.amount,
        title: values.title,
        description: values.description,
        city: values.city,
        image: name,
        date: values.date,
        submitted_by: values.submitted_by,
        customer_id: selectedRadio === "customer" ? values.customer : null,
        purpose: true,
        resolved: values.resolved,
      });
      onRefresh?.();
      form.reset();
      setSelectedCustomer(null);
      setSelectedRadio("customer");
      onClose();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        form.reset();
        setSelectedCustomer(null);
        setSelectedRadio("customer");
        setLoading(false);
        onClose();
      }}
    >
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Add New Reimbursement
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Capture visit purpose, expense details, submitter, and receipt
                attachment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5 pb-4">
            <RadioGroup
              defaultValue={selectedRadio}
              onValueChange={setSelectedRadio}
              className="grid gap-2 sm:grid-cols-2"
            >
              <div className="flex items-center space-x-2 rounded-lg border bg-background px-3 py-2">
                <RadioGroupItem value="customer" id="r1" />
                <Label className="text-sm font-medium" htmlFor="r1">
                  Customer
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border bg-background px-3 py-2">
                <RadioGroupItem value="other" id="r2" />
                <Label className="text-sm font-medium" htmlFor="r2">
                  Other
                </Label>
              </div>
            </RadioGroup>
            <form
              onSubmit={form.handleSubmit(onSubmit, (er) => {
                console.log(er);
              })}
              className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* Trip Details */}
                <FieldSet className="gap-3 rounded-lg border bg-background p-3 shadow-sm shadow-slate-100/70">
                  <FieldLegend className="px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Trip Details
                  </FieldLegend>

                  {/* Customer (conditional) */}
                  {selectedRadio === "customer" && (
                    <Controller
                      name="customer"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="text-xs font-medium">
                            Customer <RequiredStar />
                          </FieldLabel>
                          <CustomerSearchWithData
                            value={selectedCustomer}
                            onReturn={(val) => {
                              field.onChange(val.id);
                              setSelectedCustomer(val);
                              if (val.location) {
                                form.setValue("city", val.location);
                              }
                              form.setValue(
                                "title",
                                val?.company || val?.owner || "",
                              );
                            }}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}

                  {/* Purpose */}
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-xs font-medium">
                          Purpose <RequiredStar />
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select Purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="New Installation">
                                New Installation
                              </SelectItem>
                              <SelectItem value="Complaint">
                                Complaint
                              </SelectItem>
                              <SelectItem value="Overhauling">
                                Overhauling
                              </SelectItem>
                              <SelectItem value="Sales Meeting">
                                Sales Meeting
                              </SelectItem>
                              <SelectItem value="Final Hand Over">
                                Final Hand Over
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Resolved (conditional) */}
                  {(form.watch("title") === "Complaint" ||
                    form.watch("title") === "Overhauling") && (
                    <Controller
                      name="resolved"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2">
                            <FieldLabel className="text-xs font-medium">
                              Resolved?
                            </FieldLabel>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked: boolean) =>
                                field.onChange(checked)
                              }
                            />
                          </div>
                        </Field>
                      )}
                    />
                  )}

                  {/* City */}
                  <Controller
                    name="city"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs font-medium">
                          City <RequiredStar />
                        </FieldLabel>
                        <Input
                          className="h-9"
                          placeholder="Enter city"
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Expense Details */}
                <FieldSet className="gap-3 rounded-lg border bg-background p-3 shadow-sm shadow-slate-100/70">
                  <FieldLegend className="px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Expense Details
                  </FieldLegend>

                  {/* Amount */}
                  <Controller
                    name="amount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs font-medium">
                          Amount <RequiredStar />
                        </FieldLabel>
                        <Input
                          className="h-9"
                          type="number"
                          placeholder="Enter amount"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            if (!isNaN(Number(e.target.value))) {
                              field.onChange(Number(e.target.value));
                            }
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Date */}
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="text-xs font-medium">
                          Date <RequiredStar />
                        </FieldLabel>
                        <AppCalendar
                          date={field.value}
                          onChange={field.onChange}
                          min={
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1,
                            )
                          }
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Submitted By */}
                  {!id && (
                    <Controller
                      name="submitted_by"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel className="text-xs font-medium">
                            Select User <RequiredStar />
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
                  )}
                </FieldSet>

                {/* Description */}
                <FieldSet className="gap-3 rounded-lg border bg-background p-3 shadow-sm shadow-slate-100/70 lg:col-span-2">
                  <FieldLegend className="px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Description
                  </FieldLegend>

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <Textarea
                          className="min-h-20 resize-none"
                          placeholder="Enter description"
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Attachment */}
                <FieldSet className="gap-3 rounded-lg border bg-slate-50/70 p-3 lg:col-span-2">
                  <FieldLegend className="px-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Attachment
                  </FieldLegend>

                  <Controller
                    name="image"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
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
              </div>

              {/* Submit */}
              <Button className="h-9 w-full" type="submit" disabled={loading}>
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddReimbursementDialog;
