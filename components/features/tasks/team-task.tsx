"use client";
import AddTaskDialog from "@/components/features/tasks/dialogs/add-task-dialog";
import FilterSheet from "@/components/features/users/filter-sheet";
import PageTable from "@/components/shared/tables/app-table";
import { Button } from "@/components/ui/button";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, BadgeCheck, CircleDashed } from "lucide-react";
import moment from "moment";
import momentT from "moment-timezone";
import { useEffect, useState } from "react";
import TaskDetail from "./task-detail";

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
    accessorKey: "assigned_by_name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned By
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("assigned_by_name")}</div>,
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

export default function TeamTask({
  height,
  onUpdateTotal,
}: {
  height?: string;
  onUpdateTotal?: (item: number) => void;
}) {
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
      fetchData(startDate, endDate);
    }
  }, [userID]);

  async function fetchData(start_date: string, end_date: string) {
    setDataLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/task?start_date=${start_date}&end_date=${end_date}&by=true`,
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

  useEffect(() => {
    onUpdateTotal?.(data.length);
  }, [data]);

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
    fetchData(startDate, endDate);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1">
        <PageTable
          height={height}
          loading={dataLoading}
          columns={columns}
          data={data}
          onRowClick={(val, e) => {
            setSelectedTask(val);
            setVisible(true);
          }}
          filter
          onFilterPress={() => setFilterVisible(true)}
        >
          {userID && (
            <AddTaskDialog
              mode="team"
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

                fetchData(startDate, endDate);
              }}
              user_id={userID}
            />
          )}
        </PageTable>
      </div>

      <TaskDetail
        user_id={userID}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onMark={() => handleUpdateMark()}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end);
        }}
      />
    </div>
  );
}
