"use client";


import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { CitiesSearch } from "@/components/shared/search/cities-search";
import { IndustrySearch } from "@/components/shared/search/industry-search";
import { NumberSearch } from "@/components/shared/search/number-search";
import { UserSearch } from "@/components/shared/search/user-search";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce, debouncePromise } from "@/lib/debounce";
import { CustomerFormData, MyCustomer } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  Phone,
  Settings2,
  Sparkles,
  Trash,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AddCustomerDialogProps = {

  onRefresh?: (val: MyCustomer) => Promise<void>;
  visible: boolean;
  onClose: (val: boolean) => void;
  user_id: number | string;
  ownership: boolean;
  user_designation?: string | null;
  office: string | null;
};


const formSchema = z.object({
  company: z.string().min(1, { message: "Company name is required" }),
  owner: z.string().min(1, { message: "Owner name is required" }),
  email: z.string().optional(),
  city: z.string().min(1, { message: "City is required" }),
  industry: z.string().optional(),
  remarks: z.string().optional(),
  address: z.string().optional(),
  group: z.string().optional(),
  other: z.string().optional(),
  lead: z.number().nullable().optional(),
  platform: z.string().optional(),
  pin: z.string().optional(),
  rating: z.number().optional(),
  member: z.boolean().optional(),
  ownership: z.number().nullable().optional(),
  created_at: z.date().optional(),
  office: z.string().min(1, { message: "Office is required" }),
});

type FormSchemaValues = z.infer<typeof formSchema>;

function AddCustomerDialog({
  onRefresh,
  visible,
  onClose,
  user_id,
  ownership,
  user_designation = null,
  office = "islamabad",
}: AddCustomerDialogProps) {

  const [numbers, setNumbers] = useState([""]);
  const [numberError, setNumberError] = useState("");
  const [loading, setLoading] = useState(false);
  const { designation, base_route, isAdmin } = useUserDetail();
  const [checking, setChecking] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<MyCustomer[]>([]);
  const [selectedNumber, setSelectedNumber] = useState(["+92"]);



  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      owner: "",
      email: "",
      city: "",
      industry: "",
      remarks: "",
      address: "",
      group: "",
      lead: null,
      other: "",
      pin: "",
      platform: "",
      rating: 0,
      member: false,
      ownership: null,
      created_at: undefined,
      office: office || "lahore",
    },
  });

  useEffect(() => {
    if (user_designation && user_designation === "Social Media Manager") {
      form.reset({
        company: "",
        owner: "",
        email: "",
        city: "",
        industry: "",
        remarks: "",
        address: "",
        group: "",
        lead: Number(user_id),
        other: "",
        pin: "",
        platform: "SOCIAL MEDIA",
        rating: 0,
        member: false,
        ownership: null,
        created_at: undefined,
        office: office || "lahore",
      });
    }
  }, [user_designation, user_id]);

  const { control } = form;

  function handleClose(val: boolean) {
    setNumberError("");
    setNumbers([""]);
    form.reset();
    onClose(val);
  }

  const debouncedSaveData: any = useCallback(debouncePromise(saveData, 1000), []);

  async function saveData(
    formData: CustomerFormData
  ): Promise<MyCustomer> {
    const response = await axios.post<{ data: MyCustomer }>(
      `/${user_id}/customer`,
      formData
    );

    return response.data.data;
  }

  async function onSubmit(values: FormSchemaValues) {
    const hasInvalidNumber = selectedNumber.some((code, index) => {
      const number = numbers[index];
      if (!number) return true;

      const isAllDigits = /^\d+$/.test(number);
      return !isAllDigits;
    });

    if (hasInvalidNumber) {
      setNumberError("Invalid number format");
      return;
    }

    setNumberError("");

    setLoading(true);

    try {
      const finalData = numbers.map((item, index) => {
        return selectedNumber[index] + item;
      });

      const formData = {
        name: values.company,
        email: values.email,
        customer_group: values.group,
        industry: values.industry,
        location: values.city,
        number: finalData,
        owner: values.owner,
        address: values.address,
        rating: values.rating,
        image: null,
        remarks: values.remarks,
        member: values.member,
        lead: values.lead || undefined,
        other: values.other,
        platform: values.platform,
        pin: values.pin,
        ownership:
          designation == "Sales"
            ? user_id
            : designation == "Dealer"
              ? user_id
              : designation === "Manager"
                ? user_id
                : ownership
                  ? values.ownership
                  : undefined,
        created_by: user_id,
        created_at: values.created_at || undefined,
        office: values.office,
      };

      const response: MyCustomer = await debouncedSaveData(formData);

      toast.success("Customer Addedd successfully");

      await onRefresh?.(response);
      handleClose(false);
    } finally {
      setLoading(false);
    }
  }

  const addNumberField = () => {
    setNumbers((prevState) => [...prevState, ""]);
    setSelectedNumber((prevState) => [...prevState, "+92"]);
  };

  const removeNumberField = (index: number) => {
    setNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
    setSelectedNumber((prevState) =>
      prevState.filter((_, ind) => ind !== index)
    );
  };

  const handleNumberChange = (index: number, value: string) => {
    if (numberError) {
      setNumberError("");
    }

    setNumbers((prevState) => {
      const newState = [...prevState];
      newState[index] = value;
      return newState;
    });
    if (value) debouncedCheckNumber(selectedNumber[index] + value);
  };

  const handlePrefixChange = (index: number, value: string) => {
    setSelectedNumber((prevState) => {
      const newState = [...prevState];
      newState[index] = value;
      return newState;
    });
  };

  const checkNumberInDatabase = async (number: string) => {
    setCustomerInfo([]);
    setChecking(true);
    try {
      const response = await axios.post(`/${user_id}/check-number`, { number },
        {
          cancelKey: `check-number-${user_id}`,
        },
      );
      setCustomerInfo(response.data);
    } catch (error) {
      console.log("Error checking number:", error);
    } finally {
      setChecking(false);
    }
  };

  const debouncedCheckNumber = useCallback(
    debounce(checkNumberInDatabase, 1000),
    []
  );

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-6xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">Add New Customer</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register customer profile, contact, location, ownership, and lead details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="p-3.5">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground"
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

                {/* CONTACT INFORMATION */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <Phone className="h-4 w-4 text-emerald-700" />
                    Contact Information
                  </FieldLegend>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Phone Numbers - Full Width */}
                    <div className="md:col-span-2">
                      <Label style={{ color: numberError ? "hsl(var(--destructive))" : undefined }} className="text-sm font-medium">
                        Phone Number <RequiredStar />
                      </Label>

                      <div className="mt-2 space-y-2">
                        {numbers.map((num, index) => (
                          <div key={index} className="grid gap-2 rounded-xl border bg-muted/15 p-2 sm:grid-cols-[112px_1fr_auto] sm:items-center">
                            <div>
                              <NumberSearch
                                value={selectedNumber[index]}
                                onReturn={(val: any) => handlePrefixChange(index, val)}
                              />
                            </div>
                            <Input
                              disabled={!selectedNumber[index]}
                              placeholder="xxxxxxxxx"
                              value={num}
                              onChange={(e) => handleNumberChange(index, e.target.value)}
                              className="bg-background"
                            />
                            <div className="flex items-center justify-end gap-2">
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  onClick={() => {
                                    removeNumberField(index)
                                    setCustomerInfo([])
                                  }}
                                >
                                  <Trash size={14} />
                                </Button>
                              )}
                              {checking && <Spinner className="size-4" />}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        disabled={customerInfo.length > 0 || checking}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addNumberField}
                        className="mt-3"
                      >
                        + Add Number
                      </Button>

                      {customerInfo.length > 0 && (
                        <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm">
                          <Label className="text-xs font-semibold text-destructive">
                            Number exists with the following:
                          </Label>
                          <div className="mt-2 space-y-1">
                            {customerInfo.map((item, index) => (
                              <Link
                                key={index}
                                target="_blank"
                                href={`/${base_route}/customer/${item?.id}`}
                                className="block rounded-lg bg-background/80 px-2 py-1 text-xs text-destructive hover:underline"
                              >
                                {item?.name || item?.owner} - {item?.number?.join(", ")}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {numberError && <Label className="mt-1 text-xs text-destructive">{numberError}</Label>}
                    </div>

                    {/* Email */}
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Email</FieldLabel>
                          <Input placeholder="example@email.com" {...field} />
                        </Field>
                      )}
                    />

                    {/* Other IDs */}
                    <Controller
                      name="other"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Other IDs</FieldLabel>
                          <Input placeholder="WeChat / QQ / Facebook" {...field} />
                        </Field>
                      )}
                    />
                  </div>
                </FieldSet>

                {/* CUSTOMER DETAILS */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    Customer Details
                  </FieldLegend>

                  <div className="space-y-3">
                    <Controller
                      name="owner"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="text-sm">Customer Name <RequiredStar /></FieldLabel>
                          <Input placeholder="Enter customer name" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="company"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel className="text-sm">Company <RequiredStar /></FieldLabel>
                          <Input placeholder="Enter company name" {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="group"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Group</FieldLabel>
                          <Input placeholder="Enter group name" {...field} />
                        </Field>
                      )}
                    />

                    <Controller
                      name="industry"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Industry</FieldLabel>
                          <IndustrySearch value={field.value} onReturn={field.onChange} />
                        </Field>
                      )}
                    />
                  </div>
                </FieldSet>

                {/* LOCATION */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-rose-700" />
                    Location
                  </FieldLegend>

                  <div className="space-y-3">
                    <Controller
                      name="city"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel className="text-sm">City <RequiredStar /></FieldLabel>
                          <CitiesSearch value={field.value} onReturn={field.onChange} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Address</FieldLabel>
                          <Input placeholder="Enter full address" {...field} />
                        </Field>
                      )}
                    />

                    <Controller
                      name="pin"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Google Location Pin</FieldLabel>
                          <Input placeholder="Paste Google Maps link" {...field} />
                        </Field>
                      )}
                    />
                  </div>
                </FieldSet>

                {/* BUSINESS SETTINGS */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <Settings2 className="h-4 w-4 text-amber-700" />
                    Business Settings
                  </FieldLegend>

                  <div className="space-y-3">
                    <Controller
                      name="platform"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Platform</FieldLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {["SOCIAL MEDIA", "SENFENG", "DIRECT"].map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />

                    {!(user_designation === "Sales" || user_designation === "Dealer") && (
                      <Controller
                        name="office"
                        control={control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className="text-sm">Office Branch <RequiredStar /></FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select office" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {["lahore", "karachi"].map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item.charAt(0).toUpperCase() + item.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                    )}

                    {ownership && (
                      <Controller
                        name="ownership"
                        control={control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className="text-sm">Ownership</FieldLabel>
                            <UserSearch value={field.value} onReturn={field.onChange} />
                          </Field>
                        )}
                      />
                    )}
                  </div>
                </FieldSet>

                {/* LEAD & REMARKS */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <BriefcaseBusiness className="h-4 w-4 text-violet-700" />
                    Lead & Remarks
                  </FieldLegend>

                  <div className="space-y-3">
                    {!(user_designation === "Sales" || user_designation === "Dealer") && (
                      <Controller
                        name="lead"
                        control={control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className="text-sm">Lead Generated By</FieldLabel>
                            <UserSearch
                              lead
                              value={field.value}
                              onReturn={field.onChange}
                              onReturnData={(val: any) => {
                                if (val.designation === "Social Media Manager") {
                                  form.setValue("platform", "SOCIAL MEDIA")
                                } else {
                                  form.setValue("platform", "")
                                }
                              }}
                            />
                          </Field>
                        )}
                      />
                    )}

                    <Controller
                      name="remarks"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Remarks</FieldLabel>
                          <Input placeholder="Add any additional notes" {...field} />
                        </Field>
                      )}
                    />
                  </div>
                </FieldSet>

                {/* ADDITIONAL OPTIONS */}
                <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
                    <CalendarDays className="h-4 w-4 text-slate-700" />
                    Additional Options
                  </FieldLegend>

                  <div className="space-y-3">
                    {/* <Controller
                      name="rating"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Rating</FieldLabel>
                          <StarRating value={field.value} onChange={field.onChange} />
                        </Field>
                      )}
                    /> */}

                    {(isAdmin || designation === "Customer Relationship Manager") && (
                      <Controller
                        name="created_at"
                        control={control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className="text-sm">Date</FieldLabel>
                            <AppCalendar date={field.value} onChange={field.onChange} />
                          </Field>
                        )}
                      />
                    )}

                    <Controller
                      name="member"
                      control={control}
                      render={({ field }) => (
                        <Field className="rounded-xl border bg-muted/15 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <FieldLabel htmlFor="member" className="cursor-pointer text-sm font-medium">
                              Member?
                            </FieldLabel>
                            <div>
                              <Checkbox
                                id="member"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                          </div>
                        </Field>
                      )}
                    />
                  </div>
                </FieldSet>

              </div>

              <div className="w-full rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    Duplicate number checks and required fields are validated before save.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleClose(false)}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={
                        loading ||
                        customerInfo.length > 0 ||
                        checking ||
                        numbers.filter(Boolean).length === 0
                      }
                      className="w-full sm:w-auto"
                      type="submit"
                    >
                      {loading && <Spinner className="mr-2 size-4" />}
                      Register Customer
                    </Button>
                  </div>
                </div>
              </div>
            </form>


          </div>
        </ScrollArea>


      </DialogContent>
    </Dialog>
  );
};

export default memo(AddCustomerDialog);
