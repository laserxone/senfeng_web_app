"use client";


import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce, debouncePromise } from "@/lib/debounce";
import { CustomerFormData, MyCustomer } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AppCalendar from "./appCalendar";
import { CitiesSearch } from "./cities-search";
import { IndustrySearch } from "./industry-search";
import { NumberSearch } from "./number-search";
import { RequiredStar } from "./RequiredStar";
import StarRating from "./startRating";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Spinner from "./ui/spinner";
import { UserSearch } from "./user-search";

type AddCustomerDialogProps = {

  onRefresh: (val: MyCustomer) => Promise<void>;
  visible: boolean;
  onClose: (val: boolean) => void;
  user_id: number;
  ownership: boolean;
  user_designation?: string | null;
  office?: string;
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
      office: office,
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
        lead: user_id,
        other: "",
        pin: "",
        platform: "SOCIAL MEDIA",
        rating: 0,
        member: false,
        ownership: null,
        created_at: undefined,
        office: office,
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
              : ownership
                ? values.ownership
                : undefined,
        created_by: user_id,
        created_at: values.created_at || undefined,
        office: values.office,
      };

      const response: MyCustomer = await debouncedSaveData(formData);

      toast.success("Customer Addedd successfully");

      await onRefresh(response);
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
      const response = await axios.post(`/${user_id}/check-number`, { number });
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
      <DialogContent className="w-full sm:w-[80vw] sm:max-w-[80vw]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add new customer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[85dvh] px-2">
          <div className="px-2">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CONTACT INFORMATION */}
                <FieldSet className="md:col-span-2 border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                    Contact Information
                  </FieldLegend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Phone Numbers - Full Width */}
                    <div className="md:col-span-2">
                      <Label style={{ color: numberError ? "hsl(var(--destructive))" : undefined }} className="text-sm font-medium">
                        Phone Number <RequiredStar />
                      </Label>

                      <div className="space-y-2 mt-1">
                        {numbers.map((num, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-28">
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
                              className="flex-1"
                            />
                            {index > 0 && (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="size-8"
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
                        ))}
                      </div>

                      <Button
                        disabled={customerInfo.length > 0 || checking}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addNumberField}
                        className="mt-2"
                      >
                        + Add Number
                      </Button>

                      {customerInfo.length > 0 && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20 text-sm">
                          <Label className="text-destructive font-medium text-xs">
                            Number exists with the following:
                          </Label>
                          <div className="mt-1 space-y-0.5">
                            {customerInfo.map((item, index) => (
                              <Link
                                key={index}
                                target="_blank"
                                href={`/${base_route}/customer/${item?.id}`}
                                className="block text-destructive text-xs hover:underline"
                              >
                                {item?.name || item?.owner} - {item?.number?.join(", ")}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {numberError && <Label className="text-destructive text-xs mt-1">{numberError}</Label>}
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
                <FieldSet className="border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
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
                <FieldSet className="border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
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
                <FieldSet className="border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
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
                <FieldSet className="border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
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
                <FieldSet className="border rounded-md p-3">
                  <FieldLegend className="px-2 text-sm font-medium text-muted-foreground">
                    Additional Options
                  </FieldLegend>

                  <div className="space-y-3">
                    <Controller
                      name="rating"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-sm">Rating</FieldLabel>
                          <StarRating value={field.value} onChange={field.onChange} />
                        </Field>
                      )}
                    />

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
                        <Field className="flex flex-row items-center gap-2 pt-1">
                          <div className="flex gap-2">
                            <FieldLabel htmlFor="member" className="cursor-pointer text-sm">
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

              {/* SUBMIT BUTTON */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  disabled={
                    loading ||
                    customerInfo.length > 0 ||
                    checking ||
                    numbers.filter(Boolean).length === 0
                  }
                  className="w-full"
                  type="submit"
                >
                  {loading && <Spinner className="mr-2 size-4" />}
                  Register Customer
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default memo(AddCustomerDialog);
