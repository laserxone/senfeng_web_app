"use client";
import AppCalendar from "@/components/appCalendar";
import PageContainer from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Factory,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Wrench
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import AddMachine from "@/components/addMachine";
import ConfimationDialog from "@/components/alert-dialog";
import EditCustomerDialog from "@/components/editCustomer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BASE_URL } from "@/constants/data";
import { debounce } from "@/lib/debounce";
import { UserContext } from "@/store/context/UserContext";
import { startHolyLoader } from "holy-loader";
import { CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useContext } from "react";

export default function CustomerDetail({ ownership = false }) {
  const search = useSearchParams();
  const [data, setData] = useState({});
  const customer_id = search.get("id");
  const { state: UserState } = useContext(UserContext);
  const [feedback, setFeedback] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (customer_id && UserState?.value?.data?.id) {
      debouncedFetchCustomerData();
    }
  }, [customer_id, UserState]);

  const debouncedFetchCustomerData = debounce(() => {
    fetchCustomerDetail();
    fetchCustomerFeedback();
  }, 500);

  async function fetchCustomerDetail() {
    axios
      .get(`${BASE_URL}/customer/${customer_id}`)
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
      .get(`${BASE_URL}/customer/${customer_id}/feedback`)
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

  async function handleDelete(id) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${BASE_URL}/customer/${id}`);
      toast({ title: "Customer Deleted" });
      startHolyLoader();
      router.push(`/${UserState.value.data?.base_route}/customer`);
    } catch (error) {
      toast({
        title: error?.response?.data?.message || "Netwrok error",
        variant: "desctructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setData({});
    }
  }

  const RenderTabs = useCallback(() => {
    return (
      <Tabs
        defaultValue={data?.member ? "aftersales" : "feedback"}
        className="w-full"
      >
        <TabsList>
          {data &&
            (data?.member ? (
              <TabsTrigger value="aftersales">After Sales</TabsTrigger>
            ) : (
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            ))}

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
            type="aftersales"
            userID={UserState?.value?.data?.id}
            customerID={customer_id}
            data={feedback || []}
            onRefresh={() => fetchCustomerFeedback()}
          />
        </TabsContent>

        <TabsContent value="about">
          <AboutTab data={data} />
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
    );
  }, [data, feedback]);

  return (
    <PageContainer>
      <div className="w-full pb-8">
        <div className="flex flex-1 items-center mb-8 justify-between flex-wrap">
          <div className="flex gap-2 items-center">
            <ProfilePicture
              img={data?.image}
              name={data?.name}
              onClick={() => {
                if (data?.id) {
                  if (UserState?.value?.data?.designation === "Sales" || UserState?.value?.data?.designation === "Engineer") {
                    if (data?.ownership === UserState?.value?.data?.id) {
                      setEditVisible(true);
                    } else {
                      toast({
                        title: "You are not authorized to edit this customer",
                        variant: "destructive",
                      });
                    }
                  } else {
                    setEditVisible(true);
                  }
                }
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold">{data?.name}</h1>
              <h1 className="text-sm font-medium">
                Rating:{" "}
                {data?.rating ? `${data.rating} out of 5` : "Not rated yet"}
              </h1>
              <h1 className="text-md font-bold text-primary">
                Manager {data?.ownership_name || "NA"}
              </h1>
            </div>
          </div>
          <BillingInformation
            total={data?.bill_total}
            received={data?.bill_received}
            balance={data?.bill_total - data?.bill_received}
          />
        </div>

        <RenderTabs />

        <EditCustomerDialog
          ownership={ownership}
          data={data}
          visible={editVisible}
          onClose={setEditVisible}
          onRefresh={() => fetchCustomerDetail()}
          customer_id={customer_id}
          onClickDelete={() => setShowConfirmation(true)}
        />

        <ConfimationDialog
          loading={deleteLoading}
          open={showConfirmation}
          title={"Are you sure you want to delete?"}
          description={"Your action will remove customer from the system"}
          onPressYes={() => handleDelete(data?.id)}
          onPressCancel={() => setShowConfirmation(false)}
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
  const { state: UserState } = useContext(UserContext);

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
              <Link
                href={`/${UserState.value.data?.base_route}/customer/machine?id=${machine.id}&previous=${customer_id}`}
              >
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
    <Card>
      <CardContent className="p-4">
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
      </CardContent>
    </Card>
  );
}

function FeedbackTab({ userID, customerID, data, onRefresh, type }) {
  const [writeFeedback, setWriteFeedback] = useState("");
  const [date, setDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [satisfactory, setSatisfactory] = useState(false)
  const [localData, setLocalData] = useState(
    data
      .filter((item) => item?.type === type)
      .sort(
        (a, b) =>
          moment(b?.created_at).valueOf() - moment(a?.created_at).valueOf()
      )
  );

  async function handleDelete(id) {
    setSelectedDelete(id);
    axios
      .delete(`${BASE_URL}/feedback/${id}`)
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setSelectedDelete(null);
      });
  }

  async function handleSavePost() {
    setLoading(true);
    axios
      .post(`${BASE_URL}/feedback`, {
        feedback: writeFeedback,
        next_followup: date,
        top_follow: topFollow,
        type: type,
        customer_id: customerID,
        user_id: userID,
        status : satisfactory ? "Satisfactory" : "Unsatisfactory"
      })
      .then(() => {
        onRefresh();
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
        handleClearAll();
      });
  }

  const [topFollow, setTopFollow] = useState(false);

  function handleClearAll() {
    setWriteFeedback("");
    setDate(null);
    setTopFollow(false);
  }

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
              disabled={!writeFeedback}
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
             <h1>Satisfactory?</h1>
            <Checkbox
              checked={satisfactory}
              onCheckedChange={(checked) => {
                setSatisfactory(checked);
              }}
            />
          </div>
        </CardContent>
      </Card>
      {localData.map((item, index) => (
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
              <div className="flex gap-5">
                <Label>
                  {moment(new Date(item.created_at)).format(
                    "YYYY-MM-DD hh:mm A"
                  )}
                </Label>
                {selectedDelete === item.id ? (
                  <Spinner size={16} />
                ) : (
                  <Trash2
                    size={16}
                    color="red"
                    className="hover:opacity-70 cursor-pointer"
                    onClick={() => handleDelete(item.id)}
                  />
                )}
              </div>
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
