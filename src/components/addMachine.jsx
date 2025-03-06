import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import AppCalendar from "./appCalendar";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";

const AddMachine = ({ customer_id, user_id, visible, onClose, onRefresh }) => {
    const [isSpeedMoney, setIsSpeedMoney] = useState(false);
    const [loading, setLoading] = useState(false)
    const formSchema = z.object({
      machineModel: z.string().min(1, { message: "Machine model is required." }),
      power: z.string().min(1, { message: "Power is required." }),
      source: z.string().min(1, { message: "Source is required." }),
      orderNo: z.string().min(1, { message: "Order number is required." }),
      contractDate: z.date({ required_error: "Contract date is required." }),
      isSpeedMoney: z.boolean().default(false),
      speedMoney: z.string().optional(),
      speedMoneyNote: z.string().optional(),
      totalPrice: z.number().min(1, { message: "Total price is required." }),
      usdRate: z.number().min(1, { message: "USD TT rate is required." }),
    });
  
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        machineModel: "",
        power: "",
        source: "",
        orderNo: "",
        contractDate: undefined,
        isSpeedMoney: false, // Default value set to false
        speedMoney: "",
        speedMoneyNote: "",
        totalPrice: "",
        usdRate: "",
      },
    });
  
    function onSubmit(values) {
      // console.log("Form Data:", values);
        setLoading(true)
      axios
        .post(`/api/machine`, {
          customer_id: customer_id,
          type: "Machine",
          speed_money_note: values.speedMoneyNote,
          speed_money: values.isSpeedMoney,
          speed_money_amount: values.speenModay,
          serial_no: values.machineModel,
          power: values.power,
          source: values.source,
          order_no: values.orderNo,
          sell_by: user_id,
          commission: true,
          price: values.totalPrice,
          USD_TT_rate: values.usdRate,
          contract_date: values.contractDate,
        })
        .then(() => {
          onRefresh();
          handleClose(false);
        });
    }
  
    function handleClose(val) {
      form.reset();
      onClose(val);
    }
  
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
                          <FormLabel>Machine Model</FormLabel>
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
                          <FormLabel>Power</FormLabel>
                          <FormControl>
                            <Input placeholder="example: 3000/1500/6000" {...field} />
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
                          <FormLabel>Source</FormLabel>
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
                          <FormLabel>Order No</FormLabel>
                          <FormControl>
                            <Input placeholder="example: 202501001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
  
                    <FormField
                      control={form.control}
                      name="contractDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Date</FormLabel>
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
                          <FormLabel>Total Price</FormLabel>
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
                    <div className="flex flex-1">
                      <FormField
                        control={form.control}
                        name="usdRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>USD TT rate</FormLabel>
                            <FormControl>
                              <Input
                                className="flex flex-1"
                                type="number"
                                placeholder="Enter USD TT rate"
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
  
                      {/* <div>
                        {Number(form.getValues("totalPrice")) *
                          Number(form.getValues("usdRate"))}
                      </div> */}
                    </div>
  
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
  
                    <Button className="w-full" type="submit">
                    {loading && <Loader2 className="animate-spin"/>}  Submit
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

  export default AddMachine