import { BASE_URL } from "@/constants/data";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { RequiredStar } from "./RequiredStar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { debounce } from "@/lib/debounce";
import Spinner from "./ui/spinner";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";

const EditPayment = ({
  visible,
  onClose,
  onRefresh,
  machine_id,
  customer_id,
  data,
}) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState({});
  const formSchema = z.object({
    note: z.string().min(1, { message: "Note is required." }),
    amount: z.number().min(1, { message: "Amount must be greater than 1." }),
    mode: z.string().min(1, { message: "Payment mode is required." }),
    received_by: z.string().min(1, { message: "Bank name is required." }),
    transaction_date: z.date({
      required_error: "Transaction date is required.",
    }),
    clearance_date: z.date().optional(),
    remarks: z.string().optional(),
  });
  const { state: UserState } = useContext(UserContext);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: "",
      mode: "",
      received_by: "",
      transaction_date: undefined,
      clearance_date: undefined,
      remarks: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        note: data?.note || "",
        amount: Number(data.amount),
        mode: data.mode || "",
        received_by: data.received_by || "",
        transaction_date: new Date(data.transaction_date),
        clearance_date: data?.clearance_date
          ? new Date(data.clearance_date)
          : null,
        remarks: data?.remarks || "",
      });
    }
  }, [data]);

  async function onSubmit(values) {
    setLoading(true);
    try {
      const response = await axios.put(`/payment`, {
        ...values,
        machine_id: machine_id,
        id: data.id,
      });
      toast({ title: "Payment updated successfully" });
      onRefresh();
      handleClose(false);
    } catch (e) {
     
      setLoading(false);
    }
  }

  function handleClose(val) {
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

  const checkNumberInDatabase = async (number) => {
    setChecking(true);
    setError({});
    try {
      const response = await axios.post(`/check-note`, { number });
      if (Array.isArray(response.data) && response.data.length > 0) {
        const apiData = response.data[0];
        if (apiData.note !== data.note) {
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
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>

        <div className="w-full ">
          <ScrollArea className="px-2 w-full max-h-[90vh]">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
                >
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={field?.value || ""}
                            onChange={(e) => {
                              if (!isNaN(e.target.value)) {
                                field.onChange(Number(e.target.value));
                              }
                            }}
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
                        <FormLabel>
                          TID <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input placeholder="Enter TID" {...field} />
                            {checking && <Spinner className={"ml-2"} />}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error?.errorMessage && (
                    <Link
                      target="blank"
                      className="text-red-500 text-sm"
                      href={
                        `/${UserState?.value?.data?.base_route}/member/${error.saleData[0]?.customer_id}/${error?.machine_id}` ||
                        "#"
                      }
                    >
                      {error?.errorMessage}
                    </Link>
                  )}

                  {/* Payment Mode */}
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Payment Mode <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => field.onChange(val)}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "Cheque",
                                "Cash",
                                "Deposit",
                                "Online",
                                "Pay Order",
                              ].map((user) => (
                                <SelectItem key={user} value={user}>
                                  {user}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Received By */}
                  <FormField
                    control={form.control}
                    name="received_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bank Name <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Transaction Date */}
                  <FormField
                    control={form.control}
                    name="transaction_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Transaction Date <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Clearance Date */}
                  <FormField
                    control={form.control}
                    name="clearance_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clearance Date</FormLabel>
                        <FormControl>
                          <AppCalendar
                            date={field.value}
                            onChange={(date) => {
                              field.onChange(date);
                              if (date) {
                                form.setValue("status", "Cleared");
                              } else {
                                form.setValue("status", "Pending");
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter remarks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    disabled={error?.errorMessage}
                    className="w-full"
                    type="submit"
                  >
                    {loading && <Loader2 className="animate-spin" />} Submit
                  </Button>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPayment;
