import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import AppCalendar from "./appCalendar";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Loader2, Plus, Trash } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { RequiredStar } from "./RequiredStar";
import { BASE_URL } from "@/constants/data";
import { Label } from "./ui/label";

const AddMachine = ({ customer_id, user_id, visible, onClose, onRefresh }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState([""]);
  const [orderNumberError, setOrderNumberError] = useState("");
  const formSchema = z.object({
    machineModel: z.string().min(1, { message: "Machine model is required." }),
    power: z.string().min(1, { message: "Power is required." }),
    source: z.string().min(1, { message: "Source is required." }),
    contractDate: z.date({ required_error: "Contract date is required." }),
    isSpeedMoney: z.boolean().default(false),
    speedMoney: z.string().optional(),
    speedMoneyNote: z.string().optional(),
    totalPrice: z.number().min(1, { message: "Total price is required." }),
    cnic: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineModel: "",
      power: "",
      source: "",
      contractDate: undefined,
      isSpeedMoney: false, // Default value set to false
      speedMoney: "",
      speedMoneyNote: "",
      totalPrice: "",
      cnic: "",
    },
  });

  function onSubmit(values) {
    const cleanedOrderNumbers = orderNumbers.filter(
      (num) => num?.trim() !== ""
    );

    if (cleanedOrderNumbers.length === 0) {
      setOrderNumberError("At least one order number is required.");
      return
    } else if (cleanedOrderNumbers.some((num) => num.length !== 9)) {
      setOrderNumberError(
        "Order number wrong format. Each must be 9 characters."
      );
      return
    } else {
      setOrderNumberError("");
    }

    // console.log("Form Data:", values);
    setLoading(true);
    axios
      .post(`/machine`, {
        customer_id: customer_id,
        type: "Machine",
        speed_money_note: values.speedMoneyNote,
        speed_money: values.isSpeedMoney,
        speed_money_amount: values.speenModay,
        serial_no: values.machineModel,
        power: values.power,
        source: values.source,
        sell_by: user_id,
        commission: true,
        price: values.totalPrice,
        contract_date: values.contractDate,
        cnic: values.cnic,
        order_no_arr : cleanedOrderNumbers
      })
      .then(() => {
        onRefresh();
        handleClose(false);
      }).catch(()=>{
        setLoading(false)
      })
  }

  function handleClose(val) {
    form.reset();
    onClose(val);
  }

  const addNumberField = () => {
    setOrderNumbers((prevState) => [...prevState, ""]);
  };

  const removeNumberField = (index) => {
    setOrderNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
  };

  const handleNumberChange = (index, value) => {
    if (orderNumberError) {
      setOrderNumberError("");
    }
    setOrderNumbers((prevState) => {
      const newState = [...prevState];
      newState[index] = value;
      return newState;
    });
  };

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full max-h-[90vh]">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
                >
                  <FormField
                    control={form.control}
                    name="machineModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Machine Model <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="example: SF3015G" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="power"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Power <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example: 3000/1500/6000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Source <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => field.onChange(val)}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              {["RAYCUS", "MAX", "IPG"].map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Order No <RequiredStar />
                        </FormLabel>
                        {orderNumbers.map((num, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormControl className="flex-1">
                              <Input
                                placeholder="202501011"
                                value={num}
                                onChange={(e) =>
                                  handleNumberChange(index, e.target.value)
                                }
                              />
                            </FormControl>
                            {index > 0 && (
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  removeNumberField(index);
                                }}
                              >
                                <Trash size={16} />
                              </Button>
                            )}
                            {index === orderNumbers.length - 1 && (
                              <Button size="icon" onClick={addNumberField}>
                                <Plus size={16} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </FormItem>
                    )}
                  />

                  {orderNumberError && (
                    <Label className="text-red-700 dark:text-red-300 font-medium text-sm">
                      {orderNumberError}
                    </Label>
                  )}

                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Contract Date <RequiredStar />
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

                  <FormField
                    control={form.control}
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Price <RequiredStar />
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter total price"
                            value={field.value ? field.value : ""}
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
                    name="isSpeedMoney"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pr-2">
                          Include Speed Money
                        </FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={isSpeedMoney}
                            onCheckedChange={(checked) => {
                              setIsSpeedMoney(checked);
                              if (!checked) {
                                form.setValue("speedMoney", "");
                                form.setValue("speedMoneyNote", "");
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isSpeedMoney && (
                    <>
                      <FormField
                        control={form.control}
                        name="speedMoney"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speed Money</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter speed money"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speedMoneyNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speed Money Note</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter note" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="cnic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cnic</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example: 1234567891234"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit">
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

export default AddMachine;
