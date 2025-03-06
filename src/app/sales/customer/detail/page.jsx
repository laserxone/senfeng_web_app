"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaWhatsapp } from "react-icons/fa";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Pencil,
  Loader2,
  Factory,
  Edit2,
  Wrench,
} from "lucide-react";
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
import { CitiesSearch } from "@/components/cities-search";
import { IndustrySearch } from "@/components/industry-search";
import EditCustomerDialog from "@/components/editCustomer";
import AddMachine from "@/components/addMachine";

export default function Page() {
  const search = useSearchParams();
  const [data, setData] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const customer_id = search.get("id");
  const { state: UserState } = useContext(UserContext);
  const [feedback, setFeedback] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (customer_id && UserState?.value?.data?.id) {
      fetchCustomerDetail();
      fetchCustomerFeedback();

      axios.get("/api/user").then((response) => {
        setAllUsers(response.data);
      });
    }
  }, [customer_id, UserState]);

  async function fetchCustomerDetail() {
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
  }

  async function fetchCustomerFeedback() {
    axios
      .get(`/api/customer/${customer_id}/feedback`)
      .then((response) => {
        setFeedback(response.data);
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
  }

  return (
    <PageContainer>
      <div className="w-full pb-8">
        <div className="flex flex-1 items-center mb-8 justify-between flex-wrap">
          <div className="flex gap-2 items-center">
            <ProfilePicture
              img={data?.image}
              name={data?.name}
              onClick={() => {
                if (data) setEditVisible(true);
              }}
            />
            <div className="flex flex-row gap-5">
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
            {data && data?.machines && data.machines.length > 0 ? (
              <TabsTrigger value="aftersales">After Sales</TabsTrigger>
            ) : (
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            )}

            <TabsTrigger value="customers">Machines</TabsTrigger>
            {/* <TabsTrigger value="documents">Documents</TabsTrigger> */}
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <FeedbackTab
              type="feedback"
              userID={UserState?.value?.data?.id}
              customerID={customer_id}
              data={feedback || []}
              onRefresh={() => fetchCustomerFeedback()}
            />
          </TabsContent>

          <TabsContent value="aftersales">
            <FeedbackTab
              type="afterSales"
              userID={UserState?.value?.data?.id}
              customerID={customer_id}
              data={feedback || []}
              onRefresh={() => fetchCustomerFeedback()}
            />
          </TabsContent>

          <TabsContent value="about">
            <AboutTab data={data} allUsers={allUsers} />
          </TabsContent>
          <TabsContent value="customers">
            <CustomersTab
              data={data?.machines || []}
              user_id={UserState?.value?.data?.id}
              customer_id={customer_id}
              onRefresh={() => fetchCustomerDetail()}
            />
          </TabsContent>
          {/* <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent> */}
        </Tabs>

        <EditCustomerDialog
          data={data}
          visible={editVisible}
          onClose={setEditVisible}
          onRefresh={() => fetchCustomerDetail()}
          customer_id={customer_id}
        />
      </div>
    </PageContainer>
  );
}

const ProfilePicture = ({ img, name, onClick }) => {
  const [localImage, setLocalImage] = useState(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }
    }

    if (img) {
      fetchImage();
    }
  }, [img]);

  return (
    <div
      className="relative w-24 h-24"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Avatar className="w-24 h-24">
        <AvatarImage src={localImage} alt="Profile Picture" />
        <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
      </Avatar>

      {/* Overlay and Wrench Icon */}
      <div
        onClick={onClick}
        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 rounded-full cursor-pointer ${
          hover ? "opacity-100" : "opacity-0"
        }`}
      >
        <Wrench className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

const ClientCard = ({ data }) => {
  const joinedNumber = data?.number ? data.number.join(", ") : "";
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
          <Mail className="h-5 w-5 text-gray-500" />
          <span>{data?.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-gray-500" />
          <span>{joinedNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaWhatsapp className="h-5 w-5 text-gray-500" />
          <span>{data?.customer_group}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <span>{data?.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-gray-500" />
          <span>{data?.industry || "Nill"}</span>
        </div>
        {/* <div className="flex items-center gap-2">
          <Label className="font-medium text-[16px]">Ownership: </Label>
          <span>{data?.ownership_name}</span>
         
        </div> */}
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

function AboutTab({ data }) {
  return <ClientCard data={data} />;
}

function CustomersTab({ data, customer_id, user_id, onRefresh }) {
  const [visible, setVisible] = useState(false);

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
                    ? new Date(machine.contract_date).toLocaleDateString(
                        "en-GB"
                      )
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
        <Button onClick={() => setVisible(true)}>Add Machine</Button>
        <AddMachine
          visible={visible}
          onClose={setVisible}
          onRefresh={onRefresh}
          customer_id={customer_id}
          user_id={user_id}
        />
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {data.map((machine) => (
          <RenderEachMachine key={machine.id} machine={machine} />
        ))}
      </Accordion>
    </>
  );
}

function FeedbackTab({ userID, customerID, data, onRefresh, type }) {
  const [writeFeedback, setWriteFeedback] = useState("");
  const [date, setDate] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSavePost() {
    setLoading(true);
    axios
      .post(`/api/user/${userID}/customer/${customerID}/feedback`, {
        feedback: writeFeedback,
        next_followup: date,
        top_follow: topFollow,
        type: type,
      })
      .then(() => {
        console.log("done");
        onRefresh();
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
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
              {loading && <Loader2 className="animate-spin" />} Post
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
      {data
        ?.filter((item) => item.type === type)
        .sort(
          (a, b) =>
            moment(b.created_at).valueOf() - moment(a.created_at).valueOf()
        )
        .map((item, index) => (
          <Card key={index}>
            <CardHeader className="p-0 flex overflow-hidden">
              <div
                className="flex flex-1 justify-between items-center bg-gray-200 py-2 px-4"
                style={{ borderTopRightRadius: 10, borderTopLeftRadius: 10 }}
              >
                <div className="flex gap-5">
                  <Label style={{ fontWeight: 600, fontSize: "16px" }}>
                    Quick Record
                  </Label>
                  <Label>Operated by: {item?.user_name}</Label>
                </div>
                <Label>
                  {moment(new Date(item.created_at)).format(
                    "YYYY-MM-DD hh:mm A"
                  )}
                </Label>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p>{item.feedback}</p>
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
