"use client";
import { Clock3, Filter, ImageIcon, LogIn, LogOut, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

import PageTable from "@/components/app-table-without-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { columns } from "@/components/users/AttendanceColumns";
import FilterSheet from "@/components/users/filterSheet";
import LeaveApproval from "@/components/users/leaveApproval";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { GetProfileImage } from "@/lib/getProfileImage";
import { AttendanceTableRow, UserAttendanceRecord } from "@/lib/types";
import { MapProvider } from "@/providers/map-provider";
import { GoogleMap, Marker } from "@react-google-maps/api";
import moment from "moment";
import momentT from "moment-timezone";
import { useTheme } from "next-themes";

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<AttendanceTableRow[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<UserAttendanceRecord | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [approveLeave, setApproveLeave] = useState<UserAttendanceRecord | null>(null);
  const { userID } = useUserDetail();

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

  async function fetchData(start: string, end: string, user: number | string | null | undefined = null) {
    return new Promise((res) => {
      axios
        .get(
          `/${userID}/attendance?start_date=${start}&end_date=${end}&user=${user || ""}`,
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item: UserAttendanceRecord) => {
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

  function generateAttendanceData(rawData: AttendanceTableRow[], start: string, end: string) {
    const start_date = moment(start);
    const end_date = moment(end);

    const uniqueUsers = Array.from(
      new Set(rawData.map((item) => item.user_email)),
    );

    const datesInMonth: any[] = [];
    let current = moment(start_date);
    while (current.isSameOrBefore(end_date)) {
      datesInMonth.push(current.format("YYYY-MM-DD"));
      current.add(1, "day");
    }

    const finalData: any[] = [];

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
          user_name: match?.user_name || userMap[user] || null,
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



    finalData.sort((a: AttendanceTableRow, b: AttendanceTableRow) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = moment().format("YYYY-MM-DD");

    const filteredData = finalData.filter((item) => item.date <= today);

    return filteredData;
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading title="Attendace" description="Manage attendance" />
      </div>


      <PageTable
        columns={columns}
        data={data}
        tableWidth="w-[calc(100dvw-30px)]"
        onRowClick={(val, event) => {
          if (val?.time_in) {
            setSelectedAttendance(val);
            setVisible(true);
          }
          if (val?.leave_id) {
            setApproveLeave(val);
          }
        }}
      >
        <div className=" flex justify-between">
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
            >
              {resetLoading && <Spinner />} Reset
            </Button>
          </div>
        </div>
        {/* <Button onClick={handleDownload}>Download</Button> */}
      </PageTable>
      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val?.user);
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
                ? { ...p, leave_status: `Leave ${newStatus}`, status: `Leave ${newStatus}` }
                : p,
            ),
          );
        }}
      />
    </div>
  );
}

export const AttendanceDetail = ({ detail, visible, onClose }: { detail: UserAttendanceRecord | null, visible: boolean, onClose: (val: boolean) => void }) => {
  const entries = [
    {
      key: "time-in",
      title: "Time In",
      time: detail?.time_in,
      image: detail?.image_time_in,
      position: detail?.location_time_in,
      note: detail?.note_time_in,
      icon: LogIn,
      accentClassName: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      key: "time-out",
      title: "Time Out",
      time: detail?.time_out,
      image: detail?.image_time_out,
      position: detail?.location_time_out,
      note: detail?.note_time_out,
      icon: LogOut,
      accentClassName: "bg-blue-50 text-blue-700 ring-blue-100",
    },
  ].filter((item) => item.time);

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className={`${detail?.time_out
          ? "sm:max-w-5xl"
          : "sm:max-w-2xl"
          } max-h-[92dvh] overflow-hidden p-0`}
      >
        <DialogHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold tracking-tight">
                Attendance Detail
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {detail?.user_name || detail?.user_email || "Employee"} attendance activity and location proof.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(92dvh-92px)]">
          <div className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile label="Date" value={detail?.date ? moment(detail.date).format("YYYY-MM-DD") : "N/A"} />
              <InfoTile label="Status" value={detail?.status || "N/A"} />
              <InfoTile label="Email" value={detail?.user_email || "N/A"} />
            </div>

            <div className={`grid gap-4 ${entries.length > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
              {entries.map((entry) => {
                const Icon = entry.icon;

                return (
                  <section key={entry.key} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                    <div className="border-b bg-muted/15 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${entry.accentClassName}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{entry.title}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {entry.time ? moment(entry.time).format("YYYY-MM-DD hh:mm A") : "No time recorded"}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {entry.position ? "GPS available" : "No GPS"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      {entry.note && (
                        <div className="rounded-xl border bg-muted/15 p-3 text-sm text-muted-foreground">
                          {entry.note}
                        </div>
                      )}

                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          Photo Proof
                        </div>
                        {entry.image ? (
                          <RenderImage img={entry.image} />
                        ) : (
                          <EmptyProof label="No image available" />
                        )}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Location
                        </div>
                        {entry.position ? (
                          <MapProvider>
                            <LocationMap position={entry.position} />
                          </MapProvider>
                        ) : (
                          <EmptyProof label="No location available" />
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}

              {entries.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-muted/15 p-10 text-center text-sm text-muted-foreground">
                  No attendance detail available.
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border bg-muted/15 px-3 py-2">
    <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 truncate text-sm font-semibold">{value}</p>
  </div>
);

const EmptyProof = ({ label }: { label: string }) => (
  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed bg-muted/15 text-sm text-muted-foreground">
    {label}
  </div>
);

const RenderImage = ({ img }: { img: string | null }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }
    }

    if (img) {
      fetchImage();
    }
  }, [img]);
  if (!localImage) return null
  return (
    <img
      src={localImage}
      alt="timein-img"
      className="max-h-[360px] w-full rounded-xl border object-cover shadow-sm"
    />
  );
};

const LocationMap = ({ position }: { position: number[] | null }) => {

  if (!position) return null
  const { theme } = useTheme();

  const defaultMapContainerStyle = {
    width: "100%",
    height: "clamp(220px, 42vh, 360px)",
    borderRadius: "12px",
  };

  const defaultMapCenter: google.maps.LatLngLiteral = {
    lat: position[0],
    lng: position[1],

  };
  const defaultMapZoom = 16;

  const [defaultMapOptions, setDefaultMapOptions] = useState({
    zoomControl: true,
    tilt: 0,
    gestureHandling: "auto",
    mapTypeId: "roadmap",
    colorScheme: "DARK",
  });

  useEffect(() => {
    if (theme === "dark") {
      setDefaultMapOptions((prevState) => ({
        ...prevState,
        colorScheme: "DARK",
      }));
    } else {
      setDefaultMapOptions((prevState) => ({
        ...prevState,
        colorScheme: "LIGHT",
      }));
    }
  }, [theme]);

  const RenderMap = useCallback(
    ({ position }: { position: number[] }) => {
      return (
        <GoogleMap
          mapContainerStyle={defaultMapContainerStyle}
          center={defaultMapCenter}
          zoom={defaultMapZoom}
          options={defaultMapOptions}
        >
          <Marker
            position={{
              lat: position[0],
              lng: position[1],
            }}
          />
        </GoogleMap>
      );
    },
    [defaultMapOptions],
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border shadow-sm">
      <RenderMap position={position} />
    </div>
  );
};
