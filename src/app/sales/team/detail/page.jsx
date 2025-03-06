"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";
import ReimbursementEmployee from "@/components/employee/reimbursement";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomerEmployee from "@/components/employee/customer";

export default function Page() {
  const [data, setData] = useState();
  const search = useSearchParams();
  const userID = search.get("id");
  const { state: UserState } = useContext(UserContext);
  const [totalSales, setTotalSales] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [allowedExtraData, setAllowedExtraData] = useState(true)

  useEffect(() => {
    const id = search.get("id");
    axios.get(`/api/user/${id}`).then((response) => {
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
  }, []);

  return (
    <div className="flex flex-1">
      <CustomerExtraData allowed={allowedExtraData}/>
      <div className="flex flex-1 flex-col pb-8">
        <div className="flex items-center mb-8">
          <Avatar className="w-24 h-24 mr-4">
            <AvatarImage src="/" alt="Profile Picture" />
            <AvatarFallback>{data?.user?.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
            <p className="text-muted-foreground">{data?.user?.designation}</p>
          </div>
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members" onClick={()=> setAllowedExtraData(true)}>New Customers</TabsTrigger>
            {/* <TabsTrigger value="posts" onClick={()=> setAllowedExtraData(false)}>Posts</TabsTrigger> */}
            <TabsTrigger value="customers" onClick={()=> setAllowedExtraData(false)}>Members</TabsTrigger>
            <TabsTrigger value="documents" onClick={()=> setAllowedExtraData(false)}>Documents</TabsTrigger>
            <TabsTrigger value="feedback" onClick={()=> setAllowedExtraData(false)}>Feedback</TabsTrigger>
            <TabsTrigger value="about" onClick={()=> setAllowedExtraData(false)}>About</TabsTrigger>
            <TabsTrigger value="reimbursement" onClick={()=> setAllowedExtraData(false)}>Reimbursement</TabsTrigger>
            <TabsTrigger value="commission" onClick={()=> setAllowedExtraData(false)}>Commission</TabsTrigger>
            <TabsTrigger value="salary" onClick={()=> setAllowedExtraData(false)}>Salary</TabsTrigger>
            <TabsTrigger value="attendance" onClick={()=> setAllowedExtraData(false)}>Attendance</TabsTrigger>
          </TabsList>
          <TabsContent value="about">
            <AboutTab
              data={data?.user || {}}
              customers={data?.totalCustomers}
              sales={data?.totalSales}
              total={totalSales}
            />
          </TabsContent>
          <TabsContent value="members">
            {userID && <CustomerEmployee id={userID} />}
          </TabsContent>
          {/* <TabsContent value="posts">
            <PostsTab />
          </TabsContent> */}
          <TabsContent value="customers">
            <CustomersTab
              data={
                data?.customers.filter(
                  (customer) => customer.sales.length !== 0
                ) || []
              }
            />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
          <TabsContent value="reimbursement">
            {userID && <ReimbursementEmployee id={userID} />}
          </TabsContent>
        </Tabs>
      </div>
      <div style={{ minWidth: "300px" }}>
        <h1 className="text-3xl font-bold mb-5">Members</h1>
        <ScrollArea className="h-[80vh] px-2">
          {customers.map((item, index) => (
            <div key={index} className="flex items-center m-2">
              <Avatar className="w-12 h-12 mr-4">
                <AvatarImage src="/" alt="Customer Picture" />
                <AvatarFallback>{item?.name?.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <h2 style={{ fontWeight: "600" }} key={index}>
                {truncateText(item?.name || "", 20)}
              </h2>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}

const CustomerExtraData = ({ allowed }) => {
  if (allowed)
    return (
      <div className="flex flex-col gap-10 pr-2 mt-5">
        <div className="py-2 px-5 bg-gray-100 rounded-lg">
          <h2 className="text-2xl font-bold tracking-tight">
            {"Customer Group"}
          </h2>
        </div>
        <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <h1 className="text-lg" style={{ fontWeight: "500" }}>
            Top Follow Up
          </h1>
        </div>
        <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
            Recent Customers
          </h1>
        </div>
        <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <h1 className="text-lg font-semibold " style={{ fontWeight: "500" }}>
            Weekly Follow Up
          </h1>
        </div>
        <div className="py-2 px-5 hover:cursor-pointer hover:bg-blue-50 hover:text-blue-500">
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
  const RenderEachMachine = ({ machine }) => {
    const totalPayments = machine.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return (
      <div className="flex justify-between items-center border-b pb-2">
        <Link href={`/owner/customer/machine?id=${machine.id}`}>
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
    <Accordion type="single" collapsible className="w-full space-y-4">
      {data.map((customer) => (
        <div className="flex gap-5" key={customer.id}>
          <div className="flex flex-1">
        <AccordionItem className="w-full" value={`customer-${customer.id}`}>
          <Card>
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full">
                <Link href={`/owner/customer/detail?id=${customer.id}`}>
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
                      <RenderEachMachine key={machine.id} machine={machine} />
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
        <Button variant="outline" className="mt-1">Satisfaction</Button>
        </div>
      ))}
    </Accordion>
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
