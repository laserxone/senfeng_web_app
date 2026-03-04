"use client";

import PageTable from "@/components/app-table-without-pagination";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
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

export default function MachineDelivery() {
  const { userID } = useUserDetail();
  const [data, setData] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    if (!userID) return;
    setLoading(true);
    const response = await axios.get(`/${userID}/delivery`);
    setData(response.data);
    setLoading(false);
  }

  const columns = [
    {
      accessorKey: "customer_owner",
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
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("customer_owner")}</div>
      ),
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
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },
    {
      accessorKey: "ownership_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manager
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("ownership_name")}</div>,
    },

    {
      accessorKey: "serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Serial No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("serial_no")}</div>,
    },

    {
      accessorKey: "power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("power")}</div>,
    },

    {
      accessorKey: "source",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("source")}</div>,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        return (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log(row.original);
              //   setSelectedCustomerId(currentItem?.id);
              //   setShowConfirmation(true);
            }}
          >
            Create Delivery
          </Button>
        );
      },
    },
  ];

  const tableHeader = [
    {
      value: "Owner",
      label: "Owner",
    },
    {
      value: "Name",
      label: "Company Name",
    },
    {
      value: "Number",
      label: "Number",
    },
    {
      value: "Industry",
      label: "Industry",
    },
    {
      value: "customer_group",
      label: "Group",
    },
    {
      value: "Location",
      label: "Location",
    },
    {
      value: "Machines",
      label: "Machines",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Machine Delivery"
          description="Manage machine deliveries"
        />
      </div>

      <PageTable
        columns={columns}
        data={data}
        tableHeader={tableHeader}
        onRowClick={(val, event) => {}}
      ></PageTable>
    </div>
  );
}

const dispatchSchema = z.object({
  orderNo: z.string().min(1, "Order number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  driverNumber: z
    .string()
    .min(1, "Driver number is required")
    .regex(/^[0-9+\-() ]+$/, "Invalid phone number"),
  dispatchTime: z.string().min(1, "Dispatch time is required"),
  manager: z.string().min(1, "Manager name is required"),
});

function DispatchOrderDialog({ open, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      orderNo: "",
      driverName: "",
      driverNumber: "",
      dispatchTime: "",
      manager: "",
    },
  });

  async function handleSubmit(values) {
    setLoading(true);

    try {
      await axios.post("/dispatch", {
        ...values,
        dispatchTime: new Date(values.dispatchTime),
      });

      await onRefresh?.();
      onClose();
      form.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dispatch Order</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Order No */}
            <FormField
              control={form.control}
              name="orderNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter order number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Driver Name */}
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter driver name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Driver Number */}
            <FormField
              control={form.control}
              name="driverNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter driver contact number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time of Dispatch */}
            <FormField
              control={form.control}
              name="dispatchTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of Dispatch</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manager */}
            <FormField
              control={form.control}
              name="manager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter manager name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Dispatch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
