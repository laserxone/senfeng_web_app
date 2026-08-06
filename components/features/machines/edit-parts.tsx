import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MachineProps } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageOpen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

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

const EditParts = ({
  machine_id,
  visible,
  onClose,
  onRefresh,
  data,
}: {
  machine_id?: number | string;
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: () => Promise<void>;
  data?: MachineProps;
}) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newParts, setNewParts] = useState([
    { name: "", model: "", power: "", serial_no: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const { userID } = useUserDetail();

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
        contractDate: data?.contract_date
          ? new Date(data.contract_date)
          : undefined,
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
        setNewParts(data.parts_information);
      }
    }
  }, [data, form, visible]);

  function validateNewParts() {
    let newErrors: any = {};

    newParts.forEach((part, index) => {
      let partErrors: any = {};

      Object.entries(part).forEach(([key, value]) => {
        if (!value.trim()) {
          partErrors[key] =
            `${key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")} is required`;
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
    if (!validateNewParts()) return;
    setErrors({});
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
        parts_information: newParts,
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
    setNewParts([{ name: "", model: "", power: "", serial_no: "" }]);
    onClose(val);
  }

  function generatePlaceholder(key: string) {
    if (key === "name") {
      return "Laser Source";
    }
    if (key === "model") {
      return "RAYCUS-RFL-C3000S-CE";
    }
    if (key === "power") {
      return "3000W";
    }
    if (key === "serial_no") {
      return "C1000A24B000XXX";
    }
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <PackageOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Edit Parts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update parts, contract, pricing, and related details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex w-full flex-1">
          <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
            <div className="p-3.5">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
              >
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
                      <div
                        key={index}
                        className="flex w-full flex-col gap-3 rounded-2xl border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="mb-2 text-lg font-semibold">
                            Part {index + 1}
                          </Label>
                          {/* <Button
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
                          </Button> */}
                        </div>
                        {Object.entries(item).map(([key, val], i) => (
                          <div key={key} className="flex flex-col gap-1">
                            <Label className="text-sm">
                              {key.charAt(0).toUpperCase() +
                                key.slice(1).replace("_", " ")}{" "}
                              <RequiredStar />
                            </Label>

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
                              <p className="text-xs text-red-500">
                                {errors[index][key]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* <Button onClick={(e) => {
                    e.preventDefault()
                    setNewParts([...newParts, { name: "", model: "", power: "", serial_no: "" }])
                  }} className="mt-2">Add new part</Button> */}

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
                    name="isSpeedMoney"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex items-center gap-4">
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
