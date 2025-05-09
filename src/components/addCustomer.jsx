"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, Star, Trash } from "lucide-react";
import { Label } from "./ui/label";
import { CitiesSearch } from "./cities-search";
import { IndustrySearch } from "./industry-search";
import StarRating from "./startRating";
import { Checkbox } from "./ui/checkbox";
import { RequiredStar } from "./RequiredStar";
import { UserSearch } from "./user-search";
import { toast } from "@/hooks/use-toast";
import { BASE_URL } from "@/constants/data";
import { UserContext } from "@/store/context/UserContext";
import { debounce } from "@/lib/debounce";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { NumberSearch } from "./number-search";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import AppCalendar from "./appCalendar";

const AddCustomerDialog = ({
  onRefresh,
  visible,
  onClose,
  user_id,
  ownership,
}) => {
  const [numbers, setNumbers] = useState([""]);
  const [numberError, setNumberError] = useState(""); 
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [checking, setChecking] = useState(false);
  const [customerInfo, setCustomerInfo] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(["+92"]);

  const formSchema = z.object({
    company: z.string().optional(), // Optional field without min(1)
    owner: z.string().min(1, { message: "" }), // Required field
    email: z.string().optional(), // Optional but must be a valid email if provided
    city: z.string().min(1, { message: "" }), // Required field
    industry: z.string().optional(), // Optional field
    remarks: z.string().optional(), // Optional field
    address: z.string().optional(), // Optional field
    group: z.string().optional(), // Optional field
    other: z.string().optional(),
    lead: z.number().nullable().optional(),
    platform: z.string().optional(),
    pin: z.string().optional(),
    rating: z.number().optional(),
    member: z.boolean().optional(),
    ownership: z.number().nullable().optional(),
    created_at: z.date().nullable().optional(),
  });

  const form = useForm({
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
      created_at: null,
    },
  });

  const { control, setValue, getValues } = form;

  function handleClose(val) {
    setNumberError("");
    setNumbers([""]);
    form.reset();
    onClose(val);
  }

  async function onSubmit(values) {
    setLoading(true);

    try {
      const finalData = numbers.map((item, index) => {
        return selectedNumber[index] + item;
      });

      // let i = 0;
      // temp.forEach((num) => {
      //   if (num && num.charAt(0) !== "+") {
      //     i++;
      //     setNumberError("Follow correct number format");
      //     return;
      //   }
      // });

      // if (i > 0) return;

      const response = await axios.post(`/customer`, {
        name: values.company,
        email: values.email,
        customer_group: values.group,
        industry: values.industry,
        location: values.city,
        number: finalData,
        owner: values.owner,
        address: values.address,
        rating: values.rating,
        image: "",
        remarks: values.remarks,
        member: values.member,
        lead: values.lead || undefined,
        other: values.other,
        platform: values.platform,
        pin: values.pin,
        ownership:
          UserState.value.data?.designation == "Sales"
            ? UserState.value.data?.id
            : ownership
            ? values.ownership
            : undefined,
        created_by: UserState.value.data?.id,
        created_at: values.created_at || undefined,
      });
      toast({ title: "Customer Addedd successfully" });
      await onRefresh(response.data.data);
      handleClose(false);
    } finally {
      setLoading(false);
    }
  }

  const addNumberField = () => {
    setNumbers((prevState) => [...prevState, ""]);
    setSelectedNumber((prevState) => [...prevState, "+92"]);
  };

  const removeNumberField = (index) => {
    setNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
    setSelectedNumber((prevState) =>
      prevState.filter((_, ind) => ind !== index)
    );
  };

  const handleNumberChange = (index, value) => {
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

  const handlePrefixChange = (index, value) => {
    setSelectedNumber((prevState) => {
      const newState = [...prevState];
      newState[index] = value;
      return newState;
    });
  };

  const checkNumberInDatabase = async (number) => {
    setCustomerInfo([]);
    setChecking(true);
    try {
      const response = await axios.post(`/check-number`, { number });

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
        <ScrollArea className="max-h-[85vh] px-2">
          <div className="px-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex flex-1 gap-10 flex-wrap">
                  <div className="flex flex-1 flex-col space-y-4">
                    <div>
                      <FormItem>
                        <FormLabel
                          style={{ color: numberError ? "red" : "black" }}
                        >
                          Phone Number <RequiredStar />
                        </FormLabel>
                        {numbers.map((num, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-[200px]">
                              <NumberSearch
                                value={selectedNumber[index]}
                                onReturn={(val) =>
                                  handlePrefixChange(index, val)
                                }
                              />
                            </div>
                            <FormControl className="flex-1">
                              <Input
                                disabled={!selectedNumber[index]}
                                placeholder="xxxxxxxxx"
                                value={num}
                                onChange={(e) =>
                                  handleNumberChange(index, e.target.value)
                                }
                              />
                            </FormControl>
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
                            {checking && (
                              <Loader2 className="animate-spin ml-2" />
                            )}
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
                      </FormItem>
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
                                href={`/${UserState.value.data?.base_route}/customer${item?.id}`}
                                className="block text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
                              >
                                {item?.name || item?.owner} -{" "}
                                {item?.number.join(", ")}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <Label style={{ color: "red" }}>{numberError}</Label>
                    </div>

                    <FormField
                      control={control}
                      name="owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Customer <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter customer name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="group"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter group name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            City <RequiredStar />
                          </FormLabel>
                          <FormControl>
                            <CitiesSearch
                              value={field.value}
                              onReturn={(val) => field.onChange(val)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {ownership && (
                      <FormField
                        control={control}
                        name="ownership"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ownership</FormLabel>
                            <FormControl>
                              <UserSearch
                                value={field.value}
                                onReturn={(val) => field.onChange(val)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={control}
                      name="lead"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Generated By</FormLabel>
                          <FormControl>
                            <UserSearch
                              lead={true}
                              value={field.value}
                              onReturn={(val) => field.onChange(val)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-1 flex-col space-y-4">
                    <FormField
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="other"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other IDs</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="wechat / qq / facebook / twitter"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <IndustrySearch
                              value={field.value}
                              onReturn={(val) => field.onChange(val)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter remarks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectGroup>
                                  {["SOCIAL MEDIA", "SENFENG", "DIRECT"].map(
                                    (item) => (
                                      <SelectItem key={item} value={item}>
                                        {item}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Location Pin</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter pin location"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-row gap-10">
                      <FormField
                        control={control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating</FormLabel>
                            <FormControl>
                              <StarRating
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="created_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <AppCalendar
                                date={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="member"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="pr-2">Member?</FormLabel>
                            <FormControl>
                              <Checkbox
                                className="mt-5"
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  disabled={
                    customerInfo.length > 0 ||
                    checking ||
                    numbers.filter((item) => {
                      if (item) return item;
                    }).length === 0
                  }
                  className="w-full mt-10"
                  type="submit"
                >
                  {loading && <Loader2 className="animate-spin" />} Submit
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;
