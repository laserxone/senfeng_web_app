import Dropzone from "@/components/shared/uploads/dropzone";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce } from "@/lib/debounce";
import { UploadImage } from "@/lib/uploadFunction";
import { cn } from "@/lib/utils";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { WalletCards } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  note: z.string().min(1, { message: "TID is required." }),
  amount: z.coerce.number<number>().min(0, "Amount is required"),
  mode: z.string().min(1, { message: "Payment mode is required." }),
  received_by: z.string().min(1, { message: "Bank name is required." }),
  transaction_date: z.date({
    error: "Transaction date is required.",
  }),
  clearance_date: z.date().optional(),
  image: z.string().min(1, { message: "Image is required." }),
  remarks: z.string().optional(),
  cheque_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "Cheque" && (!data.cheque_id || data.cheque_id.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cheque ID is required when payment mode is Cheque.",
      path: ["cheque_id"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

type ErrorType = {
  part_id: number
  errorMessage: string
  machine_id: number
  saleData: { customer_id: number }[]
}

const AddPayment = ({
  visible,
  onClose,
  onRefresh,
  machine_id,
  customer_id,
}: {
  visible: boolean,
  onClose: (val: boolean) => void,
  onRefresh: () => Promise<void>
  machine_id?: number | string
  customer_id?: number
}) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { userID, base_route } = useUserDetail()
  const { state: OfficeState } = useContext(OfficeContext)!
  const [lockTID, setLockTID] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null);



  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: 0,
      mode: "",
      received_by: "",
      transaction_date: undefined,
      clearance_date: undefined,
      image: "",
      remarks: "",
      cheque_id: "",

    },
  });
  async function onSubmit(values: FormValues) {

    setLoading(true);
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/customer/${customer_id}/machine/${machine_id}/payment/${moment()
          .valueOf()
          .toString()}.png`;
        const imgRef = await UploadImage(values.image, name);
        const response = await axios.post(`/${userID}/payment`, {
          ...values,
          machine_id: machine_id,
          image: name,
        });
        toast.success("Payment addedd successfully");
        onRefresh();
        handleClose(false);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }


  function handleClose(val: boolean) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

  const imageFile = form.watch("image");

  const isMobile = useIsMobile()

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "note") {
        debouncedCheckNumber(value.note);
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const checkNumberInDatabase = async (number: string) => {
    setChecking(true);
    setError(null);
    try {
      const response = await axios.post(`/${userID}/check-note`, { number },
        {
          cancelKey: `check-note-${userID}`,
        },);
      if (Array.isArray(response.data) && response.data.length > 0) {

        setError(response.data[0]);
      }
    } catch (error) {
      console.log("Error checking number:", error);
    } finally {
      setChecking(false);
    }
  };

  const debouncedCheckNumber = useCallback(
    debounce(checkNumberInDatabase, 1000),
    []
  );

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground transition-all duration-200",
          imageFile ? "sm:max-w-[90vw]" : "sm:max-w-md"
        )}
      >
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><WalletCards className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Add New Payment</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Record transaction, receiving account, and supporting details.</DialogDescription></div></div>
        </DialogHeader>

        <div className={cn(
          "flex gap-4 max-h-[80vh]",
          imageFile ? "flex-row" : "flex-col"
        )}>
          {/* Form Section */}
          <div className={cn(
            "flex flex-col",
            imageFile ? "w-[320px] shrink-0" : "w-full"
          )}>

            <ScrollArea className="max-h-[calc(100dvh-132px)] pb-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-3 p-3.5 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground">
                  {/* Payment Info */}
                  <FieldSet className="border rounded-md p-3 gap-3">
                    <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Payment Info</FieldLegend>

                    <Controller
                      name="amount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Amount</FieldLabel>
                          <Input placeholder="Enter amount" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="mode"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Payment Mode</FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              if (val === "Cash") {
                                form.setValue("note", moment().format("YYYYMMDDHHmmss"));
                                setLockTID(true);
                              } else {
                                if (form.getValues("note") && lockTID) {
                                  setLockTID(false);
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
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
                      name="note"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>TID</FieldLabel>
                          <div className="flex items-center gap-2">
                            <Input disabled={lockTID} placeholder="Enter TID" {...field} />
                            {checking && <Spinner />}
                          </div>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {error?.errorMessage && (
                      <Link
                        target="blank"
                        className="text-red-500 text-sm"
                        href={
                          `/${base_route}/member/${error.saleData[0]?.customer_id}/${error?.machine_id}` ||
                          "#"
                        }
                      >
                        {error.errorMessage}
                      </Link>
                    )}

                    {form.watch("mode") === "Cheque" && (
                      <Controller
                        name="cheque_id"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Cheque ID</FieldLabel>
                            <Input placeholder="Enter cheque ID" {...field} />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    )}

                    <Controller
                      name="received_by"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Bank Name</FieldLabel>
                          <Input placeholder="Enter bank name" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldSet>

                  {/* Dates */}
                  <FieldSet className="border rounded-md p-3 gap-3">
                    <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Dates</FieldLegend>

                    <Controller
                      name="transaction_date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Transaction Date</FieldLabel>
                          <AppCalendar date={field.value} onChange={field.onChange} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="clearance_date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Clearance Date</FieldLabel>
                          <AppCalendar date={field.value} onChange={field.onChange} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldSet>

                  {/* Additional */}
                  <FieldSet className="border rounded-md p-3 gap-3">
                    <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Additional</FieldLegend>

                    <Controller
                      name="remarks"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Remarks</FieldLabel>
                          <Textarea placeholder="Enter remarks" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="image"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Image</FieldLabel>
                          <Dropzone
                            noImage
                            value={field.value}
                            onDrop={(file) => field.onChange(file)}
                            title="Click to upload"
                            subheading="or drag and drop"
                            description="PNG or JPG"
                            drag="Drop the files here..."
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldSet>

                  <Button
                    type="submit"
                    disabled={!!error?.errorMessage || checking || loading}
                    className="w-full"
                  >
                    {loading && <Spinner />} Submit
                  </Button>
                </div>
                {/* Submit */}


              </form>
            </ScrollArea>

          </div>

          {/* Image Preview Section */}
          {imageFile && !isMobile && (
            <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-md p-4">
              <img
                src={imageFile}
                alt="Selected Image"
                className="max-w-full max-h-[70vh] object-contain rounded-md"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayment;
