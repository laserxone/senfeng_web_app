"use client";
import AddCustomerDialog from "@/components/addCustomer";
import AutoScrollMembers from "@/components/autoScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import Reimbursement from "@/components/users/Reimbursement";
import SalaryRecord from "@/components/users/SalaryRecord";
import axios from "@/lib/axios";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserContext } from "@/store/context/UserContext";
import { startHolyLoader } from "holy-loader";
import { ArrowUpDown, Filter } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import "./styles.css";
import PageTable from "@/components/app-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import AppCalendar from "@/components/appCalendar";
import Spinner from "@/components/ui/spinner";
import { RequiredStar } from "@/components/RequiredStar";
import FilterSheet from "@/components/users/filterSheet";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filter, setFilter] = useState({ start: null, end: null });
  const [filterData, setFilterData] = useState();
  const [selectedOption, setSelectedOption] = useState("withoutFeedback");

  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();

      // fetchAllCustomers();

      // fetchReimbursementData(startDate, endDate);
      // fetchAttendanceData(startDate, endDate);
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
    return new Promise(async (resolve) => {
      try {
        const response = await axios.get(`/user/${UserState.value.data?.id}`);

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
      return feedbackDate.isSameOrAfter(startDate) && feedbackDate.isSameOrBefore(endDate);
    });

    setFilterData(temp);
  } else {
    setFilterData(data);
  }
}, [filter, data]);


  useEffect(()=>{
    console.log(filterData)
  },[filterData])

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-1 gap-5">
            <CustomerEmployeeAfterSales
              data={filterData ? filterData : data}
              totalCustomerText={"Total Members"}
              user_id={data?.user?.id}
              onRefresh={async () => await fetchData()}
              onFilterData={(start, end) => {
                setFilter({ start: moment(start), end: moment(end) });
              }}
              handleClear={()=> setFilter({ start: null, end: null })}
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

      {/* {customers.length > 0 && <AutoScrollMembers customers={customers} />} */}
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
        GetProfileImage(img).then((imgResult) => {
          setLocalImage(imgResult);
        });
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

const CustomerEmployeeAfterSales = ({
  onRefresh,
  totalCustomerText,
  user_id,
  data,
  onFilterData,
  handleClear,
  selectedOption,
  setSelectedOption
}) => {
  
  const { state: UserState } = useContext(UserContext);
  const [addCustomer, setAddCustomer] = useState(false);
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [next, setNext] = useState(null);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

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
          {row.getValue("feedback_date") ? moment(new Date(row.getValue("feedback_date"))).format("YYYY-MM-DD") : "Not taken"}
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
      .post(`/feedback`, {
        feedback: feedback,
        top_follow: false,
        type: "aftersales",
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

        <div className="flex flex-1 min-h-[600px]">
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
                  `/${UserState?.value?.data?.base_route}/${
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
                <Button
                  variant="destructive"
                  onClick={() => handleClear()}
                >
                  Clear
                </Button>
              </div>

              {UserState.value.data &&
                UserState.value.data.customer_add_access && (
                  <Button onClick={() => setAddCustomer(true)}>
                    Add Customer
                  </Button>
                )}
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
