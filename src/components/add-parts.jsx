import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash, Trash2 } from "lucide-react";
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
import useUserDetail from "@/hooks/use-user-detail";
import { Label } from "./ui/label";

const AddParts = ({ customer_id, user_id, visible, onClose, onRefresh }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cheque, setCheque] = useState(false);
  const [value, setValue] = useState();
  const [total, setTotal] = useState([]);
  const { state: OfficeState } = useContext(OfficeContext);
  const [newParts, setNewParts] = useState([{ name: "", model: "", power: "", serial_no: "" }])
  const [errors, setErrors] = useState({})

  const formSchema = z
    .object({
      serial_no: z.string().min(1, { message: "Name is required." }),
      contractDate: z.date({ required_error: "Contract date is required." }),
      isSpeedMoney: z.boolean().default(false),
      speedMoney: z.string().optional(),
      speedMoneyNote: z.string().optional(),
      totalPrice: z.number().min(1, { message: "Total price is required." }),
      cnic: z.string().optional(),
      order_item: z.number().nullable().optional(),
    })


  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial_no: "",
      contractDate: undefined,
      isSpeedMoney: false,
      speedMoney: "",
      speedMoneyNote: "",
      totalPrice: "",
      cnic: "",
      order_item: null,
    },
  });

  function validateNewParts() {

    let newErrors = {};

    newParts.forEach((part, index) => {
      let partErrors = {};

      Object.entries(part).forEach(([key, value]) => {
        if (!value.trim()) { 
          partErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")} is required`;
        }
      });

      if (Object.keys(partErrors).length > 0) {
        newErrors[index] = partErrors;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function onSubmit(values) {
    if (!validateNewParts()) return
    setErrors({})
    setLoading(true);
    let baseLink = `/${user_id}/machine?cheque=${cheque}`

    axios
      .post(
        baseLink,
        {
          customer_id: customer_id,
          type: "Parts",
          speed_money_note: values.speedMoneyNote,
          speed_money: values.isSpeedMoney,
          speed_money_amount: values.speedMoney ? Number(values.speedMoney) : 0,
          serial_no: values.serial_no,
          sell_by: user_id,
          commission: true,
          price: values.totalPrice,
          contract_date: values.contractDate,
          cnic: values.cnic,
          parts_information: newParts
        }
      )
      .then(async (response) => {
        if (response.data?.sale_id) {
          if (cheque) {
            const saleID = response.data.sale_id;

            const res = await Promise.all(
              total.map(async (item, idx) => {
                const name = `${OfficeState.value.data
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
    setNewParts([{ name: "", model: "", power: "", serial_no: "" }])
  }

  function generatePlaceholder(key) {
    if (key === "name") {
      return "Laser Source"
    }
    if (key === 'model') {
      return "RAYCUS-RFL-C3000S-CE"
    }
    if (key === 'power') {
      return "3000W"
    }
    if (key === 'serial_no') {
      return "C1000A24B000XXX"
    }

  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent
        className={`transition-all duration-300 ${cheque ? "max-w-[90vw] w-[90vw]" : "max-w-lg w-full"
          }`}
      >
        <DialogHeader>
          <DialogTitle>Add New Parts</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full max-h-[85vh]">
            <div
              className={`flex gap-6 ${cheque ? "flex-row" : "flex-col"
                } w-full`}
            >
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
                      name="serial_no"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Name <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input

                              placeholder="Enter name e.g: 3KW Upgradation"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="w-full space-y-6">
                      {newParts.map((item, index) => (
                        <div key={index} className="flex flex-col gap-3 w-full p-4 rounded-2xl border border-gray-700/50">
                          <div className="flex justify-between items-center">
                            <Label className="font-semibold text-lg mb-2">
                              Part {index + 1}
                            </Label>
                            <Button onClick={(e) => {
                              e.preventDefault()
                              setNewParts((prevState) => {
                                const newState = prevState.filter((item, ind) => index !== ind)
                                return newState
                              })
                            }} variant="destructive" size="sm" as="icon">
                              <Trash2 />
                            </Button>
                          </div>
                          {Object.entries(item).map(([key, val], i) => (
                            <div key={key} className="flex flex-col gap-1">
                              <Label className="text-sm">
                                {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}{" "}
                                <RequiredStar />
                              </Label>

                              <Input
                                value={val}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setNewParts((prev) => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], [key]: value.toUpperCase() };
                                    return updated;
                                  });
                                }}
                                placeholder={`Example: ${generatePlaceholder(key)}`}
                              />
                              {errors[index]?.[key] && (
                                <p className="text-red-500 text-xs">{errors[index][key]}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>


                    <Button onClick={(e) => {
                      e.preventDefault()
                      setNewParts([...newParts, { name: "", model: "", power: "", serial_no: "" }])
                    }} className="mt-2">Add new part</Button>



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

                    <Button className="w-full" type="submit" disabled={loading}>
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



export default AddParts;
