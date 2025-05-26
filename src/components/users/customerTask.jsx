"use client";
import { TIMEZONE } from "@/constants/data";
import {
  ArrowUpDown,
  BadgeCheck,
  CircleDashed,
  Filter,
  Loader2,
} from "lucide-react";

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
import { Heading } from "@/components/ui/heading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import moment from "moment";
import momentT from "moment-timezone";
import FilterSheet from "./filterSheet";
import { ScrollArea } from "../ui/scroll-area";

const getSchema = (isClientSelected) =>
  z.object({
    radio: z.enum(["office", "client"]),
    task: z.string().min(5, { message: "Task must be at least 5 characters." }),
    client: isClientSelected
      ? z.number({ required_error: "Client is required." }) // Required when "client" is selected
      : z.number().optional().nullable(), // Ensure optional & nullable when "office" is selected
  });

export default function CustomerTask({
  id,
  height = "min-h-[calc(100dvh-300px)]",
  onFetchData,
  data,
}) {
  const { state: UserState } = useContext(UserContext);

  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});

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
      accessorKey: "user_name",
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
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
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

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className={`flex flex-1 ${height}`}>
        <PageTable
          columns={columns}
          data={data}
          totalItems={data.length}
          searchItem={"task_name"}
          searchName={"Search task..."}
          onRowClick={(val) => {
            setSelectedTask(val);
            setVisible(true);
          }}
        ></PageTable>
      </div>
      <TaskDetail
        user_id={id}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onDelete={() => {
          async () => await onFetchData();
        }}
        onMark={async () => await onFetchData()}
      />
    </div>
  );
}

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
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Task Detail</SheetTitle>
          <SheetDescription>Check task details</SheetDescription>
          <div className="w-full flex justify-end">
            <Button onClick={handleDelete}>
              {deleteLoading && <Loader2 className="animate-spin" />} Delete
            </Button>
          </div>
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
            </div>

            <div className="flex flex-col gap-4">
              <Label htmlFor="status" className="text-sm text-gray-800">
                {detail?.status}
              </Label>
              <Label htmlFor="assign_date" className="text-sm text-gray-800">
                {detail?.created_at
                  ? moment(detail?.created_at).format("YYYY-MM-DD")
                  : ""}
              </Label>
              {/* <Label htmlFor="assigned_to" className="text-sm text-gray-800">
                {detail?.assigned_to_name}
              </Label>
              <Label htmlFor="assignee_email" className="text-sm text-gray-800">
                {detail?.assigned_to_email}
              </Label> */}
              <Label htmlFor="assigned_task" className="text-sm text-gray-800">
                {detail?.task_name}
              </Label>
            </div>
          </div>
        </div>

        <SheetFooter className={"mt-4"}>
          <Button
            onClick={() => {
              handleUpdateStatus({
                ...detail,
                status:
                  detail?.status === "Completed" ? "Pending" : "Completed",
              });
            }}
          >
            {loading && <Loader2 className="animate-spin" />}
            {detail?.status === "Completed"
              ? "Mark as Pending"
              : "Mark as Completed"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
