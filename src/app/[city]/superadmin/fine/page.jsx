"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CustomerSearch } from "@/components/customer-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { UserSearch } from "@/components/user-search";
import { Heading } from "@/components/ui/heading";
import PageTable from "@/components/app-table-without-pagination";
import { ArrowUpDown, Filter, Trash2 } from "lucide-react";
import moment from "moment";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import FilterSheet from "@/components/users/filterSheet";
import momentT from "moment-timezone";
import { TIMEZONE } from "@/constants/data";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { TriggerFirebaseForFine } from "@/lib/triggerFirebase";

const formSchema = z.object({
  user_id: z.number({ required_error: "User is required." }),
  customer_id: z.number({ required_error: "Customer is required." }),
  amount: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Enter a valid amount"
    ),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

const tableHeader = [
  {
    value: "customer_name",
    label: "Customer",
  },
  {
    value: "user_name",
    label: "Employee",
  },
  {
    value: "amount",
    label: "Amount",
  },
  {
    value: "reason",
    label: "Reason",
  },
];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userID) {
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
  }, [userID]);

  async function fetchData(startDate, endDate, user = null) {
    setLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/fine?start_date=${startDate}&end_date=${endDate}&user=${
            user || ""
          }`
        )
        .then((response) => {
          setData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }

  async function handleRefresh() {
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
    await fetchData(startDate, endDate);
  }

  const columns = [
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

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },
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
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },

    {
      accessorKey: "amount",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "reason",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Reason
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("reason")}</div>,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(currentItem.id);
            }}
          >
            {selectedFine ? (
              <Spinner />
            ) : (
              <Trash2 className="h-5 w-5 text-red-500" size={16} />
            )}
          </Button>
        );
      },
    },
  ]

  async function handleDelete(id) {
    if (!id) return;
    setSelectedFine(id);
    try {
      const response = await axios.delete(`/${userID}/fine/${id}`);
      toast({ title: "Fine Deleted" });
      await handleRefresh();
    } finally {
      setSelectedFine(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Fine" description="Manage fines to your eomplyes" />
      </div>

      <PageTable
        loading={loading}
        columns={columns}
        data={data}
        tableHeader={tableHeader}
        onRowClick={() => {}}
      >
        <Button
          onClick={() => setFilterVisible(true)}
          variant="ghost"
          className="p-0 w-8"
        >
          <Filter />
        </Button>
        <Button onClick={() => setOpen(true)}>Add Fine</Button>
      </PageTable>

      <FilterSheet
      user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />

      <AddFine
        open={open}
        setOpen={setOpen}
        userID={userID}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

const AddFine = ({ open, setOpen, onRefresh, userID }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: null,
      customer_id: null,
      amount: "",
      reason: "",
    },
  });

  const onSubmit = (values) => {
    if (!userID) return;

    setLoading(true);
    axios
      .post(`/${userID}/fine`, values)
      .then(async () => {
        await onRefresh();
        handleOpenChange(false);
        TriggerFirebaseForFine(values.user_id)
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenChange = (val) => {
    form.reset();
    setOpen(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Fine</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a fine.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (err) => {
              console.log("Validation Errors", err);
            })}
            className="space-y-4"
          >
            {/* User Select */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <FormControl>
                    <UserSearch value={field.value} onReturn={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Select */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
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

            {/* Amount Input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Input */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reason" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />} Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
