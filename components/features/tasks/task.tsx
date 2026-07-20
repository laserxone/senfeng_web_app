"use client";
import { TIMEZONE } from "@/constants/data";
import { ArrowUpDown, BadgeCheck, CircleDashed, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";


import PageTable from "@/components/shared/tables/app-table";
import Heading from "@/components/ui/heading";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import AddTaskDialog from "@/components/features/tasks/dialogs/add-task-dialog";
import FilterSheet from "@/components/features/users/filter-sheet";
import TaskDetail from "./task-detail";


export default function TaskEmployee({ id }: { id: number | string }) {
  const { userID } = useUserDetail();
  const [data, setData] = useState<TaskProps[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const fetchData = useCallback(async (
    taskUserId: number | string,
    start_date?: string,
    end_date?: string
  ) => {
    try {
      const query = start_date && end_date
        ? `?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`
        : "";
      console.log(query)
      const response = await axios.get(`/${taskUserId}/task${query}`);

      const apiData = response.data.map((item: TaskProps) => ({
        ...item,
        created_at_time: item.created_at,
      }));

      setData(apiData);
    } catch {
      // The existing task list keeps its current data when refresh fails.
    }
  }, []);

  useEffect(() => {
    if (id) {
      const taskId = new URLSearchParams(window.location.search).get("t");
      if (taskId) {
        const start = new URLSearchParams(window.location.search).get("start");
        const end = new URLSearchParams(window.location.search).get("end");
        queueMicrotask(() => void fetchData(id, start ?? undefined, end ?? undefined));
        return;
      }

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
      queueMicrotask(() => void fetchData(id, startDate, endDate));
    }
  }, [fetchData, id]);

  function clearUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    url.searchParams.delete("start");
    url.searchParams.delete("end");
    url.hash = "";
    window.history.replaceState({}, "", url);
  }

  const updateTaskQuery = useCallback((taskId?: string | number) => {
    const url = new URL(window.location.href);

    if (taskId !== undefined) {
      url.searchParams.set("t", String(taskId));
      window.history.pushState({}, "", url);
    } else {
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url);
    }

    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  useEffect(() => {
    const syncTaskFromUrl = () => {
      const taskId = new URLSearchParams(window.location.search).get("t");
      const task = taskId
        ? data.find((item) => String(item.id) === taskId)
        : undefined;

      setSelectedTask(task || null);
      setVisible(Boolean(task));
    };

    syncTaskFromUrl();
    window.addEventListener("popstate", syncTaskFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTaskFromUrl);
    };
  }, [data]);

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

    // {
    //   id: "actions",
    //   enableHiding: false,
    //   cell: ({ row }) => {
    //     return (
    //       <ChevronsRight
    //         onClick={() => {
    //           setSelectedTask(row.original);
    //           setVisible(true);
    //         }}
    //         className="cursor-pointer"
    //       />
    //     );
    //   },
    // },
  ];

  async function handleUpdateMark() {
    const taskId = new URLSearchParams(window.location.search).get("t");
    if (taskId) {
      await fetchData(userID);
      return;
    }

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
    await fetchData(userID, startDate, endDate);
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Task Management" description="Manage tasks" />

        <AddTaskDialog
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

            await fetchData(userID, startDate, endDate);
          }}
          user_id={userID}
        />


      </div>

      <PageTable
        columns={columns}
        data={data}

        onRowClick={(val) => {
          updateTaskQuery(val.id);
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
        onClose={(nextVisible) => {

          setVisible(nextVisible);
          if (!nextVisible) clearUrl();
        }}
        onMark={async () => {
          clearUrl
          await handleUpdateMark()
        }}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          clearUrl();
          await fetchData(id, val.start, val.end);
        }}
      />
    </div>
  );
}
