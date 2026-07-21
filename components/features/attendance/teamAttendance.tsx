"use client";
import { CalendarDays, Clock3, ImageIcon, LogIn, LogOut, MapPin, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ElementType, useEffect, useMemo, useState } from "react";

import LeaveApproval from "@/components/features/employee-finance/leave-approval";
import FilterSheet from "@/components/features/users/filter-sheet";
import PageTable from "@/components/shared/tables/app-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserAttendanceRecord } from "@/lib/types";
import { MapProvider } from "@/providers/map-provider";
import { GoogleMap, Marker } from "@react-google-maps/api";
import moment from "moment";
import momentT from "moment-timezone";
import { useTheme } from "next-themes";
import { columns } from "./AttendanceColumns";
import RenderMarkAttendance from "./attendance-marking";

export default function TeamAttendance() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserAttendanceRecord[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<UserAttendanceRecord | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const { userID, team_attendance_marking } = useUserDetail();
  const [approveLeave, setApproveLeave] = useState<UserAttendanceRecord | null>(null);
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (userID) {
      const start_date = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const end_date = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      fetchData(start_date, end_date);
    }
  }, [userID]);

  async function fetchData(start: string, end: string, user: string | undefined | null | number = null) {
    return new Promise((res) => {
      axios
        .get(
          `/${userID}/attendance?team=true&start_date=${start}&end_date=${end}&user=${user || ""}`,
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item: any) => {
              let status = item?.leave_status
                ? `Leave ${item?.leave_status}`
                : "Absent";

              if (item?.time_in) {
                const checkInTime = new Date(item.time_in);
                const threshold = new Date(item.time_in);
                threshold.setHours(10, 10, 0, 0);

                if (checkInTime > threshold) {
                  status = "Late";
                } else {
                  status = "Present";
                }
              }

              return {
                ...item,
                date: item?.time_in || item?.leave_date,
                status,
              };
            });
            const convertedData = generateAttendanceData(apiData, start, end);
            setData(convertedData);
          } else {
            setData([]);
          }
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          res(true);
        });
    });
  }

  function generateAttendanceData(rawData: UserAttendanceRecord[], start: string, end: string) {
    const start_date = moment(start);
    const end_date = moment(end);

    const uniqueUsers = Array.from(
      new Set(rawData.map((item) => item.user_email)),
    );

    const datesInMonth: string[] = [];
    let current = moment(start_date);
    while (current.isSameOrBefore(end_date)) {
      datesInMonth.push(current.format("YYYY-MM-DD"));
      current.add(1, "day");
    }

    const finalData: any = [];

    const userMap: any = {};
    rawData.forEach((item) => {
      if (!userMap[item.user_email]) {
        userMap[item.user_email] = item.user_name;
      }
    });

    uniqueUsers.forEach((user) => {
      datesInMonth.forEach((date) => {
        const match = rawData.find(
          (item) =>
            item.user_email === user &&
            moment(item.date).format("YYYY-MM-DD") === date,
        );

        finalData.push({
          ...match,
          date: date,
          user_email: user,
          user_name: match?.user_name || userMap[user as string] || null,
          status: match?.status || "Absent",
          time_in: match?.time_in || null,
          time_out: match?.time_out || null,
          note_time_in: match?.note_time_in || null,
          note_time_out: match?.note_time_out || null,
          image_time_in: match?.image_time_in || null,
          image_time_out: match?.image_time_out || null,
          location_time_in: match?.location_time_in || null,
          location_time_out: match?.location_time_out || null,
        });
      });
    });

    finalData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = moment().format("YYYY-MM-DD");

    const filteredData = finalData.filter((item: any) => item.date <= today);

    return filteredData;
  }



  return (
    <div className="flex flex-1 flex-col space-y-4">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Clock3 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Attendance</h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">Team workspace</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Review and manage team attendance records.</p>
            </div>
          </div>
          {team_attendance_marking && <Button onClick={() => setOpen(true)}>Add Attendance</Button>}
        </div>
        <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
          <AttendanceMetric icon={<UsersRound className="size-4 text-violet-600 dark:text-violet-400" />} label="Records" value={data.length} />
          <AttendanceMetric icon={<LogIn className="size-4 text-emerald-600 dark:text-emerald-400" />} label="Checked in" value={data.filter((item) => item.time_in).length} />
          <AttendanceMetric icon={<CalendarDays className="size-4 text-amber-600 dark:text-amber-400" />} label="Leaves" value={data.filter((item) => item.leave_id).length} />
        </div>
      </section>


      <PageTable
        columns={columns}
        data={data}
        onRowClick={(val, event) => {
          if (val?.time_in) {
            setSelectedAttendance(val);
            setVisible(true);
          }
          if (val?.leave_id) {
            setApproveLeave(val);
          }
        }}
        onFilterPress={() => setFilterVisible(true)}
        reset
        resetLoading={resetLoading}
        onResetPress={async () => {
          setResetLoading(true);
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
          await fetchData(startDate, endDate);
          setResetLoading(false);
        }}
      />
      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />

      <AttendanceDetail
        detail={selectedAttendance}
        visible={visible}
        onClose={setVisible}
      />

      <LeaveApproval
        data={approveLeave}
        visible={!!approveLeave}
        onClose={() => setApproveLeave(null)}
        onRefresh={(newStatus) => {
          setData((prevState) =>
            prevState.map((p) =>
              p?.leave_id === approveLeave?.leave_id
                ? {
                  ...p,
                  leave_status: `Leave ${newStatus}`,
                  status: `Leave ${newStatus}`,
                }
                : p,
            ),
          );
        }}
      />

      <RenderMarkAttendance open={open} onClose={() => setOpen(false)} fetchData={async () => {
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
        await fetchData(startDate, endDate);
      }} />
    </div>
  );
}

function AttendanceMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:border-t-0 sm:px-5">{icon}<div className="flex items-baseline gap-2"><span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span><span className="text-sm font-bold">{value}</span></div></div>;
}

export const AttendanceDetail = ({
  detail,
  visible,
  onClose,
}: {
  detail: UserAttendanceRecord | null
  visible: boolean
  onClose: (val: boolean) => void
}) => {
  const entries = [
    {
      key: "time-in",
      title: "Time In",
      time: detail?.time_in,
      image: detail?.image_time_in,
      position: detail?.location_time_in,
      note: detail?.note_time_in,
      icon: LogIn,
      accentClassName:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
    },
    {
      key: "time-out",
      title: "Time Out",
      time: detail?.time_out,
      image: detail?.image_time_out,
      position: detail?.location_time_out,
      note: detail?.note_time_out,
      icon: LogOut,
      accentClassName:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
    },
  ].filter((item) => item.time)

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className={`
    w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]
    max-h-[95dvh] overflow-hidden rounded-xl border p-0
    sm:w-full sm:rounded-2xl
    ${entries.length > 1 ? "lg:max-w-5xl xl:max-w-6xl" : "lg:max-w-4xl"}
  `}>
        <DialogHeader className="border-b bg-slate-50 px-3 py-3 dark:bg-slate-950 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900 sm:size-10">
              <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="break-words text-base font-bold tracking-tight sm:text-lg">
                Attendance Detail
              </DialogTitle>
              <p className="mt-0.5 break-words text-xs font-medium text-muted-foreground sm:text-sm">
                {detail?.user_name || detail?.user_email || "Employee"} attendance activity and proof.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(92dvh-76px)]">
          <div className="space-y-3 p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoTile
                label="Date"
                value={detail?.date ? moment(detail.date).format("YYYY-MM-DD") : "N/A"}
              />
              <InfoTile label="Status" value={detail?.status || "N/A"} />
              <InfoTile label="Email" value={detail?.user_email || "N/A"} />
            </div>

            <div className={`grid gap-3 ${entries.length > 1 ? "xl:grid-cols-2" : "grid-cols-1"}`}>
              {entries.map((entry) => {
                const Icon = entry.icon

                return (
                  <section
                    key={entry.key}
                    className="overflow-hidden rounded-2xl border bg-background  flex-wrap"
                  >
                    <div className="border-b bg-slate-50/80 px-3 py-3 dark:bg-slate-900/70 sm:px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`grid size-9 shrink-0 place-items-center rounded-xl border ${entry.accentClassName}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {entry.title}
                            </h3>
                            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                              {entry.time
                                ? moment(entry.time).format("YYYY-MM-DD hh:mm A")
                                : "No time recorded"}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${entry.position
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                            }`}
                        >
                          {entry.position ? "GPS available" : "No GPS"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 p-3 sm:p-4">
                      {entry.note && (
                        <div className="rounded-xl border bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Note
                          </p>
                          <p className="whitespace-pre-wrap break-words">{entry.note}</p>
                        </div>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <ProofBlock title="Photo Proof" icon={ImageIcon}>
                          {entry.image ? (
                            <RenderImage img={entry.image} />
                          ) : (
                            <EmptyProof label="No image available" />
                          )}
                        </ProofBlock>

                        <ProofBlock title="Location" icon={MapPin}>
                          {entry.position ? (
                            <MapProvider>
                              <LocationMap position={entry.position} />
                            </MapProvider>
                          ) : (
                            <EmptyProof label="No location available" />
                          )}
                        </ProofBlock>
                      </div>
                    </div>
                  </section>
                )
              })}

              {entries.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground dark:bg-slate-900">
                  No attendance detail available.
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const ProofBlock = ({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: ElementType
  children: React.ReactNode
}) => (
  <div className="min-w-0">
    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
      <Icon className="h-4 w-4 text-slate-400" />
      {title}
    </div>

    <div className="overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-900">
      {children}
    </div>
  </div>
)



const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0 rounded-xl border bg-white px-3 py-2 dark:bg-slate-950">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
      {value}
    </p>
  </div>
)

const EmptyProof = ({ label }: { label: string }) => (
  <div className="grid min-h-[180px] place-items-center px-3 text-center text-xs font-medium text-muted-foreground">
    {label}
  </div>
)

const RenderImage = ({ img }: { img: string | null }) => {
  const [localImage, setLocalImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img)
      } else {
        const imgResult = await GetProfileImage(img)
        setLocalImage(imgResult)
      }
    }

    if (img) fetchImage()
  }, [img])

  if (!localImage) {
    return (
      <div className="grid min-h-[180px] place-items-center text-xs text-muted-foreground">
        Loading image...
      </div>
    )
  }

  return (
    <img
      src={localImage}
      alt="attendance-proof"
      className="h-[clamp(180px,32vh,280px)] w-full object-contain"
    />
  )
}

const LocationMap = ({ position }: { position: number[] | null }) => {
  const { theme } = useTheme()

  const defaultMapOptions = useMemo(
    () => ({
      zoomControl: true,
      tilt: 0,
      gestureHandling: "auto",
      mapTypeId: "roadmap",
      colorScheme: theme === "dark" ? "DARK" : "LIGHT",
    }),
    [theme]
  )

  if (!position) return null

  const defaultMapCenter: google.maps.LatLngLiteral = {
    lat: position[0],
    lng: position[1],
  }

  return (
    <div className="h-[clamp(180px,32vh,280px)] w-full overflow-hidden">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "100%",
        }}
        center={defaultMapCenter}
        zoom={16}
        options={defaultMapOptions}
      >
        <Marker
          position={{
            lat: position[0],
            lng: position[1],
          }}
        />
      </GoogleMap>
    </div>
  )
}
