"use client";
import AppCalendar from "@/components/appCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import axios from "@/lib/axios";
import {
  Calendar,
  CircleDollarSign,
  Cpu,
  Factory,
  Mail,
  MapPin,
  MessageSquareText,
  Package,
  Phone,
  Plus,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import AddMachine from "@/components/addMachine";
import ConfimationDialog from "@/components/alert-dialog";
import EditCustomerDialog from "@/components/editCustomer";
import { RequiredStar } from "@/components/RequiredStar";
import {
  Timeline,
  TimelineDescription,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/timeline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import VisitTab from "@/components/users/addVisit";
import CustomerTask from "@/components/users/customerTask";
import useUserDetail from "@/hooks/use-user-detail";
import { debounce } from "@/lib/debounce";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { GetProfileImage } from "@/lib/getProfileImage";

import AddParts from "@/components/add-parts";
import CurrencyFormatter from "@/components/currency-formatter";
import { useIsMobile } from "@/hooks/use-mobile";
import { CustomerFeedbackProps, CustomerTaskProps, CustomerVisitProps, MachineProps, MyCustomer, PartsProps } from "@/lib/types";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import { CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toast } from "sonner";
import InvoiceDetails from "./invoice-details";


type MemberDetailProps = {
  ownership?: boolean;
  from?: any;
  customer_id?: any;
  onReturn?: (a: number, b?: string) => void;
  onLoading?: (val: boolean) => void;
  route?: any;
  height?: string;
};

type LocalCustomerDetailProps = Omit<MyCustomer, "machines"> & {
  bill_received: number;
  bill_total: number;
  profile_completion: number;
  lead_name?: string
  parts: PartsProps[];
  machines: MachineProps[]
}

export default function MemberDetail({
  ownership = false,
  from,
  customer_id,
  onReturn,
  onLoading,
  route,
  height,
}: MemberDetailProps) {
  const [data, setData] = useState<LocalCustomerDetailProps | null>(null);
  const { userID, designation, base_route } = useUserDetail();
  const [feedback, setFeedback] = useState<CustomerFeedbackProps[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();
  const [visitData, setVisitData] = useState<CustomerVisitProps[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [taskData, setTaskData] = useState<CustomerTaskProps[]>([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (customer_id && userID) {
      debouncedFetchCustomerData();
    }
  }, [userID, customer_id]);

  const debouncedFetchCustomerData = debounce(() => {
    fetchCustomerTask();
    fetchCustomerVisit();
    fetchCustomerFeedback();
    fetchCustomerDashboard();
  }, 500);

  async function fetchCustomerTask() {
    axios.get(`/${userID}/customer/${customer_id}/task`).then((response) => {
      setTaskData(response.data);
    });
  }
  async function fetchCustomerVisit() {
    axios.get(`/${userID}/customer/${customer_id}/visit`).then((response) => {
      setVisitData(response.data);
    });
  }
  async function fetchCustomerFeedback() {
    axios
      .get(`/${userID}/customer/${customer_id}/feedback`)
      .then((response) => {
        setFeedback(response.data);
      });
  }

  async function fetchCustomerDashboard() {
    if (onLoading) {
      onLoading(true);
    }

    try {
      const response = await axios.get(`/${userID}/customer/${customer_id}/dashboard`)
      const data = response.data.customer;
      setData(data);

      const customerCompletion = Number(data.profile_completion) || 0;
      const machines: MachineProps & { percentage_completion: number }[] = data.machines || [];

      const totalMachineCompletion = machines.reduce(
        (sum, item) => sum + Number(item.percentage_completion || 0),
        0,
      );

      const overallCompletion =
        (customerCompletion + totalMachineCompletion) / (machines.length + 1);
      setProfileCompletion(Number(overallCompletion.toFixed(0)));
    } finally {
      if (onLoading) onLoading(false);
    }

  }

  async function handleDelete(id: number | undefined) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      if (data?.image) {
        if (!data?.image?.includes("https")) DeleteFromStorage(data.image);
      }
      const response = await axios.delete(`/${userID}/customer/${id}`);
      toast.success("Customer Deleted");

      router.push(`/${base_route}/${from}`);
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setData(null);
    }
  }

  const RenderVisitTab = useCallback(() => {
    return (
    
        <div className="overflow-hidden w-full">
          <ScrollArea className={`${height} w-full pr-2`}>
            <VisitTab
              customer_data={customer_id || null}
              disable={true}
              id={userID}
              data={visitData}
              height={height}
              onRefresh={async () => {
                await fetchCustomerDashboard();
              }}
            />
          </ScrollArea>
        </div>
      
    );
  }, [visitData, customer_id, height]);

  const RenderTaskTab = useCallback(() => {

    return (
      <Card className="flex flex-1">
        <CardContent className="flex flex-1 pt-2">
          <CustomerTask
            id={userID}
            customer_id={customer_id}
            data={taskData}
            onFetchData={async () => await fetchCustomerDashboard()}
            height={height}
          />
        </CardContent>
      </Card>
    );
  }, [taskData, customer_id]);

  const RenderFeedbackTabs = useCallback(() => {
    return (
      <FeedbackTab
        type={data?.member ? "aftersales" : "feedback"}
        userID={userID}
        customerID={customer_id}
        data={feedback || []}
        onRefresh={fetchCustomerDashboard}
      />
    );
  }, [data, feedback]);



  return (
    <div className="flex w-full flex-col pb-2">
      <div className="flex items-center mb-2 justify-between gap-2 flex-wrap">
        <div className="flex gap-2 items-center">
          <ProfilePicture
            img={data?.image}
            name={data?.name}
            onClick={() => {
              if (data?.id) {
                if (designation === "Sales" || designation === "Engineer") {
                  if (data?.ownership === userID) {
                    setEditVisible(true);
                  } else {
                    toast.error("You are not authorized to edit this member");
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

        <div className="flex flex-row flex-wrap items-center gap-2">
          <Label className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
            Overall Profile Completion
          </Label>
          <div className="h-[70px] w-[70px] ">
            <CircularProgressbar
              value={profileCompletion}
              text={`${profileCompletion}%`}
              styles={buildStyles({
                pathColor: "#4ade80",
                textColor: "#1f2937",
                trailColor: "#e5e7eb",
                textSize: "28px",
              })}
            />
          </div>
        </div>

        <BillingInformation
          total={data?.bill_total}
          received={data?.bill_received}
          balance={(data?.bill_total || 0) - (data?.bill_received || 0)}
        />
      </div>

      <Tabs
        className="relative flex w-full flex-1 flex-col"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <ScrollArea
          className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-45px)]"}`}
        >
          <TabsList className=" flex justify-start relative gap-2 px-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            {designation !== "Dealer" && (
              <TabsTrigger value="feedback">
                {data?.member ? "After Sales" : "Feedback"}
              </TabsTrigger>
            )}

            <TabsTrigger value="machines">Machines</TabsTrigger>

            <TabsTrigger value="parts">POS</TabsTrigger>

            {designation !== "Dealer" && (
              <TabsTrigger value="visit">Visit</TabsTrigger>
            )}
            {designation !== "Dealer" && (
              <TabsTrigger value="task">Task</TabsTrigger>
            )}
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <Scrollbar orientation="horizontal" />
        </ScrollArea>

        <div className="flex flex-1 w-full mt-2">
          {activeTab === "timeline" && (
            <RenderTimeline
              height={height}
              feedbackData={designation !== "Dealer" ? feedback : []}
              visitData={designation !== "Dealer" ? visitData : []}
              taskData={designation !== "Dealer" ? taskData : []}
              customerDetail={data}
            />
          )}

          {activeTab === "feedback" && (
            <ScrollArea className={`${height} w-full pr-2`}>
              <RenderFeedbackTabs />
            </ScrollArea>
          )}

          {activeTab === "machines" && (
            <CustomersTab
              data={data?.machines || []}
              user_id={userID}
              customer_id={customer_id}
              onRefresh={() => fetchCustomerDashboard()}
              onReturn={onReturn}
              route={route}
            />
          )}

          {activeTab === "parts" && (
            <PartsTab data={data?.parts || []} height={height} />
          )}

          {activeTab === "visit" &&

            <RenderVisitTab />
          }
          {activeTab === "task" && <RenderTaskTab />}
          {activeTab === "about" && <AboutTab data={data} />}
        </div>
      </Tabs>
      {data && (
        <EditCustomerDialog
          ownership={ownership}
          data={toMyCustomer(data)}
          visible={editVisible}
          onClose={setEditVisible}
          onRefresh={async () => await fetchCustomerDashboard()}
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
  );
}

const ProfilePicture = ({ img, name, onClick }: { img?: string, name?: string, onClick: () => void }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
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
        <AvatarImage src={localImage || ""} alt="Profile Picture" />
        <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
      </Avatar>

      <div
        onClick={onClick}
        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 rounded-full cursor-pointer ${hover ? "opacity-100" : "opacity-0"
          }`}
      >
        <Wrench className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

const ClientCard = ({ data }: { data: LocalCustomerDetailProps | null }) => {
  if (!data) return
  const joinedNumber = data?.number?.join(", ") || "N/A";
  const createdAt = data?.created_at
    ? moment(data.created_at).format("YYYY-MM-DD hh:mm A")
    : "N/A";

  return (
    <Card className="shadow-xl rounded-2xl p-6 w-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold">
          {data?.name || "Unnamed Customer"}
          <span className="block text-sm font-normal text-muted-foreground">
            Owner: {data?.owner || "N/A"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        {data?.office && (
          <div>
            <Badge>{`${data.office.toUpperCase()} BRANCH`}</Badge>
          </div>
        )}
        <div className="text-sm text-green-700 dark:text-green-400 font-medium">
          Lead generated by: {data?.lead_name || "NIL"}
        </div>

        <div className="grid gap-2">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label={data?.email || "N/A"}
          />
          <InfoRow icon={<Phone className="h-4 w-4" />} label={joinedNumber} />
          <InfoRow
            icon={<FaWhatsapp className="h-4 w-4" />}
            label={data?.customer_group || "N/A"}
          />
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label={data?.location || "N/A"}
            link={data?.pin}
          />
          <InfoRow
            icon={<Factory className="h-4 w-4" />}
            label={data?.industry || "N/A"}
          />
          <InfoRow icon={<Calendar className="h-4 w-4" />} label={createdAt} />
        </div>
      </CardContent>
    </Card>
  );
};

const InfoRow = ({ icon, label, link }: { icon: ReactNode, label: string, link?: string }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="text-muted-foreground">{icon}</div>
    {link ? (
      <Link href={link} target="_blank" className="hover:underline">
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    )}
  </div>
);

const BillingInformation = ({ total, received, balance }: { total: number | undefined, received: number | undefined, balance: number }) => {
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
        <p>
          <CurrencyFormatter amount={total ?? 0} />
        </p>
        <p className="text-green-600">
          <CurrencyFormatter amount={received ?? 0} />
        </p>
        <p className="text-red-600">
          <CurrencyFormatter amount={balance} />
        </p>
      </div>
    </div>
  );
};

function AboutTab({ data }: { data: LocalCustomerDetailProps | null }) {
  return <ClientCard data={data} />;
}

function CustomersTab({
  data,
  customer_id,
  user_id,
  onRefresh,
  onReturn,
  route,
}: {
  data?: MachineProps[] | [],
  customer_id?: number
  user_id: number | string
  onRefresh: () => Promise<void>
  onReturn?: (a: number, b?: string) => void
  route: string
}) {
  const [visible, setVisible] = useState(false);
  const [visibleParts, setVisibleParts] = useState(false);
  const { base_route } = useUserDetail();
  const machineCount = data?.filter((item) => item.type === "Machine").length || 0;
  const partsCount = data?.filter((item) => item.type !== "Machine").length || 0;
  const totalValue = data?.reduce((sum, item) => sum + Number(item.price || 0), 0) || 0;

  const RenderEachMachine = ({ machine, index }: {
    machine: MachineProps & {
      percentage_completion?: number
    }, index: number
  }) => {
    const totalPayments = machine?.payments
      .filter((item) => item.clearance_date)
      ?.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const total = Number(machine.price || 0);
    const paymentComplete = Number(machine.price) === totalPayments;
    const fullyReady = paymentComplete && machine?.percentage_completion === 100;
    return (
      <AccordionItem key={machine.id} value={`customer-${machine.id}`} className="border-none">
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10">
          <AccordionTrigger className=" p-0 px-3 hover:no-underline">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
              <Link
                className="flex items-center gap-2"
                href={
                  !route
                    ? "#"
                    : `/${base_route}/member/${customer_id}/${machine.id}`
                }
                onClick={() => onReturn?.(machine.id)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Cpu className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold hover:underline">
                      {machine.serial_no}
                    </span>
                    {machine.cancelled_detail && (
                      <Badge variant="destructive" className="h-5 rounded-full px-2 text-[10px]">
                        Cancelled
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Machine #{index} {machine.name ? `- ${machine.name}` : ""}
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <Badge variant="outline" className="h-6 rounded-full bg-background px-2 text-[10px]">
                  {machine?.percentage_completion || 0}% data
                </Badge>
                {fullyReady ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                <Badge
                  variant={
                    paymentComplete
                      ? "default"
                      : "destructive"
                  }
                  className="h-6 rounded-full px-2 text-[10px]"
                >
                  {paymentComplete ? "Paid" : "Balance"}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent >
            <CardContent className="space-y-2 border-t bg-slate-50/60 px-3 py-3 dark:bg-zinc-900/50">
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {machine?.status && (
                  <CompactDetail label="Status" value={<Badge className="h-5 rounded-full px-2 text-[10px]">{machine?.status}</Badge>} />
                )}
                <CompactDetail
                  label="Contract"
                  value={
                    machine?.contract_date
                      ? new Date(machine.contract_date).toLocaleDateString(
                      "en-GB",
                    )
                      : "N/A"
                  }
                />
                {machine?.order_no_arr &&
                  machine?.order_no_arr.map((item, index) => (
                    <CompactDetail key={index} label="Order No" value={item} />
                  ))}

                <CompactDetail label="Model No" value={machine?.model_no || machine.serial_no} />
              </div>
              <BillingInformationMachine payment={[total, totalPayments]} />
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    );
  };

  const RenderEachPart = ({ machine, index }: {
    machine: MachineProps & {
      percentage_completion?: number
    }, index: number
  }) => {
    const totalPayments = machine?.payments
      .filter((item) => item.clearance_date)
      ?.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const total = Number(machine.price || 0);
    const paymentComplete = Number(machine.price) === totalPayments;
    const fullyReady = paymentComplete && machine?.percentage_completion === 100;
    return (
      <AccordionItem key={machine.id} value={`customer-${machine.id}`} className="border-none">
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md dark:bg-zinc-950 dark:ring-white/10">
           <AccordionTrigger className=" p-0 px-3 hover:no-underline">
            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
              <Link
                className="flex items-center gap-2"
                href={
                  !route
                    ? "#"
                    : `/${base_route}/member/${customer_id}/${machine.id}`
                }
                onClick={() => onReturn?.(machine.id, "Parts")}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Package className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="truncate text-sm font-semibold hover:underline">
                    {machine.serial_no}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Part #{index} {machine.name ? `- ${machine.name}` : ""}
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <Badge variant="outline" className="h-6 rounded-full bg-background px-2 text-[10px]">
                  {machine?.percentage_completion || 0}% data
                </Badge>
                {fullyReady ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                <Badge
                  variant={
                    paymentComplete
                      ? "default"
                      : "destructive"
                  }
                  className="h-6 rounded-full px-2 text-[10px]"
                >
                  {paymentComplete ? "Paid" : "Balance"}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-2 border-t bg-slate-50/60 px-3 py-3 dark:bg-zinc-900/50">
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {machine?.status && (
                  <CompactDetail label="Status" value={<Badge className="h-5 rounded-full px-2 text-[10px]">{machine?.status}</Badge>} />
                )}
                <CompactDetail
                  label="Contract"
                  value={
                    machine?.contract_date
                      ? new Date(machine.contract_date).toLocaleDateString(
                      "en-GB",
                    )
                      : "N/A"
                  }
                />
                {machine?.order_no_arr &&
                  machine?.order_no_arr.map((item, index) => (
                    <CompactDetail key={index} label="Order No" value={item} />
                  ))}

                <CompactDetail label="Model No" value={machine?.model_no || machine.serial_no} />
              </div>
              <BillingInformationMachine payment={[total, totalPayments]} />
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    );
  };

  return (
    <Card className="flex flex-1 overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-zinc-950 dark:ring-white/10 p-0">
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 px-3 py-2.5 dark:bg-zinc-900/70">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Machines & Parts</h3>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                <Cpu className="h-3.5 w-3.5" />
                {machineCount} machines
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                <Package className="h-3.5 w-3.5" />
                {partsCount} Parts
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                <CircleDollarSign className="h-3.5 w-3.5" />
                <CurrencyFormatter amount={totalValue} />
              </span>
            </div>
          </div>
          {user_id && customer_id && (
            <div className="flex flex-wrap gap-2">
              <Button className="h-8 rounded-lg px-3" variant="outline" onClick={() => setVisibleParts(true)}>
                <Package className="h-3.5 w-3.5" />
                Sell Parts
              </Button>
              <Button className="h-8 rounded-lg px-3" onClick={() => setVisible(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Machine
              </Button>
            </div>
          )}
        </div>
        <div className="p-3">
          <AddParts
            visible={visibleParts}
            onClose={setVisibleParts}
            onRefresh={onRefresh}
            customer_id={customer_id}
            user_id={user_id}
          />
          <AddMachine
            visible={visible}
            onClose={setVisible}
            onRefresh={onRefresh}
            customer_id={customer_id}
            user_id={user_id}
          />
          {data?.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed bg-slate-50 text-sm text-muted-foreground dark:bg-zinc-900/50">
              No machines or POS records found
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {data?.map((machine, index) =>
                machine.type === "Machine" ? (
                  <RenderEachMachine
                    key={machine.id}
                    machine={machine}
                    index={index + 1}
                  />
                ) : (
                  <RenderEachPart
                    key={machine.id}
                    machine={machine}
                    index={index + 1}
                  />
                ),
              )}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompactDetail({ label, value }: { label: string, value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function FeedbackTab({ userID, customerID, data, onRefresh, type }: { userID: number | string, customerID: number, data: CustomerFeedbackProps[], onRefresh: () => Promise<void>, type: string }) {
  const [writeFeedback, setWriteFeedback] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<number | null>(null);
  const [satisfactory, setSatisfactory] = useState(false);
  const [localData] = useState(
    data
      .filter((item) => item?.type === type)
      .sort(
        (a, b) =>
          moment(b?.created_at).valueOf() - moment(a?.created_at).valueOf(),
      ),
  );

  async function handleDelete(id: number) {
    setSelectedDelete(id);
    axios
      .delete(`/${userID}/feedback/${id}`)
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
      .post(`/${userID}/feedback`, {
        feedback: writeFeedback,
        next_followup: date,
        top_follow: topFollow,
        type: type,
        customer_id: customerID,
        user_id: userID,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
      })
      .then(async () => {
        await onRefresh();
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
    setDate(undefined);
    setTopFollow(false);
  }

  return (
    <div className="w-full space-y-2.5 p-1">
      <Card className="overflow-hidden border-0">
        <CardContent className="grid gap-2.5 p-3 xl:grid-cols-[1fr_260px]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {type === "aftersales" ? "After Sales Note" : "Feedback"}{" "}
                <RequiredStar />
              </Label>
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px]">
                {localData.length} records
              </Badge>
            </div>
            <Textarea
              value={writeFeedback}
              onChange={(e) => setWriteFeedback(e.target.value)}
              className="min-h-16 resize-none rounded-lg border-0 bg-muted/30 px-3 py-2 text-sm shadow-inner focus-visible:ring-2"
              rows={2}
              placeholder="Write something..."
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(190px,1fr)_auto] xl:grid-cols-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next Follow Up <RequiredStar />
              </Label>
              <AppCalendar date={date} onChange={setDate} min={new Date()} max={""} />
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-2">
              <label className="flex h-8 items-center justify-between gap-2 rounded-lg bg-muted/35 px-2.5">
                <span className="text-xs font-medium">Top</span>
                <Checkbox
                  checked={topFollow}
                  onCheckedChange={(checked) => {
                    setTopFollow(checked === true);
                  }}
                />
              </label>
              <label className="flex h-8 items-center justify-between gap-2 rounded-lg bg-muted/35 px-2.5">
                <span className="text-xs font-medium">Satisfactory</span>
                <Checkbox
                  checked={satisfactory}
                  onCheckedChange={(checked) => {
                    setSatisfactory(checked === true);
                  }}
                />
              </label>
              <Button
                className="h-8 rounded-lg px-5 xl:col-span-2"
                disabled={!writeFeedback || !date}
                onClick={() => {
                  handleSavePost();
                }}
              >
                {loading && <Spinner />} Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold">History</h3>
          <span className="text-xs text-muted-foreground">Latest first</span>
        </div>

        {localData.length === 0 ? (
          <Card className="border-0 bg-muted/20 shadow-sm ring-1 ring-black/5">
            <CardContent className="flex min-h-20 items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <MessageSquareText className="h-5 w-5" />
              No records yet
            </CardContent>
          </Card>
        ) : (
          localData.map((item, index) => (
            <Card
              key={index}
              className="group overflow-hidden border-0 transition-shadow hover:shadow-md"
            >
              <CardContent className="space-y-2 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className={
                        item.status === "Satisfactory"
                          ? "h-2 w-2 rounded-full bg-emerald-500"
                          : "h-2 w-2 rounded-full bg-rose-500"
                      }
                    />
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      {item?.user_name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {moment(new Date(item.created_at)).format(
                        "YYYY-MM-DD hh:mm A",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.top_follow && (
                      <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                        Top
                      </Badge>
                    )}
                    {item.status && (
                      <Badge
                        variant={
                          item.status === "Satisfactory"
                            ? "default"
                            : "destructive"
                        }
                        className="h-5 rounded-full px-2 text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-destructive hover:text-destructive"
                      disabled={selectedDelete === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {selectedDelete === item.id ? (
                        <Spinner />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-5">
                  {item.feedback}
                </p>

                {item.next_followup && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">Next</span>
                    <span>
                      {moment(new Date(item.next_followup)).format(
                        "YYYY-MM-DD",
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

const BillingInformationMachine = ({ payment }: { payment: [number, number] }) => {
  const formattedTotal = <CurrencyFormatter amount={payment[0]} />;
  const formattedReceived = <CurrencyFormatter amount={payment[1]} />;
  const formattedBalance = (
    <CurrencyFormatter amount={(payment[0] || 0) - (payment[1] || 0)} />
  );

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
  height,
}: {
  feedbackData: CustomerFeedbackProps[],
  visitData: CustomerVisitProps[],
  taskData: CustomerTaskProps[],
  customerDetail: LocalCustomerDetailProps | null,
  height?: string,
}) => {
  const [timelineData, setTimelineData] = useState<{ id: string, time: string, title: string, description: string }[]>([]);

  useEffect(() => {
    const localData: any[] = [];

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
        description: `Problem: ${visit?.problem || "Nil"}, Solution: ${visit?.solution || "Nil"
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
        if (machine.type === "Parts") {
          localData.push({
            id: `machine-${machine.id}`,
            title: `Sell Parts ${machine.serial_no}`,
            description: `Power: ${machine.power || "Nil"}, Price: ${machine.price
              }`,
            time: machine.contract_date
              ? machine.contract_date
              : machine.created_at,
          });

          machine.payments?.forEach((payment) => {
            localData.push({
              id: `payment-${payment.id}`,
              title: `Payment for Parts  ${machine.serial_no}`,
              description: `Tx: ${payment.note}, Amount: ${payment.amount
                }, Mode: ${payment.mode}, Received by: ${payment.received_by
                }, Clearance Date: ${payment.clearance_date
                  ? moment(payment.clearance_date).format("YYYY-MM-DD")
                  : "Pending"
                }`,
              time: payment.transaction_date,
            });
          });
        } else {
          localData.push({
            id: `machine-${machine.id}`,
            title: `Sell Machine ${machine.serial_no} (${machine.source || "Nil"
              })`,
            description: `Power: ${machine.power || "Nil"}W, Price: ${machine.price
              }, Order No: ${machine.order_no_arr?.join(", ")}`,
            time: machine.contract_date
              ? machine.contract_date
              : machine.created_at,
          });

          machine.payments?.forEach((payment) => {
            localData.push({
              id: `payment-${payment.id}`,
              title: `Payment for Machine ${machine.serial_no}`,
              description: `Tx: ${payment.note}, Amount: $${payment.amount
                }, Mode: ${payment.mode}, Received by: ${payment.received_by
                }, Clearance Date: ${payment.clearance_date
                  ? moment(payment.clearance_date).format("YYYY-MM-DD")
                  : "Pending"
                }`,
              time: payment.transaction_date,
            });
          });
        }
      });

      localData.push({
        id: `customer-${customerDetail.id}`,
        title: `Customer added`,
        description: `Company ${customerDetail.name || "Nil"}, Owner: ${customerDetail.owner || "Nil"
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
      const getPriority = (id: string) => {
        if (id.startsWith("payment-")) return 1;
        if (id.startsWith("machine-")) return 2;
        return 3;
      };

      return getPriority(a.id) - getPriority(b.id);
    });

    setTimelineData(localData);
  }, [feedbackData, visitData, taskData, customerDetail]);

  return (
    <Card className="flex flex-1 shadow-lg rounded-2xl p-4 self-center">
      <ScrollArea className={`flex flex-1 ${height}`}>
        <Timeline className="mt-4">
          {timelineData.map((item) => (
            <TimelineItem key={item.id}>
              <TimelineHeader>
                <TimelineTime>
                  {moment(item.time).format("YYYY-MM-DD")}
                </TimelineTime>
                <TimelineTitle
                  className={`${item.title.toLowerCase().includes("feedback")
                    ? "text-orange-500"
                    : item.title.toLowerCase().includes("customer")
                      ? "text-blue-500"
                      : item.title.toLowerCase().includes("payment")
                        ? "text-green-500"
                        : item.title.toLowerCase().includes("machine")
                          ? "text-purple-500"
                          : item.title.toLowerCase().includes("visit")
                            ? "text-red-500"
                            : item.title.toLowerCase().includes("task")
                              ? "text-yellow-500"
                              : "text-black"
                    }`}
                >
                  {item.title}
                </TimelineTitle>
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

const PartsTab = ({ data, height }: { data?: PartsProps[], height?: string }) => {

  return (
    <Card className="flex flex-1 border-0 p-0">
      {data?.length === 0 ? (
        <CardContent className="flex min-h-28 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          No parts invoices found
        </CardContent>
      ) : (
        <CardContent className="flex flex-1 p-3">
          <ScrollArea className={`flex flex-1 ${height}`}>
            <div className="w-full space-y-2 pr-2">
              {data?.map((item, index) => (
                <InvoiceDetails key={item.id || index} invoice={item} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};

function toMyCustomer(data: LocalCustomerDetailProps): MyCustomer {
  const { bill_received, bill_total, profile_completion, parts, ...rest } = data;
  return { ...rest, machines: [""] };
}
