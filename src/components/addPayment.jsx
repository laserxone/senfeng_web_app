import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { RequiredStar } from "./RequiredStar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import AppCalendar from "./appCalendar";
import { Textarea } from "./ui/textarea";
import Dropzone from "@/components/dropzone";
import Image from "next/image";
import moment from "moment";
import { UploadImage } from "@/lib/uploadFunction";
import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BASE_URL } from "@/constants/data";
import { debounce } from "@/lib/debounce";
import Spinner from "./ui/spinner";
import { Label } from "./ui/label";
import Link from "next/link";
import { UserContext } from "@/store/context/UserContext";

const AddPayment = ({
  visible,
  onClose,
  onRefresh,
  machine_id,
  customer_id,
}) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { state: UserState } = useContext(UserContext);
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
    image: z.string().min(1, { message: "Image by is required." }),
    remarks: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: "",
      mode: "",
      received_by: "",
      transaction_date: undefined,
      clearance_date: undefined,
      image: null,
      remarks: "",
    },
  });
  async function onSubmit(values) {
    setLoading(true);
    try {
      if (values.image) {
        const name = `customer/${customer_id}/machine/${machine_id}/payment/${moment()
          .valueOf()
          .toString()}.png`;
        const imgRef = await UploadImage(values.image, name);
        const response = await axios.post(`${BASE_URL}/payment`, {
          ...values,
          machine_id: machine_id,
          image: name,
        });
        toast({ title: "Payment addedd successfully" });
        onRefresh();
        handleClose(false);
      } else {
        setLoading(false);
      }
    } catch (e) {
      toast({
        title: e?.response?.data?.message || e?.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  function handleClose(val) {
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

  const checkNumberInDatabase = async (number) => {
    setChecking(true);
    setError({});
    try {
      const response = await axios.post(`${BASE_URL}/check-note`, { number });
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
      <DialogContent className="max-w-[95vw] p-4">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 max-h-[90vh]"
          style={{
            display: "flex",
            flexDirection: imageFile ? "row" : "column",
            gap: imageFile ? 16 : 0,
          }}
        >
          <div className="w-full sm:w-[25%] flex">
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
                          `/${UserState?.value?.data?.base_route}/customer/machine?id=${error?.machine_id}` ||
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

                    {/* Image Field */}
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Image <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-1 items-center justify-center">
                              <Dropzone
                                noImage={true}
                                value={field.value}
                                onDrop={(file) => {
                                  field.onChange(file);
                                }}
                                title={"Click to upload"}
                                subheading={"or drag and drop"}
                                description={"PNG or JPG"}
                                drag={"Drop the files here..."}
                              />
                            </div>
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

export default AddPayment;
