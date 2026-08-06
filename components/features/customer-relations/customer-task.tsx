"use client";
import { ArrowUpDown, BadgeCheck, CircleDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { z } from "zod";

import PageTable from "@/components/shared/tables/app-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import axios from "@/lib/axios";
import moment from "moment";
import Spinner from "@/components/ui/spinner";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { CustomerTaskProps } from "@/lib/types";

type CustomerTask = {
  id: any;
  base?: any;
  customer_id?: any;
  height?: string;
  onFetchData: any;
  data: any;
};
type TaskDetailProps = {
  detail: any;
  visible: boolean;
  onClose: any;
  onDelete: () => void | Promise<void>;
  onMark: () => void | Promise<void>;
  user_id: any;
  base?: any;
};
export default function CustomerTask({
  id,
  height = "min-h-[calc(100dvh-300px)]",
  onFetchData,
  data,
}: CustomerTask) {
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const columns: ColumnDef<CustomerTaskProps>[] = [
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
        <div className="ml-2 flex items-center gap-1">
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
      <div className="flex flex-1">
        <PageTable
          tableWidth="w-calc[100vw-60px]"
          columns={columns}
          data={data}
          onRowClick={(val, e) => {
            setSelectedTask(val);
            setVisible(true);
          }}
        />
      </div>
      <TaskDetail
        user_id={id}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onDelete={onFetchData}
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
  base,
}: TaskDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleUpdateStatus(values: {
    id: number | string;
    status: string;
  }) {
    setLoading(true);
    axios
      .put(`/${user_id}/task/${detail.id}`, {
        id: values.id,
        status: values.status,
      })
      .then(() => {
        toast.success("Status updated");
        onClose(false);
      })

      .finally(() => {
        setLoading(false);
        onMark();
      });
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
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
        <div className="mt-2 w-full rounded-lg bg-white px-4 py-6 shadow-lg">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
