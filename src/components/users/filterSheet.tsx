import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import momentT from "moment-timezone";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

const FilterSheet = ({ visible, onClose, onReturn, user_disable = true }) => {
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useUserDetail();
  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
    user: z.number().nullable().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      user: null,
    },
  });

  async function onSubmit(values) {
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

  function handleClose(val) {
    onClose();
    handleClear();
  }

  function handleClear() {
    form.reset({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
      user: null,
    });
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!user_disable && (
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select User</FormLabel>
                    <FormControl>
                      <UserSearch
                        value={field.value}
                        onReturn={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            <Button disabled={loading} className="w-full" type="submit">
              {loading && <Spinner />} Filter
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
