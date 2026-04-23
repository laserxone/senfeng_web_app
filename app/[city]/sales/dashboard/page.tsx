"use client";
import AutoScrollMembers from "@/components/autoScroll";
import {
  FeedbackTakenCard,
  MachinesSoldCard,
  VisitsDoneCard,
} from "@/components/dashboardCards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitTab from "@/components/users/addVisit";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import Reimbursement from "@/components/users/Reimbursement";

import AppCalendar from "@/components/appCalendar";
import { RequiredStar } from "@/components/RequiredStar";
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
import { CustomerExtraData } from "@/components/users/ExtraData";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import RenderFines from "@/components/users/render-fines";
import RenderReturnable from "@/components/users/render-returnable";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { SalesCustomer, SalesCustomerMachines, SalesDashboard, SalesMachine, SalesVisitTypes, UserAttendanceRecord, UserCallData, UserExtraTypes, UserReimbursementType } from "@/lib/types";
import { updateItemPurpose } from "@/lib/updatePurpose";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";

export default function Page() {
  const [data, setData] = useState<SalesDashboard>();
  const { userID, base_route } = useUserDetail();
  const [visitData, setVisitData] = useState<SalesVisitTypes[]>([]);
  const [extraData, setExtraData] = useState<UserExtraTypes>();
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [reimbursementData, setReimbursementData] = useState<UserReimbursementType[]>([]);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceRecord[]>([]);
  const [callData, setCallData] = useState<UserCallData[]>([]);
  const [machineData, setMachineData] = useState<SalesMachine[]>([]);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("newCustomers");

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchVisitData(startDate, endDate);
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
      fetchCallData(startDate, endDate);
      // fetchScrollData()
    }
  }, [userID]);

  async function fetchCallData(startDate: string, endDate: string) {
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/call?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setCallData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchReimbursementData(startDate: string, endDate: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}`
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

  async function fetchAttendanceData(startDate: string, endDate: string) {
    return new Promise<void | any>((res, rej) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item: UserAttendanceRecord) => {
              let status = item?.leave_status
                ? `Leave ${item?.leave_status}`
                : "Absent";

              if (item?.time_in) {
                const checkInTime = new Date(item.time_in);
                const threshold = new Date(item.time_in);
                threshold.setHours(10, 10, 0, 0);

                if (checkInTime > threshold) {
                  status = "Late";
                } else {
                  status = "Present";
                }
              }
              return {
                ...item,
                date: item?.time_in || item?.leave_date,
                status,
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
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/dashboard`)
        .then((response) => {
          setData(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  async function fetchVisitData(start: string, end: string) {
    return new Promise((res, rej) => {
      axios
        .get(`/${userID}/visit?start_date=${start}&end_date=${end}`)
        .then((response) => {
          setVisitData(response.data);
        })
        .finally(() => {
          res(true);
        });
    });
  }

  async function fetchExtraCustomerOptions() {
    axios.get(`/${userID}/dashboard/group`).then((response) => {
      setExtraData(response.data);
    });
  }

  const RenderVisitTab = useCallback(() => {
    return (
      <VisitTab
        height="h-[calc(100dvh-360px)]"
        id={userID}
        data={visitData}
        onRefresh={async () => {
          const startDate = moment().startOf("month").toISOString();
          const endDate = moment().endOf("month").toISOString();
          await fetchVisitData(startDate, endDate);
          await fetchData();
        }}
        onFetchData={async (start, end) => {
          await fetchVisitData(start, end);
        }}
      />
    );
  }, [visitData]);

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
          <div className="flex flex-1 gap-5">
            <CustomerExtraData
              data={extraData || {}}
              option={selectedOption}
              onSelect={(val) => {
                setSelectedOption(val);
              }}
            />
            <CustomerEmployee
             height="min-h-[calc(100dvh-470px)]"
              ownership={false}
              customer_data={
                selectedOption && extraData ? extraData[selectedOption as Exclude<keyof UserExtraTypes, "user">] : []
              }
              onRefresh={() => fetchData()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [userID, data, extraData, selectedOption]);

  const RenderMembers = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-0 pr-0 flex flex-1">
          <CustomersTab
          height="h-[calc(100dvh-380px)]"
            data={
              data?.customers.filter((customer) => customer.sales.length > 0) ||
              []
            }
          />
        </CardContent>
      </Card>
    );
  }, [userID, data]);

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
          <Reimbursement
            id={userID}
            height="min-h-[calc(100dvh-530px)]"
            passingData={reimbursementData || []}
            onAddRefresh={async () => {
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await fetchReimbursementData(startDate, endDate);
            }}
            onFilterReturn={async (start, end) => { await fetchReimbursementData(start, end) }
            }
            onReset={async (start: string, end: string) => {
              await fetchReimbursementData(start, end);
            }}
            onUpdatePurpose={(val) => {
              const newData = updateItemPurpose(reimbursementData, val);
              setReimbursementData(newData);
            }}
          />
        </CardContent>
      </Card>
    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (
      <Card className="flex flex-1 p-0">
        <CardContent className="pt-0 flex flex-1">
          <Attendance
            height="min-h-[calc(100dvh-470px)]"
            passingData={attendanceData}
            onFilterReturn={async (start, end) => {
              await fetchAttendanceData(start, end)
            }}
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);

  const RenderCallTab = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-0 flex flex-1">
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
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center">
          <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
          <div>
            <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
            <p className="text-muted-foreground">
              {data?.user?.designation}
            </p>
          </div>
        </div>
        <div className="flex justify-between gap-4 flex-wrap">

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
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">New Customers</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>

            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="issued">Returnable</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full mt-2">
            {activeTab === "newCustomers" && <RenderNewCustomer />}
            {activeTab === "members" && <RenderMembers />}
            {activeTab === "reimbursement" && <RenderReimbursement />}

            {activeTab === "visit" && <RenderVisitTab />}
            {activeTab === "calls" && <RenderCallTab />}

            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "salary" && (
              <Card className="flex flex-1 p-0">
                <CardContent className="pt-0 flex flex-1">
                  <SalaryRecord id={userID} height="min-h-[calc(100dvh-420px)]" />
                </CardContent>
              </Card>
            )}
            {activeTab === "issued" && <RenderReturnable height="min-h-[calc(100dvh-420px)]" />}
            {activeTab === 'fines' && <RenderFines height="min-h-[calc(100dvh-480px)]" />}
          </div>
        </Tabs>
      </div>

      {/* <AutoScrollMembers /> */}
      <MachinesSold visible={visible} setVisible={setVisible} machineData={machineData} base_route={base_route} />
    </div>
  );
}

function CustomersTab({ data, height = "h-[calc(100dvh-250px)]" }: { data: SalesCustomer[], height ?:string }) {
  const [localData, setLocalData] = useState<(SalesCustomer & { overall: string })[]>([]);
  const { base_route } = useUserDetail();

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

  const RenderEachMachine = ({ machine, customer_id }: { machine: SalesCustomerMachines, customer_id: number }) => {
    const totalPayments = machine.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return (
      <div className="flex justify-between items-center border-b pb-2 w-full">
        <Link href={`/${base_route}/member/${customer_id}/${machine.id}`}>
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
              Number(machine.price) === totalPayments ? "default" : "destructive"
            }
          >
            {Number(machine.price) === totalPayments ? "Completed" : "Pending"}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className={`${height} w-full pr-4`}>
      <Accordion type="single" collapsible className="w-full space-y-4 p-2">
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
                          href={`/${base_route}/${customer.member ? "member" : "customer"
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
            </div>
          ))
        )}
      </Accordion>
    </ScrollArea>
  );
}

function Calls({ data, onRefresh }: { data: UserCallData[], onRefresh: () => Promise<void> }) {
  const [visible, setVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UserCallData | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const [satisfactory, setSatisfactory] = useState(false);
  const [next, setNext] = useState<Date | undefined>(undefined);
  const [top, setTop] = useState(false);
  const { userID } = useUserDetail();

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${userID}/feedback`, {
        feedback: feedback,
        type: "feedback",
        customer_id: selectedCustomer?.id,
        user_id: userID,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const RenderEachCall = ({ call }: { call: UserCallData }) => {
    return (
      <Card key={call.id} className="w-full p-0">
        <CardContent className="px-4 py-2">
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
    <div className="w-full">
      <ScrollArea className="h-[calc(100dvh-380px)] p-4 ">
        {data.length === 0 ? (
          <Label>No calls remaining</Label>
        ) : (
          <div className="flex flex-col gap-4 p-2">
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
                <h1>Top Follow Up?</h1>
                <Checkbox
                  checked={top}
                  onCheckedChange={(checked: boolean) => {
                    setTop(checked);
                  }}
                />
              </div>

              <div className="flex flex-row items-center gap-2">
                <h1>Satisfactory?</h1>
                <Checkbox
                  checked={satisfactory}
                  onCheckedChange={(checked: boolean) => {
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

function MachinesSold({ visible, setVisible, machineData, base_route }: { visible: boolean, setVisible: (val: boolean) => void, machineData: SalesMachine[], base_route: string }) {

  return (
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
                href={`/${base_route}/member/${item.customer_id}/${item.id}`}
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
  )
}
