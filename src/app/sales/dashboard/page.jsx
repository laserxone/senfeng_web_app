"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";
import ReimbursementEmployee from "@/components/employee/reimbursement";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomerEmployee from "@/components/employee/customer";
import Attendance from "@/components/users/attendance";
import Reimbursement from "@/components/users/Reimbursement";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import "./styles.css";
import { Label } from "@/components/ui/label";
import { GetProfileImage } from "@/lib/getProfileImage";
import moment from "moment";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [data, setData] = useState();
  const search = useSearchParams();
  const { state: UserState } = useContext(UserContext);
  const [totalSales, setTotalSales] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [allowedExtraData, setAllowedExtraData] = useState(true);

  useEffect(() => {
    if (UserState.value.data?.id) fetchData();
  }, [UserState]);

  async function fetchData() {
    axios.get(`/api/user/${UserState.value.data?.id}`).then((response) => {
      console.log(response.data);
      setData(response.data);
      if (response.data.customers && response.data.customers.length > 0) {
        let total = 0;
        response.data.customers.map((eachCustomer) => {
          if (eachCustomer.sales && eachCustomer.sales.length > 0) {
            eachCustomer.sales.map((eachSale) => {
              total = total + Number(eachSale.price);
            });
          }
        });
        setTotalSales(total);
      }
    });

    axios.get(`/api/customer`).then((response) => {
      setCustomers(response.data);
    });
  }

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center mb-8">
          <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
            <p className="text-muted-foreground">{data?.user?.designation}</p>
          </div>
        </div>

        <Tabs
          defaultValue="newCustomers"
          className="w-full flex flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">New Customers</TabsTrigger>
            {/* <TabsTrigger value="posts" onClick={()=> setAllowedExtraData(false)}>Posts</TabsTrigger> */}
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            {/* <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger> */}
            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="newCustomers">
            {UserState?.value?.data?.id && (
              <Card>
                <CardContent className="pt-5">
                  <div className="flex flex-1 gap-5">
                    <CustomerExtraData />
                    <CustomerEmployee
                      customer_data={data?.customers || []}
                      onRefresh={() => fetchData()}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* <TabsContent value="posts">
            <PostsTab />
          </TabsContent> */}
          <TabsContent value="members">
            <Card>
              <CardContent className="p-0">
                <CustomersTab
                  data={
                    data?.customers.filter((customer) => customer.member) || []
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reimbursement">
            {UserState?.value?.data?.id && (
              <Card>
                <CardContent className="pt-5">
                  <Reimbursement id={UserState?.value?.data?.id} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="attendance">
            {UserState?.value?.data?.id && (
              <Card>
                <CardContent className="pt-2">
                  <Attendance id={UserState?.value?.data?.id} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="visit">
            <VisitTab />
          </TabsContent>
        </Tabs>
      </div>

      <AutoScrollMembers customers={customers} />
    </div>
  );
}

const ProfilePicture = ({ img, name }) => {
  const [localImage, setLocalImage] = useState(null);

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
    <Avatar className="w-24 h-24 mr-4">
      <AvatarImage src={localImage} alt="Profile Picture" />
      <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
};

const AutoScrollMembers = ({ customers }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollSpeed = 1; // Adjust scroll speed
    let direction = 1; // 1 = down, -1 = up

    const scroll = () => {
      if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight
      ) {
        scrollContainer.scrollTop = 0; // Reset to top for infinite effect
      } else {
        scrollContainer.scrollTop += scrollSpeed * direction;
      }
    };

    const interval = setInterval(scroll, 10); // Adjust interval for smoothness
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const colors = [
    "bg-red-300",
    "bg-blue-300",
    "bg-green-300",
    "bg-yellow-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-teal-300",
    "bg-orange-300",
  ];

  return (
    <Card style={{ height: "100%" }}>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-[75vh] no-scrollbar overflow-y-auto">
          {customers.concat(customers).map((item, index) => {
            const randomColor = colors[index % colors.length];
            return (
              <div key={index} className="flex items-center m-2">
                <Avatar className="w-12 h-12 mr-4 ">
                  <AvatarImage src="/" alt="Customer Picture" />
                  <AvatarFallback className={`text-white ${randomColor}`}>
                    {item?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Link
                  className="hover:underline"
                  href={`/employee/customer/detail?id=${item.id}`}
                >
                  <Label
                    className="cursor-pointer"
                    style={{ fontWeight: "600" }}
                  >
                    {item?.name?.substring(0, 20)}
                  </Label>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const CustomerExtraData = () => {
  return (
    // <Card>
    //   <CardContent>
    <div className="flex flex-col gap-10 mt-5">
      <div className="py-2 px-5 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold tracking-tight">
          {"Customer Group"}
        </h2>
      </div>
      <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500 hover:rounded-lg">
        <h1 className="text-lg" style={{ fontWeight: "500" }}>
          Top Follow Up
        </h1>
      </div>
      <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500 hover:rounded-lg">
        <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
          Recent Customers
        </h1>
      </div>
      <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500 hover:rounded-lg">
        <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
          Weekly Follow Up
        </h1>
      </div>
      <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500 hover:rounded-lg">
        <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
          Monthly Follow Up
        </h1>
      </div>
      {/* <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
            City Wise
          </h1>
        </div>
        <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
            Field Wise
          </h1>
        </div> */}
    </div>
    // </CardContent>
    // </Card>
  );
};

const truncateText = (text, maxLength) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

function AboutTab({ data, customers, sales, total }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="font-semibold mb-4">About {data?.name}</h2>
        <div className="space-y-2">
          <p>
            <strong>Department:</strong> {data?.designation}
          </p>
          <p>
            <strong>Email:</strong> {data?.email}
          </p>
          <p>
            <strong>Basic Salary:</strong> {data?.basic_salary}
          </p>
          <p>
            <strong>Monthly Target:</strong> {data?.monthly_target}
          </p>
          <p>
            <strong>Total Salary:</strong> {data?.total_salary}
          </p>
          <p>
            <strong>Joined:</strong> January 2015
          </p>
          <p>
            <strong>Total Sales:</strong>{" "}
            {total &&
              new Intl.NumberFormat("en-US", { style: "decimal" }).format(
                total
              )}
          </p>
          <p>
            <strong>Customers:</strong> {customers} assigned, {sales} with
            purchases
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PostsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Share an update</h2>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Write something..."
          ></textarea>
          <Button className="mt-2">Post</Button>
        </CardContent>
      </Card>
      {[1, 2, 3].map((post) => (
        <Card key={post}>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Avatar className="mr-2">
                <AvatarImage
                  src="/placeholder.svg?height=40&width=40"
                  alt="John Doe"
                />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <p>
              Just closed a deal on our new XYZ-5000 machine. Great addition to
              the client's production line!
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CustomersTab({ data }) {
  const { state: UserState } = useContext(UserContext);

  const RenderEachMachine = ({ machine }) => {
    const totalPayments = machine.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return (
      <div className="flex justify-between items-center border-b pb-2">
        <Link
          href={`/${UserState?.value?.data?.base_route}/customer/machine?id=${machine.id}`}
        >
          <span className="hover:underline">{machine.serial_no}</span>
        </Link>
        <div className="flex items-center">
          {Number(machine.price) === totalPayments ? (
            <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
          ) : (
            <Clock className="text-yellow-500 w-5 h-5 mr-2" />
          )}
          <Badge
            variant={
              Number(machine.price) === totalPayments ? "success" : "warning"
            }
          >
            {Number(machine.price) === totalPayments ? "Completed" : "Pending"}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(70dvh-52px)] p-5">
      <Accordion type="single" collapsible className="w-full space-y-4">
        {data.map((customer) => (
          <div className="flex gap-5" key={customer.id}>
            <div className="flex flex-1">
              <AccordionItem
                className="w-full"
                value={`customer-${customer.id}`}
              >
                <Card>
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <Link
                        href={`/${UserState.value.data?.base_route}/customer/detail?id=${customer.id}`}
                      >
                        <h3 className="font-semibold text-lg hover:underline">
                          {customer.name}
                        </h3>
                      </Link>
                      <Badge
                        className={"mr-2"}
                        variant={
                          customer.sales.length === 0 ? "secondary" : "default"
                        }
                      >
                        {customer.sales.length === 0 ? "Assigned" : "Purchased"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {customer.sales.length > 0 ? (
                        <div className="space-y-2">
                          {customer.sales.map((machine) => (
                            <RenderEachMachine
                              key={machine.id}
                              machine={machine}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          No machines purchased yet
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </div>
            <Button variant="outline" className="mt-1">
              Satisfaction
            </Button>
          </div>
        ))}
      </Accordion>
    </ScrollArea>
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

function FeedbackTab() {
  const feedbacks = [
    {
      id: 1,
      customer: "TechGiant Inc",
      rating: 5,
      comment: "Excellent service and product quality!",
    },
    {
      id: 2,
      customer: "MegaFactory Ltd",
      rating: 4,
      comment: "Good overall, but delivery was slightly delayed.",
    },
    {
      id: 3,
      customer: "IndustrialPro",
      rating: 5,
      comment: "John went above and beyond to meet our needs.",
    },
  ];

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <Card key={feedback.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{feedback.customer}</h3>
              {/* <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div> */}
            </div>
            <p>{feedback.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
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
  const [form, setform] = useState({ name: "", city: "", phone: "" });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">Remarks</h2>
          <Input
            value={form.name}
            onChange={(e) => {
              setform({ ...form, name: e.target.value });
            }}
            placeholder="Customer name..."
          />
          <Input
            value={form.city}
            onChange={(e) => {
              setform({ ...form, city: e.target.value });
            }}
            placeholder="City..."
          />
          <Input
            value={form.phone}
            onChange={(e) => {
              setform({ ...form, phone: e.target.value });
            }}
            placeholder="Phone number..."
          />
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
              temp.push({ comment: writeFeedback, date: moment(), ...form });
              setFeedbacks([...temp]);
              setWriteFeedback("");
              setform({ name: "", city: "", phone: "" });
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
              <p>{feedback?.name}</p>
              <p>{feedback?.city}</p>
              <p>{feedback?.phone}</p>
              <p>{feedback.comment}</p>
              <p>{moment(new Date(feedback.date)).format("YYYY-MM-DD")}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
