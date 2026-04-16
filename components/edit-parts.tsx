import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash, Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
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
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import { RequiredStar } from "./RequiredStar";

const EditParts = ({ machine_id, visible, onClose, onRefresh, data, base }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState([""]);
  const [orderNumberError, setOrderNumberError] = useState("");
  const [newParts, setNewParts] = useState([{ name: "", model: "", power: "", serial_no: "" }])
  const [errors, setErrors] = useState({})
  const { userID } = useUserDetail()
  const formSchema = z.object({
    serial_no: z.string().min(1, { message: "Name is required." }),
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
      serial_no: "",
      contractDate: undefined,
      isSpeedMoney: false,
      speedMoney: "",
      speedMoneyNote: "",
      totalPrice: 0,
      cnic: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        serial_no: data?.serial_no || "",
        contractDate: data?.contract_date ? new Date(data.contract_date) : null,
        isSpeedMoney: data?.speed_money,
        speedMoney: data?.speed_money_amount || "",
        speedMoneyNote: data?.speed_money_note || "",
        totalPrice: Number(data?.price || 0),
        cnic: data?.cnic || "",
      });
      if (data?.speed_money) {
        setIsSpeedMoney(true);
      }
      if (data?.order_no_arr && data?.order_no_arr.length > 0) {
        setOrderNumbers([...data.order_no_arr]);
      }
      if (data?.parts_information) {
        setNewParts(data.parts_information)
      }
    }
  }, [data, form, visible]);

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
    axios
      .put(`/${userID}/machine/${machine_id}`, {
        id: machine_id,
        speed_money_note: values.speedMoneyNote,
        speed_money: values.isSpeedMoney,
        speed_money_amount: values.speedMoney ? Number(values.speedMoney) : 0,
        serial_no: values.serial_no,
        price: values.totalPrice,
        contract_date: values.contractDate,
        cnic: values.cnic,
        parts_information: newParts
      })
      .then(async () => {
        await onRefresh();
        handleClose(false);
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleClose(val) {
    form.reset();
    setNewParts([{ name: "", model: "", power: "", serial_no: "" }])
    onClose(val);
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
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>Edit Parts</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full max-h-[90vh]">
            <div className="px-2">
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
                          <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setNewParts((prevState) =>
                                    prevState.filter((item, ind) => index !== ind)
                                  );
                                }}
                                variant="destructive"
                                size="icon"
                              >
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
                        <FormLabel>Contract Date</FormLabel>
                        <FormControl>
                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                             max={new Date()}
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
                              if (!isNaN(Number(e.target.value))) {
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
                              const value = checked === true;

                              setIsSpeedMoney(value);
                              field.onChange(value);

                              if (!value) {
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
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditParts;
