import AppCalendar from "@/components/app-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { OldRecordProps } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import Link from "next/link";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AppCalendarRange from "../app-calendar-range";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";


const formSchema = z.object({
  start: z.date({ error: "Start date is required." }),
  end: z.date({ error: "End date is required." }),
  condition: z.string({ error: "type is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const OldRecordSheet = ({ visible, onClose, user_id }: { visible: boolean, onClose: (val: boolean) => void, user_id: number | string }) => {
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState<number | null>(null);
  const [data, setData] = useState<OldRecordProps[]>([]);
  const { userID, base_route } = useUserDetail();
  const [sendLoading, setSendLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("All");
  const [rangeDate, setRangeDate] = useState<DateRange | null | undefined>(null)



  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      condition: "All",
    },
  });

  async function onSubmit(values: FormValues) {
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

  function handleClose(val: boolean) {
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

  async function handleSendReport(e: React.MouseEvent<HTMLButtonElement>) {
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
            toast.success("Report sent");
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

        return moment(item.feedback_date).isBetween(start, end, null, "[]")

      }
      return true
    })



  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[95vw] sm:min-w-[95vw] p-4"
      >
        <SheetHeader className="p-0 m-0">
          <SheetTitle className="text-2xl">Feedbacks Record</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-110px)] pr-4">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup className="flex flex-row items-end flex-wrap">
              <div>
                <Controller
                  name="start"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Start date</FieldLabel>

                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        max={""}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div>
                <Controller
                  name="end"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>End date</FieldLabel>

                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        max={""}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="w-[200px]">
                <Controller
                  name="condition"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Select type</FieldLabel>

                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>

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

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              {/* Submit */}
              <Button disabled={loading} type="submit">
                {loading && <Spinner />} Filter
              </Button>

            </FieldGroup>


          </form>


          {data.length > 0 && (
            <div className="flex flex-wrap items-end gap-4 mt-4">
              <div className="space-y-2">
                <FieldLabel>Filter customer date</FieldLabel>
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
                      <SelectItem value={"All"}>All</SelectItem>
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
                <FieldLabel>Select user</FieldLabel>
                <UserSearch
                  className="w-[200px]"
                  onReturn={(val)=>setSendTo(val)}
                  value={sendTo}
                />
              </div>

              <Button
                disabled={!sendTo || sendLoading}
                onClick={handleSendReport}
              >
                {sendLoading && <Spinner />} Send Report
              </Button>


            </div>
          )}



          {data.length == 0 ? (
            <div className="flex flex-1 flex-col gap-2 mt-5">
              <p>No data to display</p>
            </div>
          ) : (
            <div className="px-4 py-6 space-y-2 relative">
              {visibleData.map((fb, index) => (
                <div key={fb.id} className="relative pl-6">

                  <div className="absolute left-[-9px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />


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
                        {fb?.number?.join(", ")}
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
      </SheetContent>
    </Sheet>
  );
};

export default OldRecordSheet;
