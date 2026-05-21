import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MachineProps } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { RequiredStar } from "./RequiredStar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  serial_no: z.string().min(1, { message: "Name is required." }),
  contractDate: z.date({ error: "Contract date is required." }),
  isSpeedMoney: z.boolean(),
  speedMoney: z.coerce.number<number>().optional(),
  speedMoneyNote: z.string().optional(),
  totalPrice: z.coerce.number<number>({ error: "Price is required" }),
  cnic: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const EditParts = ({ machine_id, visible, onClose, onRefresh, data, }: { machine_id?: number | string, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, data?: MachineProps }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newParts, setNewParts] = useState([{ name: "", model: "", power: "", serial_no: "" }])
  const [errors, setErrors] = useState<Record<string, any>>({})
  const { userID } = useUserDetail()


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial_no: "",
      contractDate: undefined,
      isSpeedMoney: false,
      speedMoney: 0,
      speedMoneyNote: "",
      totalPrice: 0,
      cnic: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        serial_no: data?.serial_no || "",
        contractDate: data?.contract_date ? new Date(data.contract_date) : undefined,
        isSpeedMoney: data?.speed_money,
        speedMoney: Number(data?.speed_money_amount ?? 0),
        speedMoneyNote: data?.speed_money_note || "",
        totalPrice: Number(data?.price || 0),
        cnic: data?.cnic || "",
      });
      if (data?.speed_money) {
        setIsSpeedMoney(true);
      }

      if (data?.parts_information) {
        setNewParts(data.parts_information)
      }
    }
  }, [data, form, visible]);

  function validateNewParts() {

    let newErrors: any = {};

    newParts.forEach((part, index) => {
      let partErrors: any = {};

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

  function onSubmit(values: FormValues) {

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

  function handleClose(val: boolean) {
    form.reset();
    setNewParts([{ name: "", model: "", power: "", serial_no: "" }])
    onClose(val);
  }

  function generatePlaceholder(key: string) {
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
          <ScrollArea className="px-2 w-full h-[80vh]">
            <div className="px-2">

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FieldGroup>


                  <Controller
                    name="serial_no"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Machine Model</FieldLabel>

                        <Input
                          placeholder="Enter name e.g: 3KW Upgradation"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
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


                  <Controller
                    name="contractDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Contract Date</FieldLabel>

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
                    name="totalPrice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Total Price</FieldLabel>

                        <Input

                          placeholder="Enter amount"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="isSpeedMoney"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex gap-4 items-center">
                          <FieldLabel>Include Speed Money</FieldLabel>

                          <Checkbox
                            checked={isSpeedMoney}
                            onCheckedChange={(checked: boolean) => {
                              setIsSpeedMoney(checked);
                              field.onChange(checked);

                              if (!checked) {
                                form.setValue("speedMoney", 0);
                                form.setValue("speedMoneyNote", "");
                              }
                            }}
                          />
                        </div>
                      </Field>
                    )}
                  />

                  {isSpeedMoney && (
                    <>
                      <Controller
                        name="speedMoney"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Speed Money</FieldLabel>

                            <Input
                              placeholder="Amount"
                              {...field}
                            />

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />

                      <Controller
                        name="speedMoneyNote"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Note</FieldLabel>

                            <Textarea placeholder="Optional note" {...field} />

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </>
                  )}

                  <Controller
                    name="cnic"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>CNIC</FieldLabel>

                        <Input placeholder="1234567891234" {...field} />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Button className="w-full" type="submit" disabled={loading}>
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

export default EditParts;
