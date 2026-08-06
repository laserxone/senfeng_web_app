"use client";
import { TIMEZONE } from "@/constants/data";
import { ArrowUpDown, BadgeCheck, CircleDashed, ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

import PageTable from "@/components/shared/tables/app-table";

import AddTaskDialog from "@/components/features/tasks/dialogs/add-task-dialog";
import FilterSheet from "@/components/features/users/filter-sheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import TaskDetail from "./task-detail";

export default function TaskEmployee({ id }: { id: number | string }) {
  const { userID } = useUserDetail();
  const [data, setData] = useState<TaskProps[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const fetchData = useCallback(
    async (
      taskUserId: number | string,
      start_date?: string,
      end_date?: string,
    ) => {
      try {
        const query =
          start_date && end_date
            ? `?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`
            : "";
        console.log(query);
        const response = await axios.get(`/${taskUserId}/task${query}`);

        const apiData = response.data.map((item: TaskProps) => ({
          ...item,
          created_at_time: item.created_at,
        }));

        setData(apiData);
      } catch {
        // The existing task list keeps its current data when refresh fails.
      }
    },
    [],
  );

  useEffect(() => {
    if (id) {
      const taskId = new URLSearchParams(window.location.search).get("t");
      if (taskId) {
        const start = new URLSearchParams(window.location.search).get("start");
        const end = new URLSearchParams(window.location.search).get("end");
        queueMicrotask(
          () => void fetchData(id, start ?? undefined, end ?? undefined),
        );
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
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ListTodo className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Task Management
                </h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">
                  Task workspace
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review and manage assigned tasks.
              </p>
            </div>
          </div>
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
        <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
          <Metric
            icon={
              <ListTodo className="size-4 text-violet-600 dark:text-violet-400" />
            }
            label="Total tasks"
            value={data.length}
          />
          <Metric
            icon={
              <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            }
            label="Completed"
            value={
              data.filter((task) => task.status?.toLowerCase() === "completed")
                .length
            }
          />
          <Metric
            icon={
              <CircleDashed className="size-4 text-amber-600 dark:text-amber-400" />
            }
            label="Pending"
            value={
              data.filter((task) => task.status?.toLowerCase() !== "completed")
                .length
            }
          />
        </div>
      </section>

      <PageTable
        columns={columns}
        data={data}
        onRowClick={(val) => {
          updateTaskQuery(val.id);
        }}
        filter
        onFilterPress={() => setFilterVisible(true)}
      >
        /
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
          clearUrl;
          await handleUpdateMark();
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:border-t-0 sm:px-5">
      {icon}
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}
