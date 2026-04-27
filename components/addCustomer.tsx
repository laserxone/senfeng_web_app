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
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
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
  onClose: (val : boolean)=> void;
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
          <DialogTitle>Add new customer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[85dvh] px-2">
          <div className="px-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup className="flex flex-1 flex-row gap-10 flex-wrap">

                {/* LEFT COLUMN */}
                <div className="flex flex-1 flex-col space-y-4">

                  {/* Phone Numbers (custom non-RHF section kept as-is) */}
                  <div>
                    <Label style={{ color: numberError ? "red" : "black" }}>
                      Phone Number <RequiredStar />
                    </Label>

                    {numbers.map((num, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-[150px]">
                          <NumberSearch
                            value={selectedNumber[index]}
                            onReturn={(val) => handlePrefixChange(index, val)}
                          />
                        </div>

                        <Input
                          disabled={!selectedNumber[index]}
                          placeholder="xxxxxxxxx"
                          value={num}
                          onChange={(e) => handleNumberChange(index, e.target.value)}
                        />

                        {index > 0 && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              removeNumberField(index);
                              setCustomerInfo([]);
                            }}
                          >
                            <Trash size={16} />
                          </Button>
                        )}

                        {checking && <Spinner />}
                      </div>
                    ))}

                    <Button
                      disabled={customerInfo.length > 0 || checking}
                      type="button"
                      onClick={addNumberField}
                      className="mt-2"
                    >
                      + Add Number
                    </Button>

                    {customerInfo.length > 0 && (
                      <div className="mt-2 p-3 bg-red-100 dark:bg-red-900 rounded-lg border border-red-400">
                        <Label className="text-red-700 dark:text-red-300 font-medium text-sm">
                          ⚠️ Number exists with the following:
                        </Label>

                        <div className="mt-1 space-y-1">
                          {customerInfo.map((item, index) => (
                            <Link
                              key={index}
                              target="_blank"
                              href={`/${base_route}/customer/${item?.id}`}
                              className="block text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
                            >
                              {item?.name || item?.owner} -{" "}
                              {item?.number?.join(", ")}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <Label style={{ color: "red" }}>{numberError}</Label>
                  </div>

                  {/* OWNER */}
                  <Controller
                    name="owner"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Customer <RequiredStar /></FieldLabel>
                        <Input placeholder="Enter customer name" {...field} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* COMPANY */}
                  <Controller
                    name="company"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Company <RequiredStar /></FieldLabel>
                        <Input placeholder="Enter company name" {...field} />
                         {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* GROUP */}
                  <Controller
                    name="group"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Group</FieldLabel>
                        <Input placeholder="Enter group name" {...field} />
                      </Field>
                    )}
                  />

                  {/* CITY */}
                  <Controller
                    name="city"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>City <RequiredStar /></FieldLabel>
                        <CitiesSearch value={field.value} onReturn={field.onChange} />
                         {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* OWNERSHIP */}
                  {ownership && (
                    <Controller
                      name="ownership"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Ownership</FieldLabel>
                          <UserSearch value={field.value} onReturn={field.onChange} />
                        </Field>
                      )}
                    />
                  )}

                  {/* LEAD */}
                  {!(user_designation === "Sales" || user_designation === "Dealer") && (
                    <Controller
                      name="lead"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Lead Generated By</FieldLabel>
                          <UserSearch
                            lead
                            value={field.value}
                            onReturn={field.onChange}
                            onReturnData={(val) => {
                              if (val.designation === "Social Media Manager") {
                                form.setValue("platform", "SOCIAL MEDIA");
                              } else {
                                form.setValue("platform", "");
                              }
                            }}
                          />
                        </Field>
                      )}
                    />
                  )}

                  {/* OFFICE */}
                  {!(user_designation === "Sales" || user_designation === "Dealer") && (
                    <Controller
                      name="office"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Office branch <RequiredStar /></FieldLabel>

                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select office" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectGroup>
                                {["lahore", "karachi"].map((item) => (
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
                  )}

                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-1 flex-col space-y-4">

                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input placeholder="Enter email" {...field} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="other"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Other IDs</FieldLabel>
                        <Input placeholder="wechat / qq / facebook / twitter" {...field} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Address</FieldLabel>
                        <Input placeholder="Enter address" {...field} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Industry</FieldLabel>
                        <IndustrySearch value={field.value} onReturn={field.onChange} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="remarks"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Remarks</FieldLabel>
                        <Input placeholder="Enter remarks" {...field} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="platform"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Platform</FieldLabel>

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

                  <Controller
                    name="pin"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Google Location Pin</FieldLabel>
                        <Input placeholder="Enter pin location" {...field} />
                      </Field>
                    )}
                  />

                  <div className="flex flex-row gap-10">

                    <Controller
                      name="rating"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Rating</FieldLabel>
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
                            <FieldLabel>Date</FieldLabel>
                            <AppCalendar date={field.value} onChange={field.onChange} />
                          </Field>
                        )}
                      />
                    )}

                    <Controller
                      name="member"
                      control={control}
                      render={({ field }) => (
                        <Field className="flex flex-row gap-2 items-center">
                          <FieldLabel>Member?</FieldLabel>
                          <div>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          </div>
                        </Field>
                      )}
                    />

                  </div>
                </div>
              </FieldGroup>

              {/* SUBMIT */}
              <Button
                disabled={
                  loading ||
                  customerInfo.length > 0 ||
                  checking ||
                  numbers.filter(Boolean).length === 0
                }
                className="w-full mt-10"
                type="submit"
              >
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default memo(AddCustomerDialog);
