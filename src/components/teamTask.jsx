"use client";
import { ArrowUpDown, BadgeCheck, CircleDashed, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";

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
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import PageTable from "@/components/app-table";
import { CustomerSearch } from "@/components/customer-search";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
import { TIMEZONE } from "@/constants/data";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import moment from "moment";
import momentT from "moment-timezone";

const columns = [
  {
    accessorKey: "status",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex ml-2 gap-1 items-center">
        <div>
          {row.getValue("status") === "Completed" ? (
            <BadgeCheck color="green" size={"15px"} />
          ) : (
            <CircleDashed color="red" size={"15px"} />
          )}
        </div>
        <div>{row.getValue("status")}</div>
      </div>
    ),
  },
  {
    accessorKey: "task_name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Task Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("task_name")}</div>,
  },

  {
    accessorKey: "assigned_to_name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned To
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("assigned_to_name")}</div>,
  },

  {
    accessorKey: "created_at_time",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assign Time
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        {new Date(row.getValue("created_at_time")).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    ),
  },

  {
    accessorKey: "created_at",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assign Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
      </div>
    ),
  },
];

const getSchema = (isClient) =>
  z.object({
    radio: z.enum(["office", "client"]),
    task: z.string().min(1, "Task is required"),
    client: isClient
      ? z
          .any()
          .nullable()
          .refine((val) => val, "Client is required")
      : z.any().nullable(),
    user: z.any().refine((val) => val, "User is required"),
    problem: isClient
      ? z.string().min(1, "Problem is required")
      : z.string().optional(),
    solution: isClient
      ? z.string().min(1, "Solution is required")
      : z.string().optional(),
  });

export default function TeamTask() {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      fetchData(startDate, endDate);
    }
  }, [UserState?.value?.data]);

  async function fetchData(start_date, end_date) {
    setDataLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/task?start_date=${start_date}&end_date=${end_date}&by=${UserState.value.data?.id}`
        )
        .then((response) => {
          const apiData = response.data.map((item) => {
            return { ...item, created_at_time: item.created_at };
          });

          setData(apiData);
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setDataLoading(false);
          resolve(true);
        });
    });
  }

  async function handleUpdateMark() {
    const startDate = momentT
      .tz(TIMEZONE)
      .startOf("month")
      .startOf("day")
      .utc()
      .toISOString();
    const endDate = momentT
      .tz(TIMEZONE)
      .endOf("month")
      .endOf("day")
      .utc()
      .toISOString();
    fetchData(startDate, endDate);
  }

  return (
    <div className="flex flex-1 flex-col pt-2">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          loading={dataLoading}
          columns={columns}
          data={data}
          totalItems={data.length}
          searchItem={"task_name"}
          searchName={"Search task..."}
          onRowClick={(val) => {
            setSelectedTask(val);
            setVisible(true);
          }}
        >
          <Button
            onClick={() => setFilterVisible(true)}
            variant="ghost"
            className="p-0 w-8"
          >
            <Filter />
          </Button>
          {UserState.value.data?.id && (
            <Button
              onClick={() => {
                setAddTaskVisible(true);
              }}
            >
              Add Task
            </Button>
          )}
        </PageTable>
      </div>

      <TaskDetail
        user_id={UserState?.value?.data?.id}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onDelete={(val) => {
          const temp = [...data.filter((item) => item.id !== val.id)];
          setData([...temp]);
        }}
        onMark={() => handleUpdateMark()}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end);
        }}
      />

      <AddTask
        onRefresh={() => {
          const startDate = momentT
            .tz(TIMEZONE)
            .subtract(2, "months")
            .startOf("month")
            .startOf("day")
            .utc()
            .toISOString();
          const endDate = momentT
            .tz(TIMEZONE)
            .endOf("month")
            .endOf("day")
            .utc()
            .toISOString();

          fetchData(startDate, endDate);
        }}
        defaultRadio={"office"}
        visible={addTaskVisible}
        onClose={setAddTaskVisible}
        assigned_by={UserState.value.data?.id}
      />
    </div>
  );
}

const TaskRadio = ({ onSelection, value }) => {
  return (
    <RadioGroup
      defaultValue={value}
      onValueChange={onSelection}
      className="flex"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="office" id="r1" />
        <Label htmlFor="r1">Office</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="client" id="r2" />
        <Label htmlFor="r2">Client</Label>
      </div>
    </RadioGroup>
  );
};

const TaskDetail = ({
  detail,
  visible,
  onClose,
  onDelete,
  onMark,
  user_id,
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  async function handleUpdateStatus(values) {
    setLoading(true);
    axios
      .put(`/user/${user_id}/task/${detail.id}`, {
        id: values.id,
        status: values.status,
      })
      .then(() => {
        toast({ title: "Status updated" });
        onClose(false);
      })
      .finally(() => {
        setLoading(false);
        onMark();
      });
  }

  async function handleDelete() {
    setDeleteLoading(true);
    axios
      .delete(`/user/${user_id}/task/${detail.id}`)
      .then(() => {
        onClose(false);
        toast({ title: "Task deleted" });
      })

      .finally(() => {
        setDeleteLoading(false);
        onDelete({ id: detail.id });
      });
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={onClose}
      onDelete={onDelete}
      onMark={onMark}
    >
      <SheetContent
        className="w-[50vw] max-w-[50vw]"
        style={{ width: "100%", maxWidth: "50vw" }}
      >
        <SheetHeader>
          <SheetTitle>Task Detail</SheetTitle>
          <SheetDescription>Check task details</SheetDescription>
          {/* <div className="w-full flex justify-end">
            <Button onClick={handleDelete}>
              {deleteLoading && <Spinner />} Delete
            </Button>
          </div> */}
        </SheetHeader>
        <div className="w-full py-6 px-4 bg-white rounded-lg shadow-lg mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Date
              </h3>
              {/* <h3 className="text-sm font-medium text-gray-600">Assigned To</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assignee Email
              </h3> */}
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Task
              </h3>
              {detail?.problem && (
                <>
                  <h3 className="text-sm font-medium text-gray-600">Problem</h3>
                  <h3 className="text-sm font-medium text-gray-600">
                    Solution
                  </h3>
                </>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Label htmlFor="status" className="text-sm text-gray-800">
                {detail?.status}
              </Label>
              <Label htmlFor="assign_date" className="text-sm text-gray-800">
                {detail?.created_at
                  ? moment(detail?.created_at).format("DD/MM/YYYY")
                  : ""}
              </Label>

              <Label htmlFor="assigned_task" className="text-sm text-gray-800">
                {detail?.task_name}
              </Label>

              {detail?.problem && (
                <>
                  <Label htmlFor="problem" className="text-sm text-gray-800">
                    {detail?.problem}
                  </Label>
                  <Label htmlFor="solution" className="text-sm text-gray-800">
                    {detail?.solution}
                  </Label>
                </>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className={"mt-4"}>
          {detail?.status !== "Completed" && (
            <Button
              onClick={() => {
                handleUpdateStatus({
                  ...detail,
                  status: "Completed",
                });
              }}
            >
              {loading && <Spinner />}
              {"Mark as Completed"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const AddTask = ({ visible, onClose, onRefresh, assigned_by }) => {
  const [selectedRadio, setSelectedRadio] = useState("office");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(getSchema(selectedRadio === "client")),
    defaultValues: {
      radio: "office",
      task: "",
      client: null,
      user: null,
      problem: "",
      solution: "",
    },
  });

  const { watch, reset, handleSubmit, control, getValues } = form;

  useEffect(() => {
    reset(
      {
        ...getValues(),
        client: selectedRadio === "client" ? getValues().client : null,
      },
      {
        resolver: zodResolver(getSchema(selectedRadio === "client")),
      }
    );
  }, [selectedRadio, reset, getValues]);

  const onSubmit = (values) => {
    setLoading(true);
    axios
      .post(`/task`, {
        task_name: values.task,
        type: values.radio == "office" ? "Office Task" : "Client Visit",
        client: values.client,
        status: "Assigned",
        assigned_to: values.user,
        assigned_by: assigned_by,
        problem: values.problem,
        solution: values.solution,
      })
      .then(() => {
        onRefresh();
        handleClose(false);
        toast({ title: "Task created successfully" });
      })

      .finally(() => {
        setLoading(false);
      });
  };

  function handleClose(val) {
    reset({
      radio: "office",
      task: "",
      client: null,
      user: null,
    });
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new task</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={control}
                name="radio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <TaskRadio
                        value={field.value}
                        onSelection={(e) => {
                          field.onChange(e);
                          setSelectedRadio(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Input */}
              <FormField
                control={control}
                name="task"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Employee</FormLabel>
                    <FormControl>
                      <UserSearch
                        value={field.value}
                        onReturn={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Selection (Only When "Client" is Selected) */}
              {selectedRadio === "client" && (
                <>
                  <FormField
                    control={control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <FormControl>
                          <CustomerSearch
                            value={field.value}
                            onReturn={(val) => field.onChange(val)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="problem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Describe the problem"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="solution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solution</FormLabel>
                        <FormControl>
                          <Input placeholder="Proposed solution" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button className="w-full" type="submit">
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
