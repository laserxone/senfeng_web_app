"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useContext, useState } from "react";
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
import { Star, Trash } from "lucide-react";
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
  const {state : UserState} = useContext(UserContext)

  const formSchema = z.object({
    company: z.string().optional(), // Optional field without min(1)
    owner: z.string().min(1, { message: "" }), // Required field
    email: z.string().optional(), // Optional but must be a valid email if provided
    city: z.string().min(1, { message: "" }), // Required field
    industry: z.string().optional(), // Optional field
    remarks: z.string().optional(), // Optional field
    address: z.string().optional(), // Optional field
    group: z.string().optional(), // Optional field
    rating: z.number().optional(),
    member: z.boolean().optional(),
    ownership: z.number().nullable().optional(),
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
      rating: 0,
      member: false,
      ownership: null,
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
      const temp = numbers.filter((item) => {
        if (item) return item;
      });
      if (temp.length === 0) {
        setNumberError("Atleas one number is required");
        return;
      }

      const response = await axios.post(`${BASE_URL}/customer`, {
        name: values.company,
        email: values.email,
        customer_group: values.group,
        industry: values.industry,
        location: values.city,
        number: temp,
        owner: values.owner,
        address: values.address,
        rating: values.rating,
        image: "",
        remarks: values.remarks,
        member: values.member,
        ownership: UserState.value.data?.designation == 'Sales' ? UserState.value.data?.id : ownership ? values.ownership : undefined,
      });
      toast({ title: "Customer Addedd successfully" });
     await onRefresh();
      handleClose(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: error?.response?.data?.message || error?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const addNumberField = () => {
    setNumbers((prevState) => [...prevState, ""]);
  };

  const removeNumberField = (index) => {
    setNumbers((prevState) => prevState.filter((_, ind) => ind !== index));
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
  };

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>Add new customer</DialogTitle>
        </DialogHeader>
          <ScrollArea className="max-h-[75vh] px-2">
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
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <FormControl className="flex-1">
                                <Input
                                  placeholder="Enter number"
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
                                  onClick={() => removeNumberField(index)}
                                >
                                  <Trash size={16} />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={addNumberField}
                            className="mt-2"
                          >
                            + Add Number
                          </Button>
                        </FormItem>
                        {/* <Label style={{ color: "red" }}>{numberError}</Label> */}
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
                              <Input
                                placeholder="Enter group name"
                                {...field}
                              />
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
                              <FormLabel>
                                Ownership <RequiredStar />
                              </FormLabel>
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

                  <Button className="w-full mt-10" type="submit">
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
