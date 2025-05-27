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
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import TaskEmployee from "@/components/users/task";
import CustomerTask from "@/components/users/customerTask";
import {
  Timeline,
  TimelineDescription,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/timeline";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [taskData, setTaskData] = useState([]);

  useEffect(() => {
    if (customer_id && UserState?.value?.data?.id) {
      debouncedFetchCustomerData();
    }
  }, [UserState, customer_id]);

  const debouncedFetchCustomerData = debounce(() => {
    fetchCustomerDetail();
    fetchCustomerFeedback();
    fetchVisitData();
    fetchTaskData();
  }, 500);

  async function fetchTaskData(start, end) {
    const response = await axios.get(`/customer/${customer_id}/task`);
    setTaskData(response.data);
    return true;
  }

  async function fetchVisitData(start, end) {
    axios.get(`/customer/${customer_id}/visit`).then((response) => {
      setVisitData(response.data);
    });
  }

  async function fetchCustomerDetail() {
    axios.get(`/customer/${customer_id}`).then((response) => {
      const data = response.data;
      setData(data);

      const isLimited = UserState.value.data?.limited_access;
      if(isLimited){
        if(response.data.lead !== UserState.value.data?.id){
          router.replace("/")
        }
      }

      const customerCompletion = Number(data.profile_completion) || 0;
      const machines = data.machines || [];

      if (machines.length === 0) {
        toast({
          variant: "destructive",
          title: "Oops",
          description: "No machine sold",
        });
      }

      const totalMachineCompletion = machines.reduce(
        (sum, item) => sum + Number(item.percentage_completion || 0),
        0
      );

      const overallCompletion =
        (customerCompletion + totalMachineCompletion) / (machines.length + 1);
      setProfileCompletion(overallCompletion.toFixed(0));
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

  const RenderTaskTab = useCallback(() => {
    return (
      <CustomerTask
        id={UserState.value.data?.id}
        customer_id={customer_id}
        data={taskData}
        onFetchData={async () => await fetchTaskData()}
      />
    );
  }, [taskData, customer_id]);

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

          <div className="flex flex-row items-center gap-2">
            <Label className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
              Overall Profile Completion
            </Label>
            <div className="h-[70px] w-[70px] ">
              <CircularProgressbar
                value={profileCompletion}
                text={`${profileCompletion}%`}
                styles={buildStyles({
                  pathColor: "#4ade80", // green
                  textColor: "#1f2937", // gray-800
                  trailColor: "#e5e7eb", // gray-200
                  textSize: "28px",
                })}
              />
            </div>
          </div>

          <BillingInformation
            total={data?.bill_total}
            received={data?.bill_received}
            balance={data?.bill_total - data?.bill_received}
          />
        </div>

        <Tabs defaultValue={"timeline"} className="w-full">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="feedback">
              {data?.member ? "After Sales" : "Feedback"}
            </TabsTrigger>

            <TabsTrigger value="customers">Machines</TabsTrigger>

            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="feedback">
            <RenderFeedbackTabs />
          </TabsContent>

          <TabsContent value="task">
            <RenderTaskTab />
          </TabsContent>

          <TabsContent value="timeline">
            <RenderTimeline
              feedbackData={feedback}
              visitData={visitData}
              taskData={taskData}
              customerDetail={data}
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
          <Link href={data?.pin || "#"} target={data?.pin ? "_blank" : "_self"}>
            <MapPin className="h-5 w-5 text-gray-500" />
          </Link>
          <span>{data?.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-gray-500" />
          <span>{data?.industry || "Nil"}</span>
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
    const totalPayments = machine?.payments
      .filter((item) => item.clearance_date)
      ?.reduce((sum, payment) => sum + Number(payment.amount), 0);
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
                <span className="font-normal text-sm text-gray-600 mr-2">
                  Data completion: {machine?.percentage_completion || 0}%
                </span>
                {Number(machine.price) === totalPayments &&
                machine?.percentage_completion === 100 ? (
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
                {machine?.order_no_arr &&
                  machine?.order_no_arr.map((item, index) => (
                    <p key={index}>
                      <strong>Order No:</strong> {item}
                    </p>
                  ))}

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
            {loading && <Spinner />} Post
          </Button>
        </CardContent>
      </Card>
      {localData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="p-0 flex overflow-hidden">
            <div
              className="flex flex-1 justify-between items-center bg-gray-200 dark:bg-gray-700 py-2 px-4"
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

const RenderTimeline = ({
  feedbackData,
  visitData,
  taskData,
  customerDetail,
}) => {
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    const localData = [];

    taskData.forEach((task) => {
      localData.push({
        id: `task-${task.id}`,
        title: `Task: ${task.task_name.split("-")[0]}`,
        description: `Task assigned to ${task.user_name}`,
        time: task.created_at,
      });
    });

    visitData.forEach((visit) => {
      localData.push({
        id: `visit-${visit.id}`,
        title: `Visit by ${visit.user_name}`,
        description: `Problem: ${visit?.problem || "Nil"}, Solution: ${
          visit?.solution || "Nil"
        } Note: ${visit.note}`,
        time: visit.created_at,
      });
    });

    feedbackData.forEach((feedback) => {
      localData.push({
        id: `feedback-${feedback.id}`,
        title: `Feedback taken by ${feedback.user_name}`,
        description: `${feedback.feedback}`,
        time: feedback.created_at,
      });
    });

    if (customerDetail) {
      customerDetail?.machines?.forEach((machine) => {
        localData.push({
          id: `machine-${machine.id}`,
          title: `Sell Machine: ${machine.serial_no} (${machine.source || "Nil"})`,
          description: `Power: ${machine.power || "Nil"}W, Price: $${
            machine.price
          }, Order No: ${machine.order_no_arr?.join(", ")}`,
          time: machine.contract_date
            ? machine.contract_date
            : machine.created_at,
        });

        machine.payments?.forEach((payment) => {
          localData.push({
            id: `payment-${payment.id}`,
            title: `Payment for Machine ${machine.serial_no}`,
            description: `Tx: ${
              payment.note
            }, Amount: $${payment.amount}, Mode: ${
              payment.mode
            }, Received by: ${payment.received_by}, Clearance Date: ${
              payment.clearance_data
                ? moment(payment.clearance_data).format("YYYY-MM-DD")
                : "Pending"
            }`,
            time: payment.transaction_date,
          });
        });
      });

      localData.push({
        id: `customer-${customerDetail.id}`,
        title: `Customer added`,
        description: `Company: ${customerDetail.name || "Nil"}, Owner: ${
          customerDetail.owner || "Nil"
        }, Location: ${customerDetail.location}`,
        time: customerDetail.created_at,
      });
    }

    localData.sort((a, b) => {
      const dateA = moment(a.time);
      const dateB = moment(b.time);

      if (dateA.isBefore(dateB)) return 1;
      if (dateA.isAfter(dateB)) return -1;

      // Same date: prioritize by type
      const getPriority = (id) => {
        if (id.startsWith("payment-")) return 1;
        if (id.startsWith("machine-")) return 2;
        return 3;
      };

      return getPriority(a.id) - getPriority(b.id);
    });

    setTimelineData(localData);
  }, [feedbackData, visitData, taskData, customerDetail]);

  return (
    <Card className="shadow-lg rounded-2xl p-4 self-center">
        <ScrollArea className="h-[calc(100dvh-340px)]">
          <Timeline className="mt-8">
            {timelineData.map((item) => (
              <TimelineItem key={item.id}>
                <TimelineHeader>
                  <TimelineTime>
                    {moment(item.time).format("YYYY-MM-DD")}
                  </TimelineTime>
                  <TimelineTitle>{item.title}</TimelineTitle>
                </TimelineHeader>
                {item.description && (
                  <TimelineDescription>{item.description}</TimelineDescription>
                )}
              </TimelineItem>
            ))}
          </Timeline>
        </ScrollArea>
      
    </Card>
  );
};
