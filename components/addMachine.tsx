import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useContext, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { AvailableMachines } from "./available-machines";
import ChequeCredit from "./customer-components/machine/cheque-credit";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Textarea } from "./ui/textarea";

type Installment = { date: string, img: string, amount: number }

const AddMachine = ({ customer_id, user_id, visible, onClose, onRefresh }: { customer_id?: number, user_id: number, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [cheque, setCheque] = useState(false);
  const [value, setValue] = useState();
  const [total, setTotal] = useState<Installment[]>([]);
  const { state: OfficeState } = useContext(OfficeContext);
  const [manual, setManual] = useState(false);
  const { isAdmin } = useUserDetail();

  const formSchema = z
    .object({
      machineModel: z
        .string()
        .min(1, { message: "Machine model is required." }),
      power: z.string().min(1, { message: "Power is required." }),
      source: z.string().min(1, { message: "Source is required." }),
      contractDate: z.date({ error: "Contract date is required." }),
      isSpeedMoney: z.boolean(),
      speedMoney: z.coerce.number<number>().optional(),
      speedMoneyNote: z.string().optional(),
      totalPrice: z.coerce.number<number>({ error: "Price is required" }),
      cnic: z.string().optional(),
      order_item: z.number().nullable().optional(),
    })
    .refine(
      (data) => {
        if (manual) {
          return true;
        }
        return typeof data.order_item === "number" && data.order_item > 0;
      },
      {
        message: "Machine selection is required",
        path: ["order_item"],
      },
    );


  type FormValues = z.infer<typeof formSchema>;

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
      order_item: null,
    },
  });

  function onSubmit(values: FormValues) {
    setLoading(true);
    let baseLink = `/${user_id}/machine?inventory=${values.order_item}&cheque=${cheque}`;
    if (manual) {
      baseLink = `/${user_id}/machine?cheque=${cheque}`;
    }
    axios
      .post(baseLink, {
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
      })
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
              }),
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
    setSelectedMachine(null);
    setManual(false);
  }

  const isKarachi = OfficeState?.value?.data?.toLowerCase() === "karachi";
  const manualShow = isAdmin || isKarachi;

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent
        className={`transition-all duration-300 ${cheque ? "sm:max-w-[90vw] w-[90vw]" : "sm:max-w-lg w-full"
          }`}
      >
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full h-[85dvh]">
            <div
              className={`flex gap-6 ${cheque ? "flex-row" : "flex-col"
                } w-full`}
            >
              <div className={`${cheque ? "w-1/2" : "w-full"} px-2 space-y-2`}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FieldGroup>

                    {manualShow && (
                      <Field>
                        <div className="flex gap-4 items-center">
                          <FieldLabel>Add Manual?</FieldLabel>
                          <Checkbox
                            checked={manual}
                            onCheckedChange={(checked: boolean) => setManual(checked)}
                          />
                        </div>
                      </Field>
                    )}

                    {!manual && (
                      <Controller
                        name="order_item"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Select Machine</FieldLabel>

                            <AvailableMachines
                              value={selectedMachine}
                              onReturn={setSelectedMachine}
                              onReturnItem={(val) => {
                                field.onChange(val.id);
                                form.setValue("machineModel", val.machine_model);
                                form.setValue("power", val.machine_power);
                                form.setValue("source", val.machine_source);
                              }}
                            />

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    )}

                    <Controller
                      name="machineModel"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Machine Model</FieldLabel>

                          <Input
                            disabled={!manual}
                            placeholder="SF3015G"
                            {...field}
                          />

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

                          <Input
                            disabled={!manual}
                            placeholder="3000W / 1500W"
                            {...field}
                          />

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

                          <Input
                            disabled={!manual}
                            placeholder="RAYCUS / IPG"
                            {...field}
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="contractDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Contract Date</FieldLabel>

                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                            max={new Date()}
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

export default AddMachine;
