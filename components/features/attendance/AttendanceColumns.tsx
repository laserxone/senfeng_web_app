import { UserAttendanceRecord } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { TIMEZONE } from "@/constants/data";
import momentT from "moment-timezone";

export const columns: ColumnDef<UserAttendanceRecord>[] = [
  {
    accessorKey: "date",
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
        {row.getValue("date")
          ? momentT(row.getValue("date")).tz(TIMEZONE).format("YYYY-MM-DD")
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
    accessorKey: "time_in",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Time In
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="ml-2">
        {row.getValue("time_in")
          ? momentT(row.getValue("time_in")).tz(TIMEZONE).format("hh:mm A")
          : ""}
      </div>
    ),
  },
  {
    accessorKey: "time_out",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Time Out
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="ml-2">
        {row.getValue("time_out")
          ? momentT(row.getValue("time_out")).tz(TIMEZONE).format("hh:mm A")
          : ""}
      </div>
    ),
  },

  {
    accessorKey: "note_time_in",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Note Time In
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("note_time_in")}</div>,
  },

  {
    accessorKey: "note_time_out",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Note Time Out
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("note_time_out")}</div>,
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
      <div
        style={{
          color:
            row.getValue("status") === "Present"
              ? "green"
              : row.getValue("status") === "Leave Approved"
                ? "green"
                : "red",
        }}
      >
        {row.getValue("status")}
      </div>
    ),
  },
];
