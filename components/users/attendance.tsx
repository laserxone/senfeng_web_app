"use client";
import {
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import PageTable from "@/components/app-table";
import { UserAttendanceRecord } from "@/lib/types";
import moment from "moment";
import Spinner from "../ui/spinner";
import { columns } from "./AttendanceColumns";
import FilterSheet from "./filterSheet";
import { AttendanceDetail } from "./teamAttendance";

type AttendanceProps = {
  passingData: UserAttendanceRecord[];
  onFilterReturn: (start: string, end: string) => Promise<void> | void;
  onRefresh?: (startDate: string, endDate: string) => Promise<void> | void;
  height?: string
};

export default function Attendance({
  passingData,
  onFilterReturn,
  onRefresh,
  height
}: AttendanceProps) {

  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserAttendanceRecord[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<UserAttendanceRecord | null>(null);
  const [resetLoading, setResetLoading] = useState(false);


  useEffect(() => {
    setData(passingData);
  }, [passingData]);

  return (
    <div className="flex flex-1 flex-col space-y-4 mt-4">
      <div className="flex flex-1">
        <PageTable
          height={height}
          columns={columns}
          data={data}
          onRowClick={(val: any) => {
            if (val?.time_in) {
              setSelectedAttendance(val);
              setVisible(true);
            }
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