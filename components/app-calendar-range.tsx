import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { DateRange } from "react-day-picker";

const AppCalendarRange = ({ date, onChange, min = new Date("1900-01-01") }: { date?: DateRange | null, onChange: (val: DateRange | undefined) => void, min?: Date }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          {date?.from && date?.to ? (
            <span>{format(date.from, "PP")} - {format(date.to, "PP")}</span>
          ) : date?.from ? (
            <span>{format(date.from, "PP")}</span>
          ) : date?.to ? (
            <span>{format(date.to, "PP")}</span>
          ) : (
            <span>Pick a date</span>
          )}

          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={date ?? undefined}
          onSelect={(e) => {
            // const now = new Date();
            // const updatedDate = new Date(e);
            // updatedDate.setHours(
            //   now.getHours(),
            //   now.getMinutes(),
            //   now.getSeconds(),
            //   now.getMilliseconds()
            // );
            // onChange(updatedDate);
            onChange(e)
            // console.log(e)
            // if (e?.to) {
            //   setIsCalendarOpen(false);
            // }

          }}
          disabled={(date) => date < min}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default AppCalendarRange;
