"use client";
import { ArrowUpDown, BadgeCheck, CircleDashed, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { z } from "zod";

import PageTable from "@/components/app-table-without-pagination";
import Heading from "@/components/ui/heading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FilterSheet from "@/components/users/filterSheet";
import { TIMEZONE } from "@/constants/data";


import TaskDetail from "@/components/users/taskDetail";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import moment from "moment";
import momentT from "moment-timezone";
import { AddTaskTeam } from "@/components/users/addTaskTeam";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<TaskProps>[] = [
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



export default function Page() {
  const { userID } = useUserDetail();
  const [data, setData] = useState<TaskProps[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | null>(null);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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
      fetchData("", startDate, endDate);
    }
  }, [userID]);

  async function fetchData(user: number | null | string, start_date: string, end_date: string) {
    setDataLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/task?start_date=${start_date}&end_date=${end_date}&user=${user}`
        )
        .then((response) => {
          const apiData = response.data.map((item: TaskProps) => {
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
    fetchData("", startDate, endDate);
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Task Management" description="Manage team tasks" />

        <Button
          onClick={() => {
            setAddTaskVisible(true);
          }}
        >
          Add Task
        </Button>

        <AddTaskTeam
          onRefresh={async () => {
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

            fetchData("", startDate, endDate);
          }}
          visible={addTaskVisible}
          onClose={setAddTaskVisible}
          assigned_by={userID}
        />
      </div>

      <PageTable
        loading={dataLoading}
        columns={columns}
        data={data}
        onRowClick={(val, e) => {
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
      </PageTable>

      <TaskDetail
        user_id={userID}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onMark={() => handleUpdateMark()}
      />

      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.user || "", val.start, val.end);
        }}
      />
    </div>
  );
}


