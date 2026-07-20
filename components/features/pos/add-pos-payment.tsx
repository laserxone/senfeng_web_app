import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import Dropzone from "@/components/shared/uploads/dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce } from "@/lib/debounce";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type ErrorType = {
  part_id: number
  errorMessage: string
}

const formSchema = z.object({
  note: z.string().min(1, { message: "TID is required." }),
  amount: z.coerce.number<number>().min(1, "Amount is required"),
  mode: z.string().min(1, { message: "Payment mode is required." }),
  received_by: z.string().min(1, { message: "Bank name is required." }),
  transaction_date: z.date({
    error: "Transaction date is required.",
  }),
  clearance_date: z.date().optional(),
  image: z.string().min(1, { message: "Image by is required." }),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddPOSPayment = ({
  visible,
  onClose,
  onRefresh,
  part_id,
  customer_id
}: {
  visible: boolean,
  onClose: (val: boolean) => void,
  onRefresh: () => Promise<void>,
  part_id: number | null | undefined,
  customer_id?: number | undefined | null
}) => {

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { state: OfficeState } = useContext(OfficeContext)!
  const { userID, base_route } = useUserDetail();
  const [lockTID, setLockTID] = useState(false);
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
    },
  });
  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/customer/${customer_id}/parts/${part_id}/payment/${moment()
          .valueOf()
          .toString()}.png`;
        const imgRef = await UploadImage(values.image, name);
        const response = await axios.post(`/${userID}/pos/payment-invoice`, {
          ...values,
          part_id,
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
      const response = await axios.post(
        `/${userID}/pos/payment-invoice/check-note`,
        { number },
        {
          cancelKey: `check-note-${userID}`,
        },
      );
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
      <DialogContent className="w-full sm:max-w-[95vw] p-4">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 max-h-[7d5vh] sm:max-h-[85vh]"
          style={{
            display: "flex",
            flexDirection: imageFile ? "row" : "column",
            gap: imageFile ? 16 : 0,
          }}
        >
          <div className="w-full sm:w-[30%] flex">
            <ScrollArea className="px-2 w-full h-[calc(100dvh-160px)]">
              <div className="px-2">
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
                >
                  <FieldGroup>

                    {/* Amount */}
                    <Controller
                      name="amount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Amount <RequiredStar />
                          </FieldLabel>

                          <Input
                            placeholder="Enter amount"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* TID */}
                    <Controller
                      name="note"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            TID <RequiredStar />
                          </FieldLabel>

                          <div className="flex">
                            <Input
                              disabled={lockTID}
                              placeholder="Enter TID"
                              {...field}
                            />
                            {checking && <Spinner className="ml-2" />}
                          </div>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Error Link */}
                    {error?.errorMessage && (
                      <Link
                        target="blank"
                        className="text-red-500 text-sm"
                        href={
                          `/${base_route}/pos/${error.part_id}` ||
                          "#"
                        }
                      >
                        {error.errorMessage}
                      </Link>
                    )}

                    {/* Payment Mode */}
                    <Controller
                      name="mode"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Payment Mode <RequiredStar />
                          </FieldLabel>

                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);

                              if (val === "Cash") {
                                form.setValue(
                                  "note",
                                  moment().format("YYYYMMDDHHmmss").toString()
                                );
                                setLockTID(true);
                              } else {
                                if (form.getValues("note") && lockTID) {
                                  setLockTID(false);
                                }
                              }
                            }}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>

                            <SelectContent>
                              {["Cheque", "Cash", "Deposit", "Online", "Pay Order"].map(
                                (item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
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

                    {/* Bank Name */}
                    <Controller
                      name="received_by"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Bank Name <RequiredStar />
                          </FieldLabel>

                          <Input placeholder="Enter bank name" {...field} />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Transaction Date */}
                    <Controller
                      name="transaction_date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Transaction Date <RequiredStar />
                          </FieldLabel>

                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Clearance Date */}
                    <Controller
                      name="clearance_date"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Clearance Date</FieldLabel>

                          <AppCalendar
                            date={field.value}
                            onChange={(date) => {
                              field.onChange(date);
                            }}
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Remarks */}
                    <Controller
                      name="remarks"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Remarks</FieldLabel>

                          <Textarea placeholder="Enter remarks" {...field} />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Image */}
                    <Controller
                      name="image"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Image <RequiredStar />
                          </FieldLabel>

                          <div className="flex flex-1 items-center justify-center">
                            <Dropzone
                              noImage
                              value={field.value}
                              onDrop={field.onChange}
                              title="Click to upload"
                              subheading="or drag and drop"
                              description="PNG or JPG"
                              drag="Drop the files here..."
                            />
                          </div>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Submit */}
                    <Button
                      disabled={!!error?.errorMessage || checking || loading}
                      className="w-full"
                      type="submit"
                    >
                      {loading && <Spinner />} Submit
                    </Button>

                  </FieldGroup>
                </form>
              </div>
            </ScrollArea>
          </div>

          {imageFile && (
            <div className="w-full sm:w-[75%] flex justify-center items-center">
              <img
                src={imageFile}
                alt="Selected Image"
                className="w-full max-h-[90vh] object-contain"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPOSPayment;
