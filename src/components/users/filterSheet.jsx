import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import AppCalendar from "../appCalendar";
import { Button } from "../ui/button";
import { useContext, useState } from "react";
import { Loader2 } from "lucide-react";
import { UserContext } from "@/store/context/UserContext";
import { UserSearch } from "../user-search";

const FilterSheet = ({ visible, onClose, onReturn }) => {
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
    user: z.number().nullable().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: undefined,
      end: undefined,
      user: null,
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    await onReturn(values);
    setLoading(false);
    onClose();
    handleClear()
  }

  function handleClose (val){
    
    onClose()
    handleClear()
  }

  function handleClear(){
    form.reset({
      start: undefined,
      end: undefined,
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
            {UserState.value.data?.designation === 'Owner' && (
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
                      onChange={(date) => field.onChange(date)}
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
                        console.log(date);
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">
              {loading && <Loader2 className="animate-spin" />} Filter
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
