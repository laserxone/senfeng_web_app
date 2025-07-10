"use client";
import AddCustomerDialog from "@/components/addCustomer";
import PageTable from "@/components/app-table";
import AppCalendar from "@/components/appCalendar";
import AutoScrollMembers from "@/components/autoScroll";
import { RequiredStar } from "@/components/RequiredStar";
import TeamTask from "@/components/teamTask";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSearch } from "@/components/user-search";
import Attendance from "@/components/users/attendance";
import FilterSheet from "@/components/users/filterSheet";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import SalaryRecord from "@/components/users/SalaryRecord";
import { toast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { startHolyLoader } from "holy-loader";
import { ArrowUpDown, Filter } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import "./styles.css";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filter, setFilter] = useState({ start: null, end: null });
  const [filterData, setFilterData] = useState();
  const [selectedOption, setSelectedOption] = useState("withoutFeedback");
  const [activeTab, setActiveTab] = useState("newCustomers");

  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [UserState]);

  async function fetchReimbursementData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${UserState.value.data?.id}/reimbursement?start_date=${startDate}&end_date=${endDate}`
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
          `/${UserState.value.data.id}/attendance?start_date=${startDate}&end_date=${endDate}`
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
    return new Promise(async (resolve) => {
      try {
        const response = await axios.get(`/${UserState.value.data?.id}/dashboard`);
  
        const withFeedbackFixed = response.data.withFeedback.map((item) => {
          return { ...item, number: item?.number?.join(", ") };
        });

        const withoutFeedbackFixed = response.data.withoutFeedback.map(
          (item) => {
            return { ...item, number: item?.number?.join(", ") };
          }
        );

        setData({
          user: response.data?.user,
          withFeedback: withFeedbackFixed,
          withoutFeedback: withoutFeedbackFixed,
        });
      } finally {
        resolve(true);
      }
    });
  }

  useEffect(() => {
    if (filter.start) {
      let temp = {};
      const startDate = moment(new Date(filter.start));
      const endDate = moment(new Date(filter.end));

      temp.user = data.user;
      temp.withoutFeedback = [...data.withoutFeedback];
      temp.withFeedback = [...data.withFeedback].filter((item) => {
        const feedbackDate = moment(new Date(item.feedback_date));
        return (
          feedbackDate.isSameOrAfter(startDate) &&
          feedbackDate.isSameOrBefore(endDate)
        );
      });

      setFilterData(temp);
    } else {
      setFilterData(data);
    }
  }, [filter, data]);

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-5 flex flex-1">
          <div className="flex flex-1 gap-5">
            <CustomerEmployeeAfterSales
              data={filterData ? filterData : data}
              totalCustomerText={"Total Members"}
              user_id={data?.user?.id}
              onRefresh={async () => await fetchData()}
              onFilterData={(start, end) => {
                setFilter({ start: moment(start), end: moment(end) });
              }}
              handleClear={() => setFilter({ start: null, end: null })}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [data, filterData, selectedOption]);

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-5 flex flex-1">
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
      <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
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
        <div className="flex justify-between mb-4 flex-wrap">
          <div className="flex items-center ">
            <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
            <div>
              <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
              <p className="text-muted-foreground">{data?.user?.designation}</p>
            </div>
          </div>
        </div>

        <Tabs
          className="relative flex w-full flex-1 flex-col"
          value={activeTab} onValueChange={setActiveTab}
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="task">Team Task</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full mt-2">
            {activeTab === "newCustomers" && <RenderNewCustomer />} 
            {activeTab === "reimbursement" && <RenderReimbursement />}
            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "task" && (
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <TeamTask />
                </CardContent>
              </Card>
            )}
            {activeTab === "salary" && (
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={UserState.value.data?.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </Tabs>
      </div>

      <AutoScrollMembers />
    </div>
  );
}

const CustomerEmployeeAfterSales = ({
  onRefresh,
  totalCustomerText,
  user_id,
  data,
  onFilterData,
  handleClear,
  selectedOption,
  setSelectedOption,
}) => {
  const { state: UserState } = useContext(UserContext);
  const [addCustomer, setAddCustomer] = useState(false);
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [next, setNext] = useState(null);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [oldRecordVisible, setOldRecordVisible] = useState(false);

  const columns = [
    {
      accessorKey: "owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
    },
    {
      accessorKey: "name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },

    {
      accessorKey: "number",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("number")}</div>,
    },

    {
      accessorKey: "location",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },

    {
      accessorKey: "feedback_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("feedback_date")
            ? moment(new Date(row.getValue("feedback_date"))).format(
                "YYYY-MM-DD"
              )
            : "Not taken"}
        </div>
      ),
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomer(currentItem);
              setShowFeedback(true);
            }}
          >
            Take Feedback
          </Button>
        );
      },
    },
  ];

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${UserState.value.data?.id}/feedback`, {
        feedback: feedback,
        top_follow: false,
        type: "aftersales",
        customer_id: selectedCustomer?.id,
        user_id: UserState.value.data?.id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
        setShowFeedback(false);
      });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-row flex-1 gap-2">
        <CustomerExtraData
          data={{
            withFeedback: data?.withFeedback || [],
            withoutFeedback: data?.withoutFeedback || [],
          }}
          option={selectedOption}
          onSelect={(val) => {
            setSelectedOption(val);
          }}
        />

        <div className="flex flex-1">
          <PageTable
            totalCustomerText={totalCustomerText}
            totalCustomer={data?.[selectedOption]?.length || 0}
            columns={columns}
            data={data?.[selectedOption] || []}
            totalItems={data?.[selectedOption]?.length || 0}
            tableHeader={tableHeader}
            onRowClick={(val) => {
              if (val?.id) {
                startHolyLoader();
                router.push(
                  `/${UserState.value.data?.base_route}/${
                    val.member ? "member" : "customer"
                  }/${val.id}`
                );
              }
            }}
          >
            <div className=" flex justify-between gap-2 flex-wrap items-center">
              <div className="flex flex-row gap-2 flex-wrap items-center">
                <Button
                  onClick={() => setFilterVisible(true)}
                  variant="ghost"
                  className="p-0 w-8"
                >
                  <Filter />
                </Button>
                <Button variant="destructive" onClick={() => handleClear()}>
                  Clear
                </Button>
              </div>

              {UserState.value.data &&
                UserState.value.data.customer_add_access && (
                  <Button onClick={() => setAddCustomer(true)}>
                    Add Customer
                  </Button>
                )}

              <Button
                variant={"outline"}
                onClick={() => setOldRecordVisible(true)}
              >
                Open Record
              </Button>
            </div>
          </PageTable>
        </div>

        <AddCustomerDialog
          user_designation={UserState.value.data?.designation}
          user_id={user_id}
          ownership={true}
          visible={addCustomer}
          onClose={setAddCustomer}
          onRefresh={() => {
            onRefresh();
          }}
        />

        <FilterSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onReturn={async (val) => {
            await onFilterData(val.start, val.end);
          }}
        />

        <OldRecordSheet
          visible={oldRecordVisible}
          onClose={setOldRecordVisible}
          user_id={UserState.value.data?.id}
        />

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
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
                  <h1>Top Follow up</h1>
                  <Checkbox
                    checked={top}
                    onCheckedChange={(checked) => {
                      setTop(checked);
                    }}
                  />
                </div>

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
    </div>
  );
};

export const OldRecordSheet = ({ visible, onClose, user_id, crm = false }) => {
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState(null);
  const [data, setData] = useState([]);
  const { state: UserState } = useContext(UserContext);
  const [sendLoading, setSendLoading] = useState(false);

  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
    },
  });

  async function onSubmit(values) {
    if (!user_id) return;
    setLoading(true);
    let start = values.start.toISOString();
    let end = values.end.toISOString();

    try {
      let query = `/${user_id}/feedback?start_date=${start}&end_date=${end}`;
      if (crm) {
        query += "&crm=true";
      }
      const response = await axios.get(query);

      setData(response.data);
    } finally {
      setLoading(false);
    }
  }

  function handleClose(val) {
    onClose(val);
    handleClear();
  }

  function handleClear() {
    form.reset({
      start: moment().startOf("month").toDate(),
      end: moment().endOf("month").toDate(),
    });
    setData([]);
  }

  async function handleSendReport(e) {
    e.preventDefault();
    setSendLoading(true);

    try {
      const response = await axios.post(
        `/${UserState.value.data?.id}/conversations`,
        {
          user1: UserState.value.data?.id,
          user2: sendTo,
        }
      );
      if (response.data?.id) {
        let formData = { type: "feedback", content: data };
        const startDate = form.getValues("start");
        const endDate = form.getValues("end");

        await axios
          .post(
            `/${UserState.value.data?.id}/conversations/${response.data?.id}`,
            {
              senderId: UserState.value.data?.id,
              message: `Report ${moment(startDate).format(
                "YYYY-MM-DD"
              )} to ${moment(endDate).format("YYYY-MM-DD")}`,
              data: JSON.stringify(formData),
            }
          )
          .then(() => {
            toast({ title: "Report sent" });
          });
      }
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent
        style={{ width: "100%", maxWidth: "95vw", alignItems: "flex-start" }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">Feedbacks Record</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-row gap-4 items-end flex-wrap"
            >
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <AppCalendar
                        date={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <AppCalendar
                        date={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={loading} type="submit">
                {loading && <Spinner />} Filter
              </Button>

              {data.length > 0 && (
                <div className="flex gap-2 items-center">
                  <UserSearch
                    className="w-[200px]"
                    onReturn={setSendTo}
                    value={sendTo}
                  />
                  <Button
                    disabled={!sendTo || sendLoading}
                    onClick={handleSendReport}
                  >
                    {sendLoading && <Spinner />}Send Report
                  </Button>
                </div>
              )}
            </form>
          </Form>
          <ScrollArea className="h-[80vh] px-4">
            {data.length == 0 ? (
              <div className="flex flex-1 flex-col gap-2">
                <p>No data to display</p>
              </div>
            ) : (
              <div className="px-4 py-6 space-y-2 border-l-2 border-muted relative">
                {data.map((fb, index) => (
                  <div key={fb.id} className="relative pl-6">
                    {/* Dot on the timeline */}
                    <div className="absolute left-[-9px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />

                    {/* Card content */}
                    <Card className="bg-background border border-border shadow-sm">
                      <CardHeader className="pb-0">
                        <div className="text-sm text-muted-foreground">
                          <span className="mr-2">{fb?.user_name}</span>
                          {moment(fb.feedback_date).format("YYYY-MM-DD")}
                        </div>
                        <Link
                          target="blank"
                          href={`/${UserState.value.data?.base_route}/member/${fb.customer_id}`}
                        >
                          <div className="text-base font-semibold text-foreground hover:underline">
                            {`${fb.name} - ${fb.owner} - ${fb.location}`}
                          </div>
                        </Link>
                      </CardHeader>

                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                        <div>
                          <span className="font-medium text-foreground">
                            Number:
                          </span>{" "}
                          {fb.number}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Status:
                          </span>{" "}
                          {fb.status}
                        </div>

                        <div className="col-span-full pt-2 border-t mt-2 text-foreground whitespace-pre-line">
                          <p className="mt-2">
                            {fb.feedback || (
                              <em className="text-muted-foreground">
                                No feedback provided.
                              </em>
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const CustomerExtraData = ({ data, option, onSelect }) => {
  const menuItems = [
    { key: "pending", label: "Pending", dataKey: "withoutFeedback" },
    { key: "completed", label: "Completed", dataKey: "withFeedback" },
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
              onSelect(dataKey);
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
                className={`h-8 w-8 flex items-center justify-center font-semibold rounded-full shadow-md ml-2 text-[12px]
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
    </div>
  );
};

const tableHeader = [
  {
    value: "Name",
    label: "Name",
  },
  {
    value: "Owner",
    label: "Owner",
  },
  {
    value: "Number",
    label: "Number",
  },
  {
    value: "Location",
    label: "Location",
  },
];

const thStyle = {
  padding: "0.75rem",
  textAlign: "left",
  borderBottom: "1px solid #444",
};

const tdStyle = {
  padding: "0.75rem",
  borderBottom: "1px solid #ddd",
};

const trStyle = {
  backgroundColor: "#fff",
};
