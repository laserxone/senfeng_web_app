"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, Phone, MapPin, MessageCircle, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/page-container";
import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { UserSearch } from "@/components/user-search";
import AppCalendar from "@/components/appCalendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";
import moment from "moment";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const search = useSearchParams();
  const [data, setData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const customer_id = search.get("id");
  const { state: UserState } = useContext(UserContext);

  const { toast } = useToast();

  useEffect(() => {
    if (customer_id && UserState?.value?.data?.id) {
      axios
        .get(`/api/customer/${customer_id}`)
        .then((response) => {
          setData(response.data);
          if (response.data?.machines?.length === 0) {
            toast({
              variant: "destructive",
              title: "Ops",
              description: "No machine sold",
            });
          }
        })
        .catch((e) => {
          toast({
            variant: "destructive",
            title: "Something went wrong.",
            description:
              e?.reponse?.data?.message ||
              "There was a problem with your request.",
          });
        });

      axios.get("/api/user").then((response) => {
        setAllUsers(response.data);
      });
    }
  }, [customer_id, UserState]);

  return (
    <PageContainer>
      <div className="container w-full pb-8">
        <div className="flex flex-1 items-center mb-8 justify-between flex-wrap">
          <div className="flex gap-2 items-center">
            <Avatar className="w-24 h-24 mr-4">
              <AvatarImage
                src="/placeholder.svg?height=96&width=96"
                alt="Profile Picture"
              />
              <AvatarFallback>{data?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-3xl font-bold">{data?.name}</h1>
            </div>
          </div>
          <BillingInformation
            total={data?.bill_total}
            received={data?.bill_received}
            balance={data?.bill_total - data?.bill_received}
          />
        </div>

        <Tabs defaultValue="feedback" className="w-full">
          <TabsList>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="customers">Machines</TabsTrigger>
            {/* <TabsTrigger value="documents">Documents</TabsTrigger> */}
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="aftersales">After Sales</TabsTrigger>
            <TabsTrigger value="target">Targets Achieved</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <FeedbackTab
              userID={UserState?.value?.data?.id}
              customerID={customer_id}
            />
          </TabsContent>
          <TabsContent value="visit">
            <VisitTab />
          </TabsContent>
          <TabsContent value="about">
            <AboutTab data={data} allUsers={allUsers} />
          </TabsContent>
          <TabsContent value="customers">
            <CustomersTab data={data?.machines || []} />
          </TabsContent>
          {/* <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent> */}
          <TabsContent value="aftersales">{/* <DocumentsTab /> */}</TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

const ClientCard = ({ data, users }) => {
  const joinedNumber = data?.number ? data.number.join(", ") : "";
  const [edit, setEdit] = useState(false);
  const [newUser, setNewUser] = useState(null);
  return (
    <Card className="shadow-lg rounded-2xl p-4 self-center">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {data?.name}{" "}
          <span className="text-gray-500 text-sm">({data?.owner})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <FaWhatsapp className="h-5 w-5 text-gray-500" />
          <span>{data?.group}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <span>{data?.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-500" />
          <span>{data?.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-gray-500" />
          <span>{joinedNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <Label className="font-medium text-[16px]">Ownership: </Label>
          {edit ? (
            <>
              <Select
                onValueChange={(val) => setNewUser(Number(val))}
                value={newUser || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">Save</Button>
            </>
          ) : (
            <span>{data?.ownership && data?.ownership_name}</span>
          )}
          <Button
            onClick={() => {
              if (edit) {
                setNewUser(null);
              }
              setEdit(!edit);
            }}
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Pencil />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BillingInformation = ({ total, received, balance }) => {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(total || 0);
  const formattedReceived = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(received || 0);
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(balance || 0);
  return (
    <div className="p-4 mt-4 bg-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:text-white">
      <h3 className="text-lg font-semibold text-black dark:text-white">
        Billing Summary
      </h3>
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2">
        <p>
          <strong>Bill:</strong>
        </p>
        <p>
          <strong>Received:</strong>
        </p>
        <p>
          <strong>Balance:</strong>
        </p>
      </div>
      <div
        className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2"
        style={{ fontWeight: 700 }}
      >
        <p>{formattedTotal}</p>
        <p style={{ color: "green", fontWeight: 700 }}>{formattedReceived}</p>
        <p style={{ color: "red", fontWeight: 700 }}>{formattedBalance}</p>
      </div>
    </div>
  );
};

const AddMachine = ({ users }) => {
  const [isSpeedMoney, setIsSpeedMoney] = useState(false);

  const formSchema = z.object({
    machineModel: z.string().min(1, { message: "Machine model is required." }),
    power: z.string().min(1, { message: "Power is required." }),
    source: z.string().min(1, { message: "Source is required." }),
    orderNo: z.string().min(1, { message: "Order number is required." }),
    sellBy: z.number().min(1, { message: "Sell by is required." }),
    contractDate: z.date({ required_error: "Contract date is required." }),
    isSpeedMoney: z.boolean().default(false), // Added boolean field
    speedMoney: z.string().optional(),
    speedMoneyNote: z.string().optional(),
    totalPrice: z.number().min(1, { message: "Total price is required." }),
    usdRate: z.number().min(1, { message: "USD TT rate is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineModel: "",
      power: "",
      source: "",
      orderNo: "",
      sellBy: "",
      contractDate: undefined,
      isSpeedMoney: false, // Default value set to false
      speedMoney: "",
      speedMoneyNote: "",
      totalPrice: "",
      usdRate: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => form.reset()}>Add Machine</Button>
      </DialogTrigger>
      <DialogContent className="p-4">
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-1">
          <ScrollArea className="px-2 w-full max-h-[90vh]">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
                >
                  <FormField
                    control={form.control}
                    name="machineModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Machine Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter machine model" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="power"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter power" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => field.onChange(val)}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              {["RAYCUS", "MAX", "IPG"].map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order No</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter order number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sell By</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Date</FormLabel>
                        <FormControl>
                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter total price"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-1">
                    <FormField
                      control={form.control}
                      name="usdRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>USD TT rate</FormLabel>
                          <FormControl>
                            <Input
                              className="flex flex-1"
                              type="number"
                              placeholder="Enter USD TT rate"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      {Number(form.getValues("totalPrice")) *
                        Number(form.getValues("usdRate"))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="isSpeedMoney"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pr-2">
                          Include Speed Money
                        </FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={isSpeedMoney}
                            onCheckedChange={(checked) => {
                              setIsSpeedMoney(checked);
                              if (!checked) {
                                form.setValue("speedMoney", "");
                                form.setValue("speedMoneyNote", "");
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isSpeedMoney && (
                    <>
                      <FormField
                        control={form.control}
                        name="speedMoney"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speed Money</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter speed money"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speedMoneyNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speed Money Note</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter note" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button className="w-full" type="submit">
                    Submit
                  </Button>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function AboutTab({ data, allUsers }) {
  return <ClientCard data={data} users={allUsers} />;
}

function VisitTab() {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      comment: "Excellent service and product quality!",
      date: moment("2024-02-19T14:30:00").format(),
    },
    {
      id: 2,
      comment: "Good overall, but delivery was slightly delayed.",
      date: moment("2024-02-18T10:15:00").format(),
    },
    {
      id: 3,
      comment: "John went above and beyond to meet our needs.",
      date: moment("2024-02-17T08:45:00").format(),
    },
  ]);

  const [writeFeedback, setWriteFeedback] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Remarks</h2>
          <textarea
            value={writeFeedback}
            onChange={(e) => setWriteFeedback(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Write something..."
          ></textarea>
          <Button
            onClick={() => {
              let temp = [...feedbacks];
              temp.push({ comment: writeFeedback, date: moment() });
              setFeedbacks([...temp]);
              setWriteFeedback("");
            }}
            className="mt-2"
          >
            Post
          </Button>
        </CardContent>
      </Card>
      {feedbacks
        .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
        .map((feedback, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p>{feedback.comment}</p>
              <p>{moment(new Date(feedback.date)).format("YYYY-MM-DD")}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

function CustomersTab({ data }) {
  const RenderEachMachine = ({ machine }) => {
    const totalPayments = machine?.payments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const total = machine.price || 0;
    return (
      <AccordionItem key={machine.id} value={`customer-${machine.id}`}>
        <Card>
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <Link href={`machine?id=${machine.id}`}>
                <h3 className="font-semibold text-lg hover:underline">
                  {machine.serial_no}
                </h3>
              </Link>
              <div className="flex items-center">
                {Number(machine.price) === totalPayments ? (
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                ) : (
                  <Clock className="text-yellow-500 w-5 h-5 mr-2" />
                )}
                <Badge
                  variant={
                    Number(machine.price) === totalPayments
                      ? "success"
                      : "warning"
                  }
                >
                  {Number(machine.price) === totalPayments
                    ? "Completed"
                    : "Pending"}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="pt-0">
              <h4 className="text-lg font-semibold">{machine.name}</h4>
              <div className=" gap-2 text-sm ">
                <p>
                  <strong>Contract Date:</strong>{" "}
                  {machine?.created_at
                    ? new Date(machine.created_at).toLocaleDateString("en-GB")
                    : ""}
                </p>
                <p>
                  <strong>Order No:</strong> {machine?.order_no}
                </p>
                <p>
                  <strong>Model No:</strong>{" "}
                  {machine?.model_no || machine.serial_no}
                </p>
              </div>
              <BillingInformationMachine payment={[total, totalPayments]} />
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    );
  };

  return (
    <>
      <div className="p-4 flex flex-1 justify-end">
        <AddMachine />
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {data.map((machine) => (
          <RenderEachMachine key={machine.id} machine={machine} />
        ))}
      </Accordion>
    </>
  );
}

function DocumentsTab() {
  const documents = [
    { id: 1, name: "Q2 Sales Report", type: "PDF" },
    { id: 2, name: "Machine Specifications - XYZ-5000", type: "DOCX" },
    { id: 3, name: "Client Presentation Template", type: "PPTX" },
    { id: 4, name: "Sales Training Manual", type: "PDF" },
    { id: 5, name: "Price List 2023", type: "XLSX" },
  ];

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{doc.name}</h3>
              <p className="text-sm text-muted-foreground">{doc.type}</p>
            </div>
            <Button variant="outline">Download</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FeedbackTab({ userID, customerID }) {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      comment: "Excellent service and product quality!",
      date: moment("2024-02-19T14:30:00").format(),
    },
    {
      id: 2,
      comment: "Good overall, but delivery was slightly delayed.",
      date: moment("2024-02-18T10:15:00").format(),
    },
    {
      id: 3,
      comment: "John went above and beyond to meet our needs.",
      date: moment("2024-02-17T08:45:00").format(),
    },
  ]);

  const [writeFeedback, setWriteFeedback] = useState("");
  const [date, setDate] = useState(null);

  async function handleSavePost() {
    axios
      .post(`/api/user/${userID}/customer/${customerID}/feedback`, {
        feedback: writeFeedback,
        next_followup: date,
        top_follow : topFollow
      })
      .then(() => {
        console.log("done");
      });
  }

  const [topFollow, setTopFollow] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Feedback</h2>
          <textarea
            value={writeFeedback}
            onChange={(e) => setWriteFeedback(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Write something..."
          ></textarea>
          <div className="flex gap-5 items-center mt-2">
            <Button
              onClick={() => {
                handleSavePost();
              }}
          
            >
              Post
            </Button>
            <h1>Next Follow Up</h1>
            <div className="w-[250px]">
              <AppCalendar date={date} onChange={setDate} />
            </div>
           
            <h1>Top Follow Up?</h1>
            <Checkbox
              checked={topFollow}
              onCheckedChange={(checked) => {
                setTopFollow(checked);
              }}
            />
          </div>
        </CardContent>
      </Card>
      {feedbacks
        .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
        .map((feedback, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p>{feedback.comment}</p>
              <p>{moment(new Date(feedback.date)).format("YYYY-MM-DD")}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

const BillingInformationMachine = ({ payment }) => {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[0] || 0);
  const formattedReceived = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[1] || 0);
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[0] - payment[1] || 0);

  return (
    <div className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg mt-4 border border-purple-400">
      {/* Header */}
      <h3 className="text-2xl font-extrabold flex items-center gap-2">
        💰 Billing Summary
      </h3>
      <Separator className="my-3 border-white/20" />

      {/* Summary Section */}
      <div className="flex flex-col gap-5 text-lg mt-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Bill 🧾:</span>
          <span className="font-bold text-yellow-300">{formattedTotal}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">Amount Received ✅:</span>
          <span className="font-bold text-green-300">{formattedReceived}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold">Remaining Balance ⚠️:</span>
          <span className="font-bold text-red-300">{formattedBalance}</span>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-5 text-center">
        {Number(payment[0]) - Number(payment[1]) > 0 ? (
          <button className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg shadow-md hover:scale-105 transition-all">
            Pay Now 🔥
          </button>
        ) : (
          <>
            <p className="text-lg font-bold text-green-200">
              🎉 All Paid! No Dues.
            </p>
            <Button className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg shadow-md hover:scale-105 transition-all hover:text-white mt-4">
              Apply for commission
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
