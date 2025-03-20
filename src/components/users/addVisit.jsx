import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { BASE_URL } from "@/constants/data";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(7, "Phone must be at least 7 digits"),
  note: z.string().min(1, "Note cannot be empty"),
});

export default function VisitTab({ id, data, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState(data || []);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", city: "", phone: "", note: "" },
  });

  const onSubmit = (values) => {
    setLoading(true);
    axios
      .post(`${BASE_URL}/user/${id}/visit`, { ...values, user_id: id })
      .then((response) => {
        onRefresh(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ScrollArea>
      <div className="flex flex-1 max-h-[600px] pr-5">
        <div className="space-y-4 w-full">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold">Remarks</h2>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-3"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <div>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Customer name..." />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <div>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City..." />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <div>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone number..." />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <div>
                        <FormLabel>Write something</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Write something..."
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                  <Button type="submit" className="mt-2 w-full">
                    {loading && <Loader2 className="animate-spin" />} Post
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {feedbacks.length > 0 && (
            <div className="space-y-3">
              {feedbacks.map((feedback, index) => (
               <Card key={index}>
               <CardHeader className="p-0 flex overflow-hidden">
                 <div
                   className="flex flex-1 justify-between items-center bg-gray-200 py-2 px-4"
                   style={{ borderTopRightRadius: 10, borderTopLeftRadius: 10 }}
                 >
                   <div className="flex gap-5">
                     <Label style={{ fontWeight: 600, fontSize: "16px" }}>
                       Visit Record
                     </Label>
                     <Label>Operated by: {feedback?.user_name}</Label>
                   </div>
                   <Label>
                     {moment(new Date(feedback.created_at)).format("YYYY-MM-DD hh:mm A")}
                   </Label>
                 </div>
               </CardHeader>
               <CardContent className="p-4">
                 <p className="text-sm text-gray-500">
                   {feedback.city} - {feedback.phone}
                 </p>
                 <p className="mt-2">{feedback.note}</p>
               </CardContent>
             </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
