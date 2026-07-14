"use client";

import PageTable from "@/components/app-table";
import { CustomerSearch } from "@/components/customer-components/customer-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filter-sheet";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpDown, Filter, Trash2 } from "lucide-react";
import moment from "moment";
import momentT from "moment-timezone";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { TriggerFirebaseForFine } from "@/lib/triggerFirebase";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { UserFine, UserFines } from "@/lib/types";

const formSchema = z.object({
  user_id: z.number({ error: "User is required." }),
  customer_id: z.number({ error: "Customer is required." }),
  amount: z.coerce.number<number>().min(0, "Amount is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Page() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UserFines[]>([]);
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<number | null>(null);


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

  async function fetchData(startDate: string, endDate: string, user: number | null = null) {
    setLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/fine?start_date=${startDate}&end_date=${endDate}&user=${user || ""
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

  const columns : ColumnDef<UserFines>[] = [
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
              handleDelete(currentItem?.id);
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

  async function handleDelete(id?: number) {
    if (!id) return;
    setSelectedFine(id);
    try {
      const response = await axios.delete(`/${userID}/fine/${id}`);
      toast.success("Fine Deleted")
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
        onRowClick={() => { }}
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

const AddFine = ({ open, setOpen, onRefresh, userID }: { open: boolean, setOpen: (val: boolean) => void, onRefresh: () => Promise<void>, userID: number |  string }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: undefined,
      customer_id: undefined,
      amount: 0,
      reason: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!userID) return;

    setLoading(true);
    axios
      .post(`/${userID}/fine`, values)
      .then(async () => {
        await onRefresh();
        handleOpenChange(false);
        TriggerFirebaseForFine(values?.user_id)
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenChange = (val: boolean) => {
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>

            {/* User */}
            <Controller
              name="user_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>User</FieldLabel>

                  <UserSearch
                    value={field.value}
                    onReturn={field.onChange}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Customer */}
            <Controller
              name="customer_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Customer</FieldLabel>

                  <CustomerSearch
                    value={field.value}
                    onReturn={field.onChange}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Amount */}
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Amount</FieldLabel>

                  <Input
                    placeholder="Enter amount"
                    {...field}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Reason */}
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Reason</FieldLabel>

                  <Input placeholder="Enter reason" {...field} />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Submit */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner />} Submit
            </Button>

          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};
