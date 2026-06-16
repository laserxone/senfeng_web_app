import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MachineProps } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "./ui/field";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  machineModel: z.string().min(1, { message: "Machine model is required." }),
  power: z.string().min(1, { message: "Power is required." }),
  source: z.string().min(1, { message: "Source is required." }),
  contractDate: z.date({ error: "Contract date is required." }),
  isSpeedMoney: z.boolean(),
  speedMoney: z.coerce.number<number>().optional(),
  speedMoneyNote: z.string().optional(),
  totalPrice: z.coerce.number<number>({ error: "Price is required" }),
  cnic: z.string().optional(),
});


type FormValues = z.infer<typeof formSchema>;

const EditMachine = (
  { machine_id, visible, onClose, onRefresh, data }: { machine_id?: number | string, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, data?: MachineProps }

) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState([""]);
  const [orderNumberError, setOrderNumberError] = useState("");
  const { userID } = useUserDetail()


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineModel: "",
      power: "",
      source: "",
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
        machineModel: data?.serial_no || "",
        power: data?.power || "",
        source: data?.source || "",
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
      if (data?.order_no_arr && data?.order_no_arr.length > 0) {
        setOrderNumbers([...data.order_no_arr]);
      }
    }
  }, [data, form, visible]);

  function onSubmit(values: FormValues) {
    const cleanedOrderNumbers = orderNumbers.filter(
      (num) => num?.trim() !== ""
    );

    if (cleanedOrderNumbers.length === 0) {
      setOrderNumberError("At least one order number is required.");
      return;
    } else if (cleanedOrderNumbers.some((num) => num.length !== 9)) {
      setOrderNumberError(
        "Order number wrong format. Each must be 9 characters."
      );
      return;
    } else {
      setOrderNumberError("");
    }

    setLoading(true);
    axios
      .put(`/${userID}/machine/${machine_id}`, {
        id: machine_id,
        speed_money_note: values.speedMoneyNote,
        speed_money: values.isSpeedMoney,
        speed_money_amount: values.speedMoney ? Number(values.speedMoney) : 0,
        serial_no: values.machineModel,
        power: values.power,
        source: values.source,
        order_no_arr: cleanedOrderNumbers,
        price: values.totalPrice,
        contract_date: values.contractDate,
        cnic: values.cnic,
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
    onClose(val);
  }

  const addNumberField = () => {
    setOrderNumbers((prevState) => [...prevState, ""]);
  };

  const removeNumberField = (index: number) => {
    setOrderNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
  };

  const handleNumberChange = (index: number, value: string) => {
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
          <DialogTitle>Edit Machine</DialogTitle>
        </DialogHeader>

    
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <ScrollArea className="pr-2 w-full h-[calc(100dvh-160px)]">

              {/* Machine Details */}
              <FieldSet className="border rounded-md p-3 gap-3">
                <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Machine Details</FieldLegend>

                <Controller
                  name="machineModel"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Machine Model</FieldLabel>
                      <Input disabled={true} placeholder="SF3015G" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />


                <Controller
                  name="power"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Power</FieldLabel>
                      <Input placeholder="3000W / 1500W" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="source"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Source</FieldLabel>
                      <Input placeholder="RAYCUS / IPG" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />


                <Field>
                  <FieldLabel>Order No</FieldLabel>
                  {orderNumbers.map((num, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder="202501011"
                        value={num}
                        onChange={(e) => handleNumberChange(index, e.target.value)}
                      />
                      {index > 0 && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeNumberField(index)}
                        >
                          <Trash size={14} />
                        </Button>
                      )}
                      {index === orderNumbers.length - 1 && (
                        <Button size="icon" onClick={addNumberField}>
                          <Plus size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {orderNumberError && (
                    <Label className="text-red-700 dark:text-red-300 text-sm">
                      {orderNumberError}
                    </Label>
                  )}
                </Field>
              </FieldSet>

              {/* Contract Details */}
              <FieldSet className="border rounded-md p-3 gap-3">
                <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Contract Details</FieldLegend>

                <Controller
                  name="contractDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Contract Date</FieldLabel>
                      <AppCalendar date={field.value} onChange={field.onChange}  />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="totalPrice"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Total Price</FieldLabel>
                      <Input placeholder="Enter amount" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="cnic"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>CNIC</FieldLabel>
                      <Input placeholder="1234567891234" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldSet>

              {/* Payment Options */}
              <FieldSet className="border rounded-md p-3 gap-3">
                <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Payment Options</FieldLegend>

                <Controller
                  name="isSpeedMoney"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="flex gap-3 items-center">
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
                          <Input placeholder="Amount" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </>
                )}
              </FieldSet>
            </ScrollArea>
            {/* Submit */}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Spinner />} Submit
            </Button>
          </form>




   
      </DialogContent>
    </Dialog>
  );
};

export default EditMachine;
