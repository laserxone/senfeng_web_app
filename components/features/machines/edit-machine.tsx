import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { MachineProps } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Trash } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import AppCalendar from "@/components/features/calendar/app-calendar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  machineModel: z.string().min(1, { message: "Machine model is required." }),
  power: z.string().min(1, { message: "Power is required." }),
  source: z.string().min(1, { message: "Source is required." }),
  contractDate: z.date({ error: "Contract date is required." }),
  isSpeedMoney: z.boolean(),
  speedMoney: z.coerce.number<number>().optional(),
  speedMoneyNote: z.string().optional(),
  note: z.string().optional(),
  totalPrice: z.coerce.number<number>({ error: "Price is required" }),
  cnic: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const EditMachine = ({
  machine_id,
  visible,
  onClose,
  onRefresh,
  data,
}: {
  machine_id?: number | string
  visible: boolean
  onClose: (val: boolean) => void
  onRefresh: () => Promise<void>
  data?: MachineProps
}) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orderNumbers, setOrderNumbers] = useState([""])
  const [orderNumberError, setOrderNumberError] = useState("")
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
      note: "",
      totalPrice: 0,
      cnic: "",
    },
  })

  useEffect(() => {
    if (data) {
      form.reset({
        machineModel: data?.serial_no || "",
        power: data?.power || "",
        source: data?.source || "",
        contractDate: data?.contract_date
          ? new Date(data.contract_date)
          : undefined,
        isSpeedMoney: data?.speed_money,
        speedMoney: Number(data?.speed_money_amount ?? 0),
        speedMoneyNote: data?.speed_money_note || "",
        note: data?.note || "",
        totalPrice: Number(data?.price || 0),
        cnic: data?.cnic || "",
      })
      if (data?.speed_money) {
        setIsSpeedMoney(true)
      }
      // if (data?.order_no_arr && data?.order_no_arr.length > 0) {
      //   setOrderNumbers([...data.order_no_arr]);
      // }
    }
  }, [data, form, visible])

  function onSubmit(values: FormValues) {
    // const cleanedOrderNumbers = orderNumbers.filter(
    //   (num) => num?.trim() !== ""
    // );

    // if (cleanedOrderNumbers.length === 0) {
    //   setOrderNumberError("At least one order number is required.");
    //   return;
    // } else if (cleanedOrderNumbers.some((num) => num.length !== 9)) {
    //   setOrderNumberError(
    //     "Order number wrong format. Each must be 9 characters."
    //   );
    //   return;
    // } else {
    //   setOrderNumberError("");
    // }

    setLoading(true)
    axios
      .put(`/${userID}/machine/${machine_id}`, {
        id: machine_id,
        speed_money_note: values.speedMoneyNote,
        speed_money: values.isSpeedMoney,
        speed_money_amount: values.speedMoney ? Number(values.speedMoney) : 0,
        serial_no: values.machineModel,
        power: values.power,
        source: values.source,
        note: values.note,
        // order_no_arr: cleanedOrderNumbers,
        price: values.totalPrice,
        contract_date: values.contractDate,
        cnic: values.cnic,
      })
      .then(async () => {
        await onRefresh()
        handleClose(false)
      })
      .catch((e) => {
        console.log(e)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function handleClose(val: boolean) {
    form.reset()
    onClose(val)
  }

  // const addNumberField = () => {
  //   setOrderNumbers((prevState) => [...prevState, ""]);
  // };

  // const removeNumberField = (index: number) => {
  //   setOrderNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
  // };

  // const handleNumberChange = (index: number, value: string) => {
  //   if (orderNumberError) {
  //     setOrderNumberError("");
  //   }
  //   setOrderNumbers((prevState) => {
  //     const newState = [...prevState];
  //     newState[index] = value;
  //     return newState;
  //   });
  // };

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Pencil className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Edit Machine
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update machine, pricing, contract, and payment details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
            <div className="space-y-3 p-3.5 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase">
              {/* Machine Details */}
              <FieldSet className="gap-3 rounded-md border p-3">
                <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                  Machine Details
                </FieldLegend>

                <Controller
                  name="machineModel"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Machine Model</FieldLabel>
                      <Input disabled={true} placeholder="SF3015G" {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="note"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Machine Note</FieldLabel>
                      <Textarea
                        placeholder="Add any machine note, delivery instruction, or internal detail"
                        className="min-h-24 resize-y"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* <Field>
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
                </Field> */}
              </FieldSet>

              {/* Contract Details */}
              <FieldSet className="gap-3 rounded-md border p-3">
                <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                  Contract Details
                </FieldLegend>

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
                      <Input placeholder="Enter amount" {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldSet>

              {/* Payment Options */}
              <FieldSet className="gap-3 rounded-md border p-3">
                <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                  Payment Options
                </FieldLegend>

                <Controller
                  name="isSpeedMoney"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="flex items-center gap-3">
                        <FieldLabel>Include Speed Money</FieldLabel>
                        <Checkbox
                          checked={isSpeedMoney}
                          onCheckedChange={(checked: boolean) => {
                            setIsSpeedMoney(checked)
                            field.onChange(checked)
                            if (!checked) {
                              form.setValue("speedMoney", 0)
                              form.setValue("speedMoneyNote", "")
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
              </FieldSet>
            </div>
          </ScrollArea>
          {/* Submit */}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading && <Spinner />} Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditMachine
