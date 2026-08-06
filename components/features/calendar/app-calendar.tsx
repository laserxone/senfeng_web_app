import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
interface AppCalendarProps {
  date: Date | undefined | null;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date | "";
  required?: boolean;
}
const AppCalendar = ({
  date,
  onChange,
  min = new Date("1900-01-01"),
  max = new Date(),
  required = false,
}: AppCalendarProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          required={required}
          mode="single"
          captionLayout="dropdown"
          // startMonth={startMonth}
          // endMonth={endMonth}
          //   defaultMonth={date ?? undefined}
          selected={date ?? undefined}
          onSelect={(e: any) => {
            if (!e) return;
            const now = new Date();
            const updatedDate = new Date(e);
            updatedDate.setHours(
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
              now.getMilliseconds(),
            );
            onChange(updatedDate);
            setIsCalendarOpen(false);
          }}
          disabled={(date) => {
            if ((min && date < min) || (max && date >= max)) {
              return true;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default AppCalendar;
