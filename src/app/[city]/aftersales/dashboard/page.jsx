"use client";
import AddCustomerDialog from "@/components/addCustomer";
import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import AutoScrollMembers from "@/components/autoScroll";
import { RequiredStar } from "@/components/RequiredStar";
import TeamTask from "@/components/teamTask";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import FilterSheet from "@/components/users/filterSheet";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { startHolyLoader } from "holy-loader";
import { ArrowUpDown, Filter } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import  OldRecordSheet  from "@/components/users/old-record-sheet";
import RenderFines from "@/components/users/render-fines";
import { updateItemPurpose } from "@/lib/updatePurpose";

export default function Page() {
  const [data, setData] = useState();
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filter, setFilter] = useState({ start: null, end: null });
  const [filterData, setFilterData] = useState();
  const [selectedOption, setSelectedOption] = useState("withoutFeedback");
  const [activeTab, setActiveTab] = useState("newCustomers");
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [userID]);

  async function fetchReimbursementData(startDate, endDate) {
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

  async function fetchAttendanceData(startDate, endDate) {
    return new Promise((res, rej) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`
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
        const response = await axios.get(`/${userID}/dashboard`);

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
            id={userID}
            passingData={reimbursementData || []}
            onAddRefresh={(temp) => setReimbursementData([...temp])}
              onReset={async (start, end) => {
              await fetchReimbursementData(start, end);
            }}
            onFilterReturn={async (start, end) =>
              await fetchReimbursementData(start, end)
            }

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
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">Members</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="task">Team Task</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="fines">Fines</TabsTrigger>
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
                  <SalaryRecord id={userID} />
                </CardContent>
              </Card>
            )}
            {activeTab === 'fines' && <RenderFines />}
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
  const { base_route, customer_add_access, designation, office, route_branch } =
    useUserDetail();
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
      .post(`/${user_id}/feedback`, {
        feedback: feedback,
        top_follow: false,
        type: "aftersales",
        customer_id: selectedCustomer?.id,
        user_id: user_id,
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
            columns={columns}
            data={data?.[selectedOption] || []}
            tableHeader={tableHeader}
            onRowClick={(val, event) => {
              if (val?.id) {
                const url = `/${base_route}/${
                  val.member ? "member" : "customer"
                }/${val.id}`;
                if (event.ctrlKey || event.metaKey) {
                  window.open(url, "_blank");
                } else {
                  startHolyLoader();
                  router.push(url);
                }
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

              {customer_add_access && (
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
          user_designation={designation}
          office={route_branch}
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
          user_id={user_id}
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
