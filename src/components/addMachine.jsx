import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import moment from "moment";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { AvailableMachines } from "./available-machines";
import ChequeCredit from "./customer-components/machine/cheque-credit";
import { RequiredStar } from "./RequiredStar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
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
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";

const AddMachine = ({ customer_id, user_id, visible, onClose, onRefresh }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [additionalMachines, setAdditionalMachines] = useState([]);
  const [cheque, setCheque] = useState(false);
  const [value, setValue] = useState();
  const [total, setTotal] = useState([]);
  const { state: OfficeState } = useContext(OfficeContext);

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
    order_item: z.number({ message: "Machine selection is required" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineModel: "",
      power: "",
      source: "",
      contractDate: undefined,
      isSpeedMoney: false,
      speedMoney: "",
      speedMoneyNote: "",
      totalPrice: "",
      cnic: "",
      order_item: null,
    },
  });

  function onSubmit(values) {
    setLoading(true);
    axios
      .post(
        `/${user_id}/machine?inventory=${values.order_item}&cheque=${cheque}`,
        {
          customer_id: customer_id,
          type: "Machine",
          speed_money_note: values.speedMoneyNote,
          speed_money: values.isSpeedMoney,
          speed_money_amount: values.speedMoney ? Number(values.speedMoney) : 0,
          serial_no: values.machineModel,
          power: values.power,
          source: values.source,
          sell_by: user_id,
          commission: true,
          price: values.totalPrice,
          contract_date: values.contractDate,
          cnic: values.cnic,
        }
      )
      .then(async (response) => {
        if (response.data?.sale_id) {
          const saleID = response.data.sale_id;

          const res = await Promise.all(
            total.map(async (item, idx) => {
              const name = `${
                OfficeState.value.data
              }/customer/${customer_id}/machine/${saleID}/installments/${moment()
                .valueOf()
                .toString()}_${idx}.png`;
              const imgRef = await UploadImage(item.img, name);
              return axios.post(`/${user_id}/installments`, {
                date: item.date,
                image: name,
                amount: item.amount,
                sale_id: saleID,
              });
            })
          );

          console.log("All installments saved:", res);
        }
        onRefresh();
        handleClose(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleClose(val) {
    form.reset();
    onClose(val);
    setSelectedMachine(null);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent
        className={`transition-all duration-300 ${
          cheque ? "max-w-[90vw] w-[90vw]" : "max-w-lg w-full"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full max-h-[90vh]">
            <div
              className={`flex gap-6 ${
                cheque ? "flex-row" : "flex-col"
              } w-full`}
            >
              {/* Left Side Form */}
              <div className={`${cheque ? "w-1/2" : "w-full"} px-2 space-y-2`}>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                      console.log("Form validation errors:", errors);
                    })}
                    className="space-y-2"
                  >
                    <FormField
                      control={form.control}
                      name="order_item"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Select Machine <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <AvailableMachines
                              onReturn={setSelectedMachine}
                              value={selectedMachine}
                              onReturnItem={(val) => {
                                field.onChange(val.id);
                                form.setValue(
                                  "machineModel",
                                  val.machine_model
                                );
                                form.setValue("power", val.machine_power);
                                form.setValue("source", val.machine_source);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {additionalMachines.map((item, index) => (
                      <div className="flex gap-2">
                        <AvailableMachines
                          key={index}
                          value={item}
                          onReturn={(id) => {
                            const updatedMachines = [...additionalMachines];
                            updatedMachines[index] = id;
                            setAdditionalMachines(updatedMachines);
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const updatedMachines = additionalMachines.filter(
                              (_, i) => i !== index
                            );
                            setAdditionalMachines(updatedMachines);
                          }}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    ))}

                    {selectedMachine && (
                      <Button
                        onClick={() => {
                          setAdditionalMachines((prevState) => [
                            ...prevState,
                            null,
                          ]);
                        }}
                      >
                        Add additional machine
                      </Button>
                    )}

                    <FormField
                      control={form.control}
                      name="machineModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Machine Model <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              disabled
                              placeholder="example: SF3015G"
                              {...field}
                            />
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
                              disabled
                              placeholder="example: 3000W/1500W/6000W"
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
                            <Input
                              disabled
                              placeholder="example: RAYCUS / MAX /IPG"
                              {...field}
                            />
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
                                field.onChange(checked);
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

                    <div>
                      <FormLabel className="pr-2">Cheque Credit</FormLabel>
                      <Checkbox
                        checked={cheque}
                        onCheckedChange={(checked) => {
                          setCheque(checked);
                        }}
                      />
                    </div>

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
                                  placeholder="Enter speed money"
                                  value={field.value ? field.value : ""}
                                  onChange={(e) => {
                                    if (!isNaN(Number(e.target.value))) {
                                      field.onChange(e.target.value);
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
                      {loading && <Spinner />} Submit
                    </Button>
                  </form>
                </Form>
              </div>
              {cheque && (
                <div className="w-1/2 border-l pl-4">
                  <ChequeCredit
                    setTotal={setTotal}
                    setValue={setValue}
                    total={total}
                    value={value}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default AddMachine;
