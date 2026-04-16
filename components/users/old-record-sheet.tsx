import AppCalendar from "@/components/appCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendarRange from "../appCalendarRange";


const OldRecordSheet = ({ visible, onClose, user_id }) => {
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState(null);
  const [data, setData] = useState([]);
  const { userID, base_route } = useUserDetail();
  const [sendLoading, setSendLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("All");
  const [rangeDate, setRangeDate] = useState(null)

  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
    condition: z.string({ required_error: "type is required" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      condition: "All",
    },
  });

  async function onSubmit(values) {
    if (!user_id) return;
    setData([])
    setRangeDate(null)
    setLoading(true);
    let start = values.start.toISOString();
    let end = values.end.toISOString();
    let type = values.condition;

    try {
      let query = `/${user_id}/feedback?start_date=${start}&end_date=${end}`;
      if (type === "Customer") {
        query += "&member=FALSE";
      } else if (type === "Member") {
        query += "&member=TRUE";
      }
      const response = await axios.get(query);

      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  function handleClose(val) {
    onClose(val);
    handleClear();
  }

  function handleClear() {
    form.reset({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
    });
    setData([]);
  }

  async function handleSendReport(e) {
    e.preventDefault();
    setSendLoading(true);

    try {
      const response = await axios.post(`/${userID}/conversations`, {
        user1: userID,
        user2: sendTo,
      });
      if (response.data?.id) {
        let formData = { type: "feedback", content: visibleData };
        const startDate = form.getValues("start");
        const endDate = form.getValues("end");

        await axios
          .post(`/${userID}/conversations/${response.data?.id}`, {
            senderId: userID,
            message: `Report ${moment(startDate).format(
              "YYYY-MM-DD"
            )} to ${moment(endDate).format("YYYY-MM-DD")}`,
            data: JSON.stringify(formData),
          })
          .then(() => {
            toast({ title: "Report sent" });
          });
      }
    } finally {
      setSendLoading(false);
    }
  }



  const uniqueUserNames = [...new Set(data.map((item) => item.user_name))];

  const visibleData = data
    .filter((item) => filterValue === "All" || item.user_name.includes(filterValue))
    .filter((item) => {
      if (rangeDate?.from && rangeDate?.to) {
        const start = moment(rangeDate.from).startOf("day")
        const end = moment(rangeDate.to).endOf("day")

        return moment(item.customer_created_at).isBetween(start, end, null, "[]")

      }
      return true
    })




  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent
        style={{ width: "100%", maxWidth: "95vw", alignItems: "flex-start" }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">Feedbacks Record</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-row gap-4 items-end flex-wrap"
            >
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <AppCalendar
                        date={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                        }}
                      />



                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <AppCalendar
                        date={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {["All", "Customer", "Member"].map((item, idx) => (
                            <SelectItem key={idx} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={loading} type="submit">
                {loading && <Spinner />} Filter
              </Button>

              {data.length > 0 && (
                <div className="flex gap-2 items-end">
                  <div>
                    <Label>Filter customer date</Label>
                    <AppCalendarRange
                      date={rangeDate}
                      onChange={setRangeDate}
                    />
                  </div>
                  <div className="space-y-2">

                    <Select onValueChange={setFilterValue} value={filterValue}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by user" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Filter</SelectLabel>
                          <SelectItem value={"All"}>{"All"}</SelectItem>
                          {uniqueUserNames.map((item, idx) => (
                            <SelectItem key={idx} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select user</Label>
                    <UserSearch
                      className="w-[200px]"
                      onReturn={setSendTo}
                      value={sendTo}
                    />
                  </div>
                  <Button
                    disabled={!sendTo || sendLoading}
                    onClick={handleSendReport}
                  >
                    {sendLoading && <Spinner />}Send Report
                  </Button>
                </div>
              )}
            </form>
          </Form>
          <ScrollArea className="h-[80vh] px-4">
            {data.length == 0 ? (
              <div className="flex flex-1 flex-col gap-2">
                <p>No data to display</p>
              </div>
            ) : (
              <div className="px-4 py-6 space-y-2 border-l-2 border-muted relative">
                {visibleData.map((fb, index) => (
                  <div key={fb.id} className="relative pl-6">
                    {/* Dot on the timeline */}
                    <div className="absolute left-[-9px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />

                    {/* Card content */}
                    <Card className="bg-background border border-border shadow-sm">
                      <CardHeader className="pb-0">
                        <div className="text-sm text-muted-foreground">
                          <span className="mr-2">{fb?.user_name}</span>
                          {moment(fb.feedback_date).format("YYYY-MM-DD")}
                        </div>
                        <Link
                          target="blank"
                          href={`/${base_route}/member/${fb.customer_id}`}
                        >
                          <div className="text-base font-semibold text-foreground hover:underline">
                            {`${fb.name} - ${fb.owner} - ${fb.location}`}
                          </div>
                        </Link>
                      </CardHeader>

                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                        <div>
                          <span className="font-medium text-foreground">
                            Number:
                          </span>{" "}
                          {fb.number}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Status:
                          </span>{" "}
                          {fb.status}
                        </div>

                        <div className="col-span-full pt-2 border-t mt-2 text-foreground whitespace-pre-line">
                          <p className="mt-2">
                            {fb.feedback || (
                              <em className="text-muted-foreground">
                                No feedback provided.
                              </em>
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default OldRecordSheet;
