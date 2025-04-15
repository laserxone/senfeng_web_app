"use client";
import { ArrowUpDown, Frown, Smile, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import { CustomerSearch } from "@/components/customer-search";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BASE_URL } from "@/constants/data";
import { UserContext } from "@/store/context/UserContext";
import axios from "@/lib/axios";
import moment from "moment";
import Link from "next/link";

const tableHeader = [
  {
    value: "customer_name",
    label: "Client",
  },
  {
    value: "note",
    label: "Feedback",
  },
  {
    value: "status",
    label: "Status",
  },
];

export default function Page() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState([]);
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    async function fetchData() {
      axios.get(`/feedback`).then((response) => {
        const temp = response.data.map((item) => {
          return {
            ...item,
            customer_name: item.customer_name || item.customer_owner,
          };
        });
        setData([...temp]);
      });
    }
    if (UserState.value.data?.id) fetchData();
  }, [UserState.value.data]);

  const columns = [
    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },

      cell: ({ row }) => {
        const item = row.original;
        return (
          <Link
            className="hover:underline"
            href={`/${UserState.value.data?.base_route}/customer/detail?id=${item.customer_id}`}
          >
            <div className="ml-2">{row.getValue("customer_name")}</div>
          </Link>
        );
      },
    },
    {
      accessorKey: "feedback",
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
      cell: ({ row }) => <div>{row.getValue("feedback")}</div>,
    },

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
        <div>
          {row.getValue("status") === "Satisfactory" ? (
            <div className="flex items-center gap-2">
              <Smile size={"20px"} color="green" /> {" Satisfactory"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Frown size={"20px"} color="red" /> {" Unsatisfactory"}
            </div>
          )}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taken By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
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
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("created_at")
            ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    // {
    //   id: "actions",
    //   header: "Action",
    //   size: 50,
    //   cell: ({ row }) => {
    //     return (
    //       <Button variant="ghost" onClick={() => setShowConfirmation(true)}>
    //         <Trash2 className="h-5 w-5 text-red-500" />
    //       </Button>
    //     );
    //   },
    // },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Feedback" description="Manage Feedback from clients" />
        {/* <FeedbackDialog /> */}
      </div>

      <PageTable
        columns={columns}
        data={data}
        totalItems={data.length}
        tableHeader={tableHeader}
        onRowClick={() => {}}
      ></PageTable>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove feedback from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
}

const FeedbackDialog = () => {
  const formSchema = z.object({
    feedback: z
      .string()
      .min(6, { message: "Feedback must be at least 6 characters." }),
    client: z.number({ required_error: "Client is required" }),
    status: z.string().min(1, { message: "Status is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
      client: null,
      status: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset();
          }}
        >
          Add Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new feedback</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Feedback Input */}
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter feedback" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Select Dropdown */}
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Client</FormLabel>
                    <CustomerSearch
                      value={field.value}
                      onReturn={(val) => field.onChange(val)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Satisfactory">
                            Satisfactory
                          </SelectItem>
                          <SelectItem value="Unsatisfactory">
                            Unsatisfactory
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
