import { TIMEZONE } from "@/constants/data";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import momentT from "moment-timezone";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/shared/search/user-search";
import { format, setMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterSheetProps = {
  visible: boolean;
  onClose: Dispatch<SetStateAction<boolean>>;
  user_disable?: boolean;
  onReturn: ({
    start,
    end,
    user,
  }: {
    start: string;
    end: string;
    user?: number;
  }) => Promise<void>;
};

const formSchema = z.object({
  start: z.date({ error: "Start date is required." }),
  end: z.date({ error: "End date is required." }),
  user: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FilterSheet = ({
  visible,
  onClose,
  onReturn,
  user_disable = true,
}: FilterSheetProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      user: undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    let start = values.start;
    let end = values.end;

    await onReturn({
      start: momentT.tz(start, TIMEZONE).startOf("day").utc().toISOString(),
      end: momentT.tz(end, TIMEZONE).endOf("day").utc().toISOString(),
      user: values.user,
    });
    setLoading(false);
    onClose(false);
    handleClear();
  }

  function handleClose() {
    onClose(false);
    handleClear();
  }

  function handleClear() {
    form.reset({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      user: undefined,
    });
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
          <FieldGroup>
            {!user_disable && (
              <Controller
                name="user"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Select User</FieldLabel>

                    <UserSearch value={field.value} onReturn={field.onChange} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

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

            <Button disabled={loading} className="w-full" type="submit">
              {loading && <Spinner />} Filter
            </Button>
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export const FilterSheetMonth = ({
  visible,
  onClose,
  onReturn,
}: FilterSheetProps) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const years = Array.from(
    { length: 20 },
    (_, i) => new Date().getFullYear() - 10 + i,
  );

  const months = Array.from({ length: 12 }, (_, i) =>
    format(setMonth(new Date(), i), "MMMM"),
  );

  function handleClear() {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth());
  }

  function handleClose() {
    onClose(false);
    handleClear();
  }

  async function handleFilter() {
    const startDate = momentT
      .tz(
        moment()
          .year(selectedYear)
          .month(selectedMonth)
          .startOf("month")
          .toDate(),
        TIMEZONE,
      )
      .startOf("day")
      .utc()
      .toISOString();

    const endDate = momentT
      .tz(
        moment()
          .year(selectedYear)
          .month(selectedMonth)
          .endOf("month")
          .toDate(),
        TIMEZONE,
      )
      .endOf("day")
      .utc()
      .toISOString();

    onReturn({
      start: startDate,
      end: endDate,
    });

    onClose(false);
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Filter data by month and year</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <FieldSet className="gap-3 rounded-md border p-3">
            <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
              Month Filter
            </FieldLegend>

            <FieldGroup>
              <Field>
                <FieldLabel>Select Month</FieldLabel>

                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(month) => {
                    setSelectedMonth(Number(month));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>

                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Select Year</FieldLabel>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(year) => {
                    setSelectedYear(Number(year));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>

                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button className="w-full" type="button" onClick={handleFilter}>
                Filter
              </Button>
            </FieldGroup>
          </FieldSet>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
