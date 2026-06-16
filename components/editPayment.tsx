
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce } from "@/lib/debounce";
import { MachinePayment } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";


const formSchema = z.object({
  note: z.string().min(1, { message: "TID is required." }),
  amount: z.coerce.number<number>().min(0, "Amount is required"),
  mode: z.string().min(1, { message: "Payment mode is required." }),
  received_by: z.string().min(1, { message: "Bank name is required." }),
  transaction_date: z.date({
    error: "Transaction date is required.",
  }),
  clearance_date: z.date().optional(),
  remarks: z.string().optional(),
  cheque_id: z.string().optional(),
  status: z.string().optional()
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


const EditPayment = ({
  visible,
  onClose,
  onRefresh,
  machine_id,
  data,

}: {
  visible: boolean,
  onClose: (val: boolean) => void,
  onRefresh: () => Promise<void>
  machine_id?: number | string
  customer_id?: number
  data: MachinePayment | null
}) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<ErrorType | null>(null);

  const { userID, base_route } = useUserDetail();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: 0,
      mode: "",
      received_by: "",
      transaction_date: undefined,
      clearance_date: undefined,
      remarks: "",
      status: ""
    },
  });

  useEffect(() => {

    if (data) {
      form.reset({
        note: data?.note || "",
        amount: Number(data.amount) ?? 0,
        mode: data.mode || "",
        cheque_id: data?.cheque_id,
        received_by: data.received_by || "",
        transaction_date: new Date(data.transaction_date),
        clearance_date: data?.clearance_date
          ? new Date(data.clearance_date)
          : undefined,
        remarks: data?.remarks || "",
        status: data?.status || ""
      });
    }
  }, [data]);

  async function onSubmit(values: FormValues) {
    if (!data?.id) return
    setLoading(true);
    try {
      const response = await axios.put(`/${userID}/payment`, {
        ...values,
        machine_id: machine_id,
        id: data.id,
        status: "pending",
      });
      toast.success("Payment updated successfully");
      onRefresh();
      handleClose(false);
    } catch (e) {
      setLoading(false);
    }
  }

  function handleClose(val: boolean) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

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
      const response = await axios.post(`/${userID}/check-note`, { number });
      if (Array.isArray(response.data) && response.data.length > 0) {
        const apiData = response.data[0];
        if (apiData.note !== data?.note) {
          setError(apiData);
        }
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
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <div className="w-full ">
          <ScrollArea className="px-2 w-full h-[calc(100dvh-160px)]">
            <div className="px-2">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FieldGroup>

                  <Controller
                    name="amount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Amount</FieldLabel>

                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={field.value || ""}
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

                  <Controller
                    name="note"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>TID</FieldLabel>

                        <div className="flex items-center">
                          <Input placeholder="Enter TID" {...field} />
                          {checking && <Spinner className="ml-2" />}
                        </div>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
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

                  <Controller
                    name="mode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Payment Mode</FieldLabel>

                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {form.watch("mode") === "Cheque" && (
                    <Controller
                      name="cheque_id"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Cheque ID</FieldLabel>

                          <Input placeholder="Enter cheque ID" {...field} />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
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

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="transaction_date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Transaction Date</FieldLabel>

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
                            form.setValue("status", date ? "Cleared" : "Pending");
                          }}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

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

                  <Button
                    type="submit"
                    disabled={!!error?.errorMessage || checking || loading}
                    className="w-full"
                  >
                    {loading && <Spinner />} Submit
                  </Button>

                </FieldGroup>
              </form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPayment;
