import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ChequeProp } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useContext, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { AvailableMachines } from "./available-machines";
import ChequeCredit from "./cheque-credit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wrench } from "lucide-react";
import { TriggerFirebaseForChequeAlerts } from "@/lib/triggerFirebase";

const AddMachine = ({
  customer_id,
  user_id,
  onRefresh,
}: {
  customer_id?: number;
  user_id: number | string;
  onRefresh: () => Promise<void>;
}) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [cheque, setCheque] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [total, setTotal] = useState<ChequeProp[]>([]);
  const { state: OfficeState } = useContext(OfficeContext)!;
  const [manual, setManual] = useState(false);
  const [open, setOpen] = useState(false);
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
      note: z.string().optional(),
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
      note: "",
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
        note: values.note,
      })
      .then(async (response) => {
        if (response.data?.sale_id) {
          if (cheque) {
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
              }),
            );

            console.log("All installments saved:", res);
            TriggerFirebaseForChequeAlerts();
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
    setOpen(false);
    setSelectedMachine(null);
    setManual(false);
  }

  const isKarachi = OfficeState?.value?.data?.toLowerCase() === "karachi";
  const manualShow = isAdmin || isKarachi;

  return (
    <>
      <Button className="h-8 rounded-lg px-3" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add Machine
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={`max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground transition-all duration-300 ${
            cheque ? "sm:max-w-[90vw]" : "sm:max-w-lg"
          }`}
        >
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Wrench className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Add New Machine
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record machine, contract, pricing, and payment details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex w-full flex-1">
            <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
              <div
                className={`flex gap-6 ${
                  cheque ? "flex-row" : "flex-col"
                } w-full`}
              >
                <div
                  className={`${cheque ? "w-1/2" : "w-full"} space-y-2 p-3.5`}
                >
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
                  >
                    {/* Machine Details */}
                    <FieldSet className="gap-3 rounded-md border p-3">
                      <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                        Machine Details
                      </FieldLegend>

                      {manualShow && (
                        <Field>
                          <div className="flex items-center gap-3">
                            <FieldLabel>Add Manual?</FieldLabel>
                            <Checkbox
                              checked={manual}
                              onCheckedChange={(checked: boolean) =>
                                setManual(checked)
                              }
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
                                  form.setValue(
                                    "machineModel",
                                    val.machine_model,
                                  );
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

                      <div className="grid grid-cols-2 gap-3">
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
                        <div className="col-span-1 md:col-span-2">
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
                        </div>
                      </div>
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

                      <div className="flex flex-wrap gap-6">
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
                          <div className="flex items-center gap-3">
                            <FieldLabel>Cheque Credit</FieldLabel>
                            <Checkbox
                              checked={cheque}
                              onCheckedChange={(checked: boolean) =>
                                setCheque(checked)
                              }
                            />
                          </div>
                        </Field>
                      </div>

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
                                <Textarea
                                  placeholder="Optional note"
                                  {...field}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </>
                      )}
                    </FieldSet>

                    {/* Submit */}
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Spinner />} Submit
                    </Button>
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
    </>
  );
};

export default AddMachine;
