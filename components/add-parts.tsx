import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import moment from "moment";
import { useContext, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import ChequeCredit from "./customer-components/machine/cheque-credit";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";
import { ChequeProp } from "@/lib/types";

const formSchema = z
  .object({
    serial_no: z.string().min(1, { message: "Name is required." }),
    contractDate: z.date({ error: "Contract date is required." }),
    isSpeedMoney: z.boolean().default(false),
    speedMoney: z.coerce.number<number>().optional(),
    speedMoneyNote: z.string().optional(),
    totalPrice: z.coerce.number<number>({ error: "Price is required" }),
    cnic: z.string().optional(),
    order_item: z.number().nullable().optional(),
  })


const AddParts = ({ customer_id, user_id, visible, onClose, onRefresh }: { customer_id?: number, user_id: number, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cheque, setCheque] = useState(false);
  const [value, setValue] = useState<string>();
  const [total, setTotal] = useState<ChequeProp[]>([]);
  const { state: OfficeState } = useContext(OfficeContext)!
  const [newParts, setNewParts] = useState([{ name: "", model: "", power: "", serial_no: "" }])
  const [errors, setErrors] = useState<any>({})

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial_no: "",
      contractDate: undefined,
      isSpeedMoney: false,
      speedMoney: 0,
      speedMoneyNote: "",
      totalPrice: 0,
      cnic: "",
      order_item: null,
    },
  });

  type FormValues = z.infer<typeof formSchema>;

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

  function handleClose(val: boolean) {
    form.reset();
    onClose(val);
    setNewParts([{ name: "", model: "", power: "", serial_no: "" }])
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
      <DialogContent
        className={`transition-all duration-300 ${cheque ? "sm:max-w-[90vw] w-[90vw]" : "sm:max-w-lg w-full"
          }`}
      >
        <DialogHeader>
          <DialogTitle>Add New Parts</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full h-[85vh]">
            <div
              className={`flex gap-6 ${cheque ? "flex-row" : "flex-col"
                } w-full`}
            >
              <div className={`${cheque ? "w-1/2" : "w-full"} px-2 space-y-2`}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FieldGroup>

                    <Controller
                      name="serial_no"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Name</FieldLabel>

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

                    <div className="space-y-4">
                      {newParts.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl border px-3 py-3 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Part {index + 1}
                            </span>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                setNewParts((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </div>

                          {Object.entries(item).map(([key, val]) => (
                            <Field key={key}>
                              <FieldLabel>
                                {key.charAt(0).toUpperCase() +
                                  key.slice(1).replace("_", " ")}
                              </FieldLabel>

                              <Input
                                value={val}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setNewParts((prev) => {
                                    const updated = [...prev];
                                    updated[index] = {
                                      ...updated[index],
                                      [key]: value.toUpperCase(),
                                    };
                                    return updated;
                                  });
                                }}
                                placeholder={`Example: ${generatePlaceholder(key)}`}
                              />

                              {errors[index]?.[key] && (
                                <FieldError errors={[{ message: errors[index][key] }]} />
                              )}
                            </Field>
                          ))}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        setNewParts([
                          ...newParts,
                          { name: "", model: "", power: "", serial_no: "" },
                        ]);
                      }}
                      type="button"
                    >
                      Add new part
                    </Button>

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

                            placeholder="Enter total price"
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

                    <Field>
                      <div className="flex gap-4 items-center">
                        <FieldLabel>Cheque Credit</FieldLabel>
                        <Checkbox
                          checked={cheque}
                          onCheckedChange={(checked: boolean) => setCheque(checked)}
                        />
                      </div>
                    </Field>

                    {isSpeedMoney && (
                      <>
                        <Controller
                          name="speedMoney"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Speed Money</FieldLabel>

                              <Input
                                placeholder="Enter speed money"
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
                              <FieldLabel>Speed Money Note</FieldLabel>

                              <Textarea placeholder="Enter note" {...field} />

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

                          <Input
                            placeholder="example: 1234567891234"
                            {...field}
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Spinner />} Submit
                    </Button>

                  </FieldGroup>
                </form>
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
