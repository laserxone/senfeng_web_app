"use client";
import * as React from "react";
import {
  ArrowUpDown,
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { AttendanceDetail } from "@/app/[city]/superadmin/attendance/page";
import PageTable from "@/components/app-table-without-pagination";
import moment from "moment";
import Spinner from "../ui/spinner";
import FilterSheet from "./filterSheet";
import { UserAttendanceRecord } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

type AttendanceProps = {
  passingData: UserAttendanceRecord[];
  onFilterReturn: (start: string, end: string) => Promise<void> | void;
  onRefresh?: (startDate: string, endDate: string) => Promise<void> | void;
};

export default function Attendance({
  passingData,
  onFilterReturn,
  onRefresh,
}: AttendanceProps) {

  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserAttendanceRecord[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<UserAttendanceRecord | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setData(passingData);
  }, [passingData]);

  const columns : ColumnDef<UserAttendanceRecord>[] = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <div className="ml-2">
          {row.getValue("date")
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },
    {
      accessorKey: "time_in",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Time In
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <div>
          {row.getValue("time_in")
            ? new Date(
                new Date(row.getValue("time_in")).toISOString()
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      ),
    },
    {
      accessorKey: "time_out",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Time Out
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <div className="ml-2">
          {row.getValue("time_out")
            ? new Date(row.getValue("time_out")).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "note_time_in",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Note Time In
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => <div>{row.getValue("note_time_in")}</div>,
    },

    {
      accessorKey: "note_time_out",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Note Time Out
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => <div>{row.getValue("note_time_out")}</div>,
    },

    {
      accessorKey: "status",
      filterFn: "includesString",
      header: ({ column }: any) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Status
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }: any) => (
        <div
          style={{
            color: row.getValue("status") === "Present" ? "green" : "red",
          }}
        >
          {row.getValue("status")}
        </div>
      ),
    },
  ];

  const tableHeader = [
    {
      value: "note_time_in",
      label: "Note Time In",
    },
    {
      value: "note_time_out",
      label: "Note Time Out",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4 mt-4">
      <div className="flex flex-1">
        <PageTable
          columns={columns}
          data={data}
          tableHeader={tableHeader}
          onRowClick={(val: any) => {
            setSelectedAttendance(val);
            setVisible(true);
          }}
        >
          <div className="flex justify-between">
            <div className="flex gap-4">
              <Button
                onClick={() => setFilterVisible(true)}
                variant="ghost"
                className="p-0 w-8"
              >
                <Filter />
              </Button>

              <Button
                variant="destructive"
                onClick={async () => {
                  setResetLoading(true);
                  const startDate = moment().startOf("month").toISOString();
                  const endDate = moment().endOf("month").toISOString();
                  await onRefresh?.(startDate, endDate);
                  setResetLoading(false);
                }}
              >
                {resetLoading && <Spinner />} Reset
              </Button>
            </div>
          </div>
        </PageTable>
      </div>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val: any) => {
          await onFilterReturn(val.start, val.end);
        }}
      />

      <AttendanceDetail
        detail={selectedAttendance}
        visible={visible}
        onClose={setVisible}
      />
    </div>
  );
}