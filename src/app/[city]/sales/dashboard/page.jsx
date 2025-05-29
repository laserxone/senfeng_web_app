"use client";
import AutoScrollMembers from "@/components/autoScroll";
import {
  FeedbackTakenCard,
  MachinesSoldCard,
  VisitsDoneCard
} from "@/components/dashboardCards";
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
import VisitTab from "@/components/users/addVisit";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import Reimbursement from "@/components/users/Reimbursement";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserContext } from "@/store/context/UserContext";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import SalaryRecord from "@/components/users/SalaryRecord";
import axios from "@/lib/axios";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import "./styles.css";
import AppCalendar from "@/components/appCalendar";
import { RequiredStar } from "@/components/RequiredStar";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [visitData, setVisitData] = useState([]);
  const [extraData, setExtraData] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [reimbursementData, setReimbursementData] = useState([]); 
  const [attendanceData, setAttendanceData] = useState([]);
  const [callData, setCallData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [visible, setVisible] = useState(false);
 
  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchVisitData(startDate, endDate);
      fetchAllCustomers();
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
      fetchCallData(startDate, endDate);
    
    }
  }, [UserState]);

 

  async function fetchCallData(startDate, endDate) {
    return new Promise((resolve) => {
      axios
        .get(
          `/user/${UserState.value.data?.id}/call?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          setCallData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

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
    return new Promise((resolve) => {
      axios
        .get(`/user/${UserState.value.data?.id}`)
        .then((response) => {
          setData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchAllCustomers() {
    axios.get(`/customer`).then((response) => {
      setCustomers(response.data);
    });
  }

  async function fetchVisitData(start, end) {
    return new Promise((res, rej) => {
      axios
        .get(
          `/user/${UserState.value.data.id}/visit?start_date=${start}&end_date=${end}`
        )
        .then((response) => {
          setVisitData(response.data);
        })
        .finally(() => {
          res(true);
        });
    });
  }

  async function fetchExtraCustomerOptions() {
    axios
      .get(`/user/${UserState.value.data?.id}/extra?employee=sales`)
      .then((response) => {
        setExtraData(response.data);
      });
  }

  const RenderVisitTab = useCallback(() => {
    return (
      <VisitTab
        height="h-[calc(100dvh-260px)]"
        id={UserState.value.data?.id}
        data={visitData}
        onRefresh={async () => {
          const startDate = moment().startOf("month").toISOString();
          const endDate = moment().endOf("month").toISOString();
          await fetchVisitData(startDate, endDate);
          await fetchData();
        }}
        onFetchData={async (start, end, userId) => {
          await fetchVisitData(start, end);
        }}
      />
    );
  }, [visitData]);

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-1 gap-5">
            <CustomerExtraData
              data={extraData || {}}
              option={selectedOption}
              onSelect={(val) => {
                setSelectedOption(val);
              }}
            />
            <CustomerEmployee
              user_id={UserState.value.data?.id}
              ownership={false}
              customer_data={
                selectedOption
                  ? extraData[selectedOption]
                  : data?.customers || []
              }
              onRefresh={() => fetchData()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [UserState.value.data, data, extraData, selectedOption]);

  const RenderMembers = useCallback(() => {
    return (
      <Card>
        <CardContent className="p-0">
          <CustomersTab
            data={data?.customers.filter((customer) => customer.member) || []}
          />
        </CardContent>
      </Card>
    );
  }, [UserState.value.data, data]);

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

  const RenderCallTab = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-2">
          <Calls
            data={callData}
            onRefresh={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchData();
              await fetchCallData(startDate, endDate);
            }}
          />
        </CardContent>
      </Card>
    );
  }, [callData]);

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 justify-between mb-8 flex-wrap gap-2">
          <Link
            href={
              UserState.value.data?.base_route
                ? `/${UserState.value.data?.base_route}/profile`
                : "#"
            }
          >
            <div className="flex items-center">
              <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
              <div>
                <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
                <p className="text-muted-foreground">
                  {data?.user?.designation}
                </p>
              </div>
            </div>
          </Link>

          <MachinesSoldCard
            value={data?.machinesSoldThisMonth || 0}
            percentage={data?.percentageChange || 0}
            onClick={() => {
              setMachineData(data?.machinesSoldThisMonthDetail || []);
              setVisible(true);
            }}
          />

        
          <FeedbackTakenCard
            value={data?.feedbacksTakenThisMonth || 0}
            total={data?.totalCustomersWithSale || 0}
            remaining={data?.remainingFeedbacks || 0}
          />

          <VisitsDoneCard
            value={data?.totalVisits || 0}
            total={15}
            remaining={Math.max(15 - (data?.totalVisits || 0), 0)}
          />
        </div>

        <Tabs
          defaultValue="newCustomers"
          className="w-full flex flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">New Customers</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            {/* <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger> */}
            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            {/* <TabsTrigger value="location">Location</TabsTrigger> */}
          </TabsList>

          <TabsContent value="newCustomers">
            <RenderNewCustomer />
          </TabsContent>

          <TabsContent value="members">
            <RenderMembers />
          </TabsContent>

          <TabsContent value="reimbursement">
            <RenderReimbursement />
          </TabsContent>
          <TabsContent value="attendance">
            <RenderAttendance />
          </TabsContent>
          <TabsContent value="visit">
            <RenderVisitTab />
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardContent className="pt-2">
                <SalaryRecord />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calls">
            <RenderCallTab />
          </TabsContent>
        </Tabs>
      </div>

      {customers.length > 0 && <AutoScrollMembers customers={customers} />}

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Machines Sold</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="flex flex-1 flex-col gap-2">
              <div className="grid grid-cols-3 font-semibold border-b pb-2">
                <div>Serial No</div>
                <div>Company</div>
                <div>Owner</div>
              </div>

              {machineData.map((item, index) => (
                <Link
                  key={index}
                  target="_blank"
                  href={`/${UserState.value.data?.base_route}/member/${item.customer_id}/${item.id}`}
                  className="grid grid-cols-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
                >
                  <div>{item.serial_no}</div>
                  <div>{item.customer_name || "-"}</div>
                  <div>{item.customer_owner || "-"}</div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
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
  const [localData, setLocalData] = useState([]);

  useEffect(() => {
    if (data.length > 0) {
      const temp = data.map((customer) => {
        const customerCompletion = Number(customer.profile_completion) || 0;
        const machines = customer.sales || [];

        const totalMachineCompletion = machines.reduce(
          (sum, item) => sum + Number(item.percentage_completion || 0),
          0
        );

        const overallCompletion =
          (customerCompletion + totalMachineCompletion) / (machines.length + 1);

        return { ...customer, overall: overallCompletion.toFixed(0) };
      });
      setLocalData(temp);
    }
  }, [data]);

  const RenderEachMachine = ({ machine, customer_id }) => {
    const totalPayments = machine.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return (
      <div className="flex justify-between items-center border-b pb-2">
        <Link
          href={`/${UserState?.value?.data?.base_route}/member/${customer_id}/${machine.id}`}
        >
          <span className="hover:underline">{machine.serial_no}</span>
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
    <div className="h-[650px]">
      <ScrollArea className="h-[650px] p-5">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {localData.length == 0 ? (
            <Label>No Data found</Label>
          ) : (
            localData.map((customer) => (
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
                            href={`/${UserState.value.data?.base_route}/${
                              customer.member ? "member" : "customer"
                            }/${customer.id}`}
                          >
                            <h3 className="font-semibold text-lg hover:underline">
                              {customer.name}
                            </h3>
                          </Link>
                          <div className="flex flex-row gap-2">
                            <span className="font-normal text-sm text-gray-600 mr-2">
                              Overall profile completion: {customer.overall}%
                            </span>
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
                                  customer_id={customer.id}
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
    </div>
  );
}

function Calls({ data, onRefresh }) {
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [satisfactory, setSatisfactory] = useState(false);
   const [next, setNext] = useState(null);

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/feedback`, {
        feedback: feedback,
        top_follow: false,
        type: "feedback",
        customer_id: selectedCustomer?.id,
        user_id: UserState.value.data?.id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const RenderEachCall = ({ call }) => {
    return (
      <Card key={call.id} className="w-full">
        <CardContent className="py-4 px-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Name / Owner */}
            <div className="col-span-4 font-semibold text-lg truncate">
              {call.name || call.owner}
            </div>

            {/* Phone Number(s) */}
            <div className="col-span-6 text-sm text-muted-foreground truncate">
              {call.number.join(", ")}
            </div>

            {/* Button */}
            <div className="col-span-2 text-right">
              <Button
                onClick={() => {
                  setSelectedCustomer(call);
                  setVisible(true);
                }}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-[650px]">
      <ScrollArea className="h-[650px] p-5">
        {data.length === 0 ? (
          <Label>No calls remaining</Label>
        ) : (
          <div className="space-y-3">
            {data.map((call) => (
              <RenderEachCall call={call} key={call.id} />
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
             <div className="flex flex-1 flex-col gap-2">
                <h1>
                  Enter Feedback <RequiredStar />
                </h1>
                <Input
                  placeholder="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />

                <h1>
                  Next Follow Up <RequiredStar />
                </h1>
                <AppCalendar date={next} onChange={setNext} min={new Date()} />

                <div className="flex flex-row items-center gap-2">
                  <h1>Satisfactory?</h1>
                  <Checkbox
                    checked={satisfactory}
                    onCheckedChange={(checked) => {
                      setSatisfactory(checked);
                    }}
                  />
                </div>
                <Button
                  disabled={!next || !feedback}
                  onClick={() => {
                    handleSaveFeedback();
                  }}
                >
                  {loading && <Spinner />} Save
                </Button>
              </div>
          </DialogHeader>
        </DialogContent>
      </Dialog> 
    </div>
  );
}
