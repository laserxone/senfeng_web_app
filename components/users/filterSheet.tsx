import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import momentT from "moment-timezone";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "../appCalendar";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import Spinner from "../ui/spinner";
import { UserSearch } from "../user-search";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";

type FilterSheetProps = {
  visible: boolean,
  onClose: () => void,
  user_disable?: boolean,
  onReturn: (
    { start, end, user }:
      { start: string, end: string, user?:  number }) => Promise<void>
}

const formSchema = z.object({
  start: z.date({ error: "Start date is required." }),
  end: z.date({ error: "End date is required." }),
  user: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FilterSheet = ({ visible, onClose, onReturn, user_disable = true }: FilterSheetProps) => {
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
    onClose();
    handleClear();
  }

  function handleClose() {
    onClose();
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
        <SheetHeader >
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

                    <UserSearch
                      value={field.value}
                      onReturn={field.onChange}
                    />

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

export default FilterSheet;
