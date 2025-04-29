"use client";
import AutoScrollMembers from "@/components/autoScroll";
import CustomerEmployee from "@/components/users/customer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import Reimbursement from "@/components/users/Reimbursement";
import { BASE_URL } from "@/constants/data";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserContext } from "@/store/context/UserContext";
import axios from "@/lib/axios";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import "./styles.css";
import SalaryRecord from "@/components/users/SalaryRecord";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [totalSales, setTotalSales] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [extraData, setExtraData] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();

      fetchAllCustomers();
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [UserState]);

  async function fetchReimbursementData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/user/${UserState.value.data?.id}/reimbursement?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          setReimbursementData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }

  async function fetchAttendanceData(startDate, endDate) {
    return new Promise((res, rej) => {
      axios
        .get(
          `/user/${UserState.value.data.id}/attendance?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item) => {
              return {
                ...item,
                date: item?.time_in,
                status: item?.time_in ? "Present" : "Absent",
              };
            });
            setAttendanceData(apiData);
          }
          res(true);
        })
        .catch((e) => {
          console.log(e);
          rej(null);
        });
    });
  }

  async function fetchData() {
    axios
      .get(`/user/${UserState.value.data?.id}`)
      .then((response) => {
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
  }

  async function fetchAllCustomers() {
    axios.get(`/customer`).then((response) => {
      setCustomers(response.data);
    });
  }
  async function fetchExtraCustomerOptions() {
    axios
      .get(`/user/${UserState.value.data?.id}/extra`)
      .then((response) => {
        setExtraData(response.data);
      });
  }

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-1 gap-5">
            {/* <CustomerExtraData
              data={extraData || {}}
              option={selectedOption}
              onSelect={(val) => {
                setSelectedOption(val);
              }}
            /> */}
            <CustomerEmployee
              totalCustomerText={"Total Members"}
              user_id={null}
              ownership={true}
              customer_data={customers.filter((customer) => customer.member)}
              onRefresh={() => fetchData()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [UserState.value.data, customers]);

  const RenderReimbursement = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-5">
          <Reimbursement
            id={UserState.value.data?.id}
            passingData={reimbursementData || []}
            onAddRefresh={(temp) => setReimbursementData([...temp])}
            onFilterReturn={async (start, end) =>
              await fetchReimbursementData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-2">
          <Attendance
            passingData={attendanceData}
            onFilterReturn={async (start, end) =>
              await fetchAttendanceData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 justify-between mb-8 flex-wrap">
          <div className="flex items-center ">
            <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
            <div>
              <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
              <p className="text-muted-foreground">{data?.user?.designation}</p>
            </div>
          </div>

          {/* <MachinesSoldCard
            value={data?.machinesSoldThisMonth || 0}
            percentage={data?.percentageChange || 0}
          />
          <FeedbackTakenCard
            value={data?.feedbacksTakenThisMonth || 0}
            total={data?.totalCustomers || 0}
            remaining={data?.remainingFeedbacks || 0}
          /> */}
        </div>

        <Tabs
          defaultValue="newCustomers"
          className="w-full flex flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            {/* <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger> */}
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

          <TabsContent value="newCustomers">
            <RenderNewCustomer />
          </TabsContent>

          <TabsContent value="reimbursement">
            <RenderReimbursement />
          </TabsContent>
          <TabsContent value="attendance">
            <RenderAttendance />
          </TabsContent>
          <TabsContent value="salary">
            <Card>
              <CardContent className="pt-2">
                <SalaryRecord />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {customers.length > 0 && <AutoScrollMembers customers={customers} />}
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

const CustomerExtraData = ({ data, option, onSelect }) => {
  const menuItems = [
    { key: "top", label: "Top Follow Up", dataKey: "top_followup" },
    { key: "recent", label: "Recent Customers", dataKey: "recent_customer" },
    { key: "weekly", label: "Weekly Follow Up", dataKey: "weekly" },
    { key: "monthly", label: "Monthly Follow Up", dataKey: "monthly" },
  ];

  return (
    // <Card>
    //   <CardContent>
    <div className="flex flex-col gap-10 mt-5">
      <div className="py-2 px-5 bg-gray-100 rounded-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold tracking-tight">
          {"Customer Group"}
        </h2>
      </div>
      <>
        {menuItems.map(({ key, label, dataKey }) => (
          <div
            onClick={() => {
              onSelect(option == dataKey ? "" : dataKey);
            }}
            key={key}
            className={`flex items-center justify-between py-2 px-5 cursor-pointer rounded-lg transition-all duration-300
          ${
            option === dataKey
              ? "bg-[hsl(180,85%,30%)] text-white"
              : "hover:bg-[hsl(180,85%,90%)] hover:text-[hsl(180,85%,30%)]"
          }
        `}
          >
            <h1 className="text-lg font-medium">{label}</h1>
            {data?.[dataKey]?.length > 0 && (
              <div
                className={`h-8 w-8 flex items-center justify-center font-semibold rounded-full shadow-md ml-2
              ${
                option === dataKey
                  ? "bg-white text-[hsl(180,85%,30%)]"
                  : "bg-[hsl(180,85%,30%)] text-white"
              }
            `}
              >
                {data?.[dataKey]?.length ?? 0}
              </div>
            )}
          </div>
        ))}
      </>
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
        {data.length == 0 ? (
          <Label>No Data found</Label>
        ) : (
          data.map((customer) => (
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
                          href={`/${UserState.value.data?.base_route}/customer${customer.id}`}
                        >
                          <h3 className="font-semibold text-lg hover:underline">
                            {customer.name}
                          </h3>
                        </Link>
                        <Badge
                          className={"mr-2"}
                          variant={
                            customer.sales.length === 0
                              ? "secondary"
                              : "default"
                          }
                        >
                          {customer.sales.length === 0
                            ? "Assigned"
                            : "Purchased"}
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
              {/* <Button variant="outline" className="mt-1">
                Satisfaction
              </Button> */}
            </div>
          ))
        )}
      </Accordion>
    </ScrollArea>
  );
}
