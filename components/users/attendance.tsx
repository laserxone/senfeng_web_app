"use client";
import {
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

import PageTable from "@/components/app-table";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import { UserAttendanceRecord } from "@/lib/types";
import moment from "moment";
import Spinner from "../ui/spinner";
import RenderMarkAttendance from "./attendance-marking";
import { columns } from "./AttendanceColumns";
import FilterSheet from "./filter-sheet";
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
  const isMobile = useIsMobile()


  useEffect(() => {
    setData(passingData);
  }, [passingData]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
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

              {isMobile && <MarkAttendance />}
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

const MarkAttendance = () => {

  const [markPressed, setMarkPressed] = useState(false);
  const [locationMark, setLocationMark] = useState<{ coords: { latitude: number; longitude: number } } | null>(null);
  const { userID } = useUserDetail()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (markPressed) {
      getLocation()
    }
  }, [markPressed])

  const getLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationMark({ coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } })

        setLoading(false)
      },
      () => {
        setError('Unable to get your location. Please try again.')
        setLoading(false)
      }
    )
  }

  const handleMarkToggle = useCallback(() => {
    setMarkPressed((prev) => !prev);
  }, []);

  return (
    <>
      <Button onClick={handleMarkToggle}>
        Mark Attendance
      </Button>
      <RenderMarkAttendance loading={loading} error={error} open={markPressed} onClose={handleMarkToggle} fetchData={async () => { }} location={{ latitude: locationMark?.coords.latitude, longitude: locationMark?.coords?.longitude }} userId={userID ?? null} />
    </>
  )
}
