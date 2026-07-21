"use client";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { CitiesSearch } from "@/components/shared/search/cities-search";
import { IndustrySearch } from "@/components/shared/search/industry-search";
import { NumberSearch } from "@/components/shared/search/number-search";
import { UserSearch } from "@/components/shared/search/user-search";
import Dropzone from "@/components/shared/uploads/dropzone";
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
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { storage } from "@/config/firebase";
import { CountriesList } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce } from "@/lib/debounce";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { MyCustomer } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import {
  Building2,
  CalendarDays,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  Sparkles,
  Trash,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type EditCustomerDialogProps = {

  onRefresh: () => Promise<void>;
  visible: boolean;
  onClose: (val: boolean) => void;
  data: MyCustomer;
  ownership: boolean | null;
  onClickDelete: () => void
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
  image: z.string().optional()

})

type FormSchemaValues = z.infer<typeof formSchema>;

const EditCustomerDialog = ({
  onRefresh,
  visible,
  onClose,
  data,
  ownership,
  onClickDelete,
}: EditCustomerDialogProps) => {
  const [numbers, setNumbers] = useState([""]);
  const [numberError, setNumberError] = useState("");
  const [loading, setLoading] = useState(false);
  const { userID, isAdmin, customer_delete_access, designation, base_route } =
    useUserDetail();
  const [checking, setChecking] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<MyCustomer[]>([]);
  const [selectedNumber, setSelectedNumber] = useState(["+92"]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const { state: OfficeState } = useContext(OfficeContext)!

  const canDelete = isAdmin || customer_delete_access;


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
      image: "",
      member: false,
      ownership: null,
      created_at: undefined,
      office: "islamabad"
    },
  });

  const { control } = form;

  useEffect(() => {
    if (data) {
      let tempNumbers: string[] = [];
      let tempSelectedNumber: string[] = [];

      data?.number?.forEach((num) => {
        let found = false;
        for (let country of CountriesList) {
          if (num.startsWith(country.num)) {
            tempSelectedNumber.push(country.num);
            tempNumbers.push(num.slice(country.num.length));
            found = true;
            break;
          }
        }
        if (!found) {
          tempSelectedNumber.push("");
          tempNumbers.push(num);
        }
      });

      setSelectedNumber([...tempSelectedNumber]);
      setNumbers([...tempNumbers]);
      if (data.image) {
        getDownloadURL(ref(storage, data.image)).then((url) => {
          setImageUrl(url);
          setOriginalUrl(url);
        });
      }

      form.reset({
        company: data?.name || "",
        owner: data?.owner || "",
        email: data?.email || "",
        city: data?.location || "",
        industry: data?.industry || "",
        remarks: data?.remarks || "",
        address: data?.address || "",
        group: data?.customer_group || "",
        rating: data?.rating || 0,
        image: data?.image || "",
        member: data?.member || false,
        ownership: data?.ownership || null,
        lead: data?.lead || null,
        other: data?.other || "",
        pin: data?.pin || "",
        platform: data?.platform || "",
        created_at: data?.created_at ? new Date(data.created_at) : undefined,
        office: data?.office || ""
      });
    }
  }, [data, form]);

  function handleClose(val: boolean) {
    form.reset();
    setLoading(false);
    onClose(val);
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

    const finalData = numbers.map((item, index) => {
      return selectedNumber[index] + item;
    });

    const apiData = {
      name: values.company,
      email: values.email,
      customer_group: values.group,
      industry: values.industry,
      location: values.city,
      number: finalData,
      owner: values.owner,
      address: values.address,
      rating: values.rating,
      remarks: values.remarks,
      member: values.member,
      ownership: values.ownership,
      lead: values.lead,
      other: values.other,
      platform: values.platform,
      pin: values.pin,
      created_at: values.created_at,
      office: values.office
    };

    try {
      let backendRoute = `/${userID}/customer/${data.id}`;
      if (data.image && !imageUrl) {
        DeleteFromStorage(data.image);
        const response = await axios.put(backendRoute, {
          ...apiData,
          image: null,
        });
      } else if (imageUrl && !data.image) {
        const name = `${OfficeState.value.data}/customer/${data.id
          }/profile/${moment().valueOf().toString()}.png`;
        const uploadRef = await UploadImage(imageUrl, name);
        const response = await axios.put(backendRoute, {
          ...apiData,
          image: name,
        });
      } else if (originalUrl !== imageUrl) {
        const name = data.image;
        const uploadRef = await UploadImage(imageUrl, name);
      } else {
        const response = await axios.put(backendRoute, apiData);
      }

      toast.success("Customer Edited successfully");
      await onRefresh();
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
      const response = await axios.post(`/${userID}/check-number`, { number },
        {
          cancelKey: `check-number-${userID}`,
        },);
      const finalData = response.data.filter((item: { id: number }) => item.id !== data.id);
      setCustomerInfo(finalData);
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
              <Pencil className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Edit Customer
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update profile, contact, location, ownership, image, and lead details.
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* Contact Information */}
                <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <Phone className="h-4 w-4 text-emerald-700" />
                    Contact Information
                  </FieldLegend>

                  {/* Phone Numbers */}
                  <Field>
                    <FieldLabel style={{ color: numberError ? "red" : undefined }}>
                      Phone Number <RequiredStar />
                    </FieldLabel>

                    <div className="space-y-2">
                      {numbers.map((num, index) => (
                        <div key={index} className="grid gap-2 rounded-xl border bg-muted/15 p-2 sm:grid-cols-[112px_1fr_auto] sm:items-center">
                          <div>
                            <NumberSearch
                              value={selectedNumber[index]}
                              onReturn={(val) => handlePrefixChange(index, val)}
                            />
                          </div>

                          <Input
                            type="number"
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
                                  removeNumberField(index);
                                  setCustomerInfo([]);
                                }}
                              >
                                <Trash size={14} />
                              </Button>
                            )}

                            {checking && <Spinner />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      disabled={customerInfo.length > 0 || checking}
                      type="button"
                      variant="outline"
                      onClick={addNumberField}
                      size="sm"
                      className="mt-2"
                    >
                      + Add Number
                    </Button>
                  </Field>

                  {/* Existing customer warning */}
                  {customerInfo.length > 0 && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                      <Label className="text-xs font-semibold text-destructive">
                        Warning: Number exists with:
                      </Label>
                      {customerInfo.map((item, index) => (
                        <Link
                          key={index}
                          target="_blank"
                          href={`/${base_route}/${item.member ? "member" : "customer"}/${item.id}`}
                          className="mt-1 block rounded-lg bg-background/80 px-2 py-1 text-xs text-destructive hover:underline"
                        >
                          {item.name || item.owner} - {item.number?.join(", ")}
                        </Link>
                      ))}
                    </div>
                  )}

                  {numberError && <Label className="text-xs text-destructive">{numberError}</Label>}

                  {/* Email */}
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

                  {/* Other IDs */}
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
                </FieldSet>

                {/* Customer Details */}
                <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    Customer Details
                  </FieldLegend>

                  {/* Owner */}
                  <Controller
                    name="owner"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Customer <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter customer name" {...field} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* Company */}
                  <Controller
                    name="company"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Company <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter company name" {...field} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* Group */}
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

                  {/* Industry */}
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

                  {/* Image */}
                  <Controller
                    name="image"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Image</FieldLabel>
                        <Dropzone
                          value={imageUrl}
                          onDrop={(file) => setImageUrl(file)}
                          title="Click to upload"
                          subheading="or drag and drop"
                          description="PNG or JPG"
                          drag="Drop the files here..."
                        />
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Location */}
                <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-rose-700" />
                    Location
                  </FieldLegend>

                  {/* City */}
                  <Controller
                    name="city"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          City <RequiredStar />
                        </FieldLabel>
                        <CitiesSearch value={field.value} onReturn={field.onChange} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* Address */}
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

                  {/* Pin */}
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
                </FieldSet>

                {/* Business Settings */}
                <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <FieldLegend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <Settings2 className="h-4 w-4 text-amber-700" />
                    Business Settings
                  </FieldLegend>

                  {/* Platform */}
                  <Controller
                    name="platform"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Platform</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {["SOCIAL MEDIA", "SENFENG", "DIRECT"].map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  {/* Office */}
                  {!(designation === "Sales" || designation === "Dealer") && (
                    <Controller
                      name="office"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Office branch <RequiredStar />
                          </FieldLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                            <SelectContent>
                              {["lahore", "karachi"].map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  )}

                  {/* Ownership */}
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

                  {/* Lead */}
                  {designation !== "Sales" && (
                    <Controller
                      name="lead"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Lead Generated By</FieldLabel>
                          <UserSearch lead value={field.value} onReturn={field.onChange} />
                        </Field>
                      )}
                    />
                  )}

                  {/* Remarks */}
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
                </FieldSet>

                {/* Additional Options */}
                <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <FieldLegend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <CalendarDays className="h-4 w-4 text-slate-700" />
                    Additional Options
                  </FieldLegend>

                  <div className="flex gap-6 flex-wrap items-end">
                    {/* <Controller
                      name="rating"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Rating</FieldLabel>
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
                            <FieldLabel>Date</FieldLabel>
                            <AppCalendar date={field.value} onChange={field.onChange} />
                          </Field>
                        )}
                      />
                    )}

                    {designation !== "Sales" && (
                      <Controller
                        name="member"
                        control={control}
                        render={({ field }) => (
                          <Field className="rounded-xl border bg-muted/15 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <FieldLabel htmlFor="member" className="cursor-pointer text-sm font-medium">
                                Member?
                              </FieldLabel>
                              <Checkbox
                                id="member"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                          </Field>
                        )}
                      />
                    )}
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
                      Save Changes
                    </Button>
                  </div>
                </div>
                {canDelete && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onClickDelete();
                    }}
                    variant="destructive"
                    className="mt-2 w-full"
                  >
                    Delete Customer
                  </Button>
                )}
              </div>
            </form>



          </div>
        </ScrollArea>


      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;
