"use client";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronsRight,
  CircleDashed
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import PageTable from "@/components/app-table";
import { CustomerSearch } from "@/components/customer-search";
import { Heading } from "@/components/ui/heading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserSearch } from "@/components/user-search";
import { BASE_URL } from "@/constants/data";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import moment from "moment";

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
          {row.getValue("status") === "Pending" ? (
            <CircleDashed color="red" size={"15px"} />
          ) : (
            <BadgeCheck color="green" size={"15px"} />
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

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return <TaskDetail detail={row.original || {}} />;
    },
  },
];

const getSchema = (isClientSelected) =>
  z.object({
    radio: z.enum(["office", "client"]),
    task: z.string().min(5, { message: "Task must be at least 5 characters." }),
    team: z.number({ required_error: "User is required." }),
    client: isClientSelected
      ? z.number({ required_error: "Client is required." }) // Required when client is selected
      : z.number().optional(), // Optional when office is selected
  });

const teamMembers = [
  { label: "Haseeb", value: "Haseeb" },
  { label: "Mujeeb", value: "Mujeeb" },
  { label: "Ahmad", value: "Ahmad" },
];

const clients = [
  { label: "ABC", value: "ABC" },
  { label: "NEL", value: "NEL" },
  { label: "OCTA", value: "OCTA" },
];

export default function Page() {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);


  useEffect(() => {
    async function fetchData() {
      axios
        .get(`${BASE_URL}/task`)
        .then((response) => {
          const apiData = response.data.map((item) => {
            return { ...item, created_at_time: item.created_at };
          });

          setData(apiData);
        })
        .catch((e) => {
          console.log(e);
        });

    }
    if (UserState?.value?.data?.id) {
      fetchData();
    }
  }, [UserState?.value?.data]);


  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Task Management" description="Manage team tasks" />
        <AddTask />
      </div>

      <PageTable
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={"task_name"}
        searchName={"Search task..."}
      ></PageTable>
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

const TaskDetail = ({ detail }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="p-0 w-8">
          <ChevronsRight />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Task Detail</SheetTitle>
          <SheetDescription>Check task details</SheetDescription>
          <div className="w-full flex justify-end">
            <Button>Delete</Button>
          </div>
        </SheetHeader>
        <div className="w-full py-6 px-4 bg-white rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Date
              </h3>
              <h3 className="text-sm font-medium text-gray-600">Assigned To</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assignee Email
              </h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Task
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <Label htmlFor="status" className="text-sm text-gray-800">
                {detail?.status}
              </Label>
              <Label htmlFor="assign_date" className="text-sm text-gray-800">
                {detail?.created_at}
              </Label>
              <Label htmlFor="assigned_to" className="text-sm text-gray-800">
                {detail?.assigned_to_name}
              </Label>
              <Label htmlFor="assignee_email" className="text-sm text-gray-800">
                {detail?.assigned_to_email}
              </Label>
              <Label htmlFor="assigned_task" className="text-sm text-gray-800">
                {detail?.task_name}
              </Label>
            </div>
          </div>
        </div>

        <SheetFooter className={"mt-4"}>
          <SheetClose asChild>
            <Button>
              {detail?.status === "Completed"
                ? "Mark as Pending"
                : "Mark as Completed"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const AddTask = () => {
  const [selectedRadio, setSelectedRadio] = useState("office");

  const form = useForm({
    resolver: zodResolver(getSchema(selectedRadio === "client")),
    defaultValues: {
      radio: "office",
      task: "",
      team: null,
      client: null,
    },
  });

  useEffect(() => {
    form.reset(
      {
        ...form.getValues(),
        client: selectedRadio === "client" ? form.getValues().client : "",
      },
      {
        resolver: zodResolver(getSchema(selectedRadio === "client")),
      }
    );
  }, [selectedRadio, form]);

  const onSubmit = (values) => {
    console.log("Form Data:", values);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setSelectedRadio("office");
            form.reset({
              radio: "office",
              task: "",
              team: null,
              client: null,
            });
          }}
        >
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new task</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Radio Selection */}
              <FormField
                control={form.control}
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
                control={form.control}
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

              {/* Team Member Selection */}
              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Member</FormLabel>
                    <FormControl>
                      <UserSearch
                        value={field.value}
                        onReturn={(val) => field.onChange(val)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Selection (Only When "Client" is Selected) */}
              {selectedRadio === "client" && (
                <FormField
                  control={form.control}
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
              )}

              <Button className="w-full" type="submit">
                Submit
              </Button>
            </form>
          </Form>
        </div>
        {/* <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
