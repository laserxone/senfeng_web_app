"use client";
import AppCalendar from "@/components/appCalendar";
import PageContainer from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import {
  Factory,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import VisitTab from "@/components/users/addVisit";
import { debounce } from "@/lib/debounce";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserContext } from "@/store/context/UserContext";
import { startHolyLoader } from "holy-loader";
import { CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useContext } from "react";

export default function MemberDetail({ ownership = false, from, customer_id }) {

  const [data, setData] = useState(null);
  const { state: UserState } = useContext(UserContext);
  const [feedback, setFeedback] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [visitData, setVisitData] = useState([]);

  useEffect(() => {
    if (customer_id && UserState?.value?.data?.id) {
      debouncedFetchCustomerData();
    }
  }, [UserState, customer_id]);

  const debouncedFetchCustomerData = debounce(() => {
    fetchCustomerDetail();
    fetchCustomerFeedback();
    fetchVisitData();
  }, 500);

  async function fetchVisitData(start, end) {
    axios.get(`/customer/${customer_id}/visit`).then((response) => {
      setVisitData(response.data);
    });
  }

  async function fetchCustomerDetail() {
    axios.get(`/customer/${customer_id}`).then((response) => {
      setData(response.data);
      if (response.data?.machines?.length === 0) {
        toast({
          variant: "destructive",
          title: "Ops",
          description: "No machine sold",
        });
      }
    });
  }

  async function fetchCustomerFeedback() {
    axios.get(`/customer/${customer_id}/feedback`).then((response) => {
      setFeedback(response.data);
    });
  }

  async function handleDelete(id) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      if (data.image) {
        DeleteFromStorage(data.image);
      }
      const response = await axios.delete(`/customer/${id}`);
      toast({ title: "Customer Deleted" });
      startHolyLoader();
      router.push(`/${UserState.value.data?.base_route}/${from}`);
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setData(null);
    }
  }

  const RenderVisitTab = useCallback(() => {
    return (
      <VisitTab
        customer_data={customer_id || null}
        disable={true}
        id={UserState.value.data?.id}
        data={visitData}
        onRefresh={async () => {
          await fetchVisitData();
        }}
        onFetchData={async (start, end, userId) => {
          fetchVisitData(start, end);
        }}
      />
    );
  }, [visitData, customer_id]);

  const RenderFeedbackTabs = useCallback(() => {
    return (
      <FeedbackTab
        type={data?.member ? "aftersales" : "feedback"}
        userID={UserState?.value?.data?.id}
        customerID={customer_id}
        data={feedback || []}
        onRefresh={() => fetchCustomerFeedback()}
      />
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
                  if (
                    UserState?.value?.data?.designation === "Sales" ||
                    UserState?.value?.data?.designation === "Engineer"
                  ) {
                    if (data?.ownership === UserState?.value?.data?.id) {
                      setEditVisible(true);
                    } else {
                      toast({
                        title: "You are not authorized to edit this member",
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {data?.name}
              </h1>

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

        <Tabs
          defaultValue={data?.member ? "aftersales" : "feedback"}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="feedback">
              {data?.member ? "After Sales" : "Feedback"}
            </TabsTrigger>

            <TabsTrigger value="customers">Machines</TabsTrigger>

            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="feedback">
            <RenderFeedbackTabs />
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
          <TabsContent value="visit">
            <RenderVisitTab />
          </TabsContent>
        </Tabs>
        {data && (
          <EditCustomerDialog
            ownership={ownership}
            data={data}
            visible={editVisible}
            onClose={setEditVisible}
            onRefresh={() => fetchCustomerDetail()}
            onClickDelete={() => setShowConfirmation(true)}
          />
        )}

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
        <span className="font-semibold text-green-700">
          Lead generated by: {data?.lead_name || "NIL"}
        </span>
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
    <div className="w-full sm:w-auto p-4 mt-4 bg-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:text-white">
      <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">
        Billing Summary
      </h3>

      <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2">
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

      <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm mt-2 font-bold">
        <p>{formattedTotal}</p>
        <p className="text-green-600">{formattedReceived}</p>
        <p className="text-red-600">{formattedBalance}</p>
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
                href={`/${UserState.value.data?.base_route}/member/${customer_id}/${machine.id}`}
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
  const [satisfactory, setSatisfactory] = useState(false);
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
      .delete(`/feedback/${id}`)
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
      .post(`/feedback`, {
        feedback: writeFeedback,
        next_followup: date,
        top_follow: topFollow,
        type: type,
        customer_id: customerID,
        user_id: userID,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
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
          <div className="flex gap-5 items-center mt-2 flex-wrap">
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
          <Button
            className="w-full mt-4"
            disabled={!writeFeedback}
            onClick={() => {
              handleSavePost();
            }}
          >
            {loading && <Loader2 className="animate-spin" />} Post
          </Button>
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
  }).format((payment[0] || 0) - (payment[1] || 0));

  return (
    <div className="p-4 mt-4 bg-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:text-white">
      <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">
        Billing Summary
      </h3>

      <div className="flex flex-col  sm:flex-row gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 justify-between flex-wrap">
        <div className="flex flex-col">
          <p>
            <strong>Bill:</strong>
          </p>
          <p className="font-bold">{formattedTotal}</p>
        </div>
        <div className="flex flex-col">
          <p>
            <strong>Received:</strong>
          </p>
          <p className="text-green-600 font-bold">{formattedReceived}</p>
        </div>
        <div className="flex flex-col">
          <p>
            <strong>Balance:</strong>
          </p>
          <p className="text-red-600 font-bold">{formattedBalance}</p>
        </div>
      </div>
    </div>
  );
};
