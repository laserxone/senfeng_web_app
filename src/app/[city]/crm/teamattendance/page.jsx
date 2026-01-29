"use client";
import { ArrowUpDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table-without-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import FilterSheet from "@/components/users/filterSheet";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { GetProfileImage } from "@/lib/getProfileImage";
import { MapProvider } from "@/providers/map-provider";
import { GoogleMap, Marker } from "@react-google-maps/api";
import moment from "moment";
import momentT from "moment-timezone";
import { useTheme } from "next-themes";

export default function Page() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const {userID} = useUserDetail()

  useEffect(() => {
    if (userID) {
      const start_date = momentT.tz(TIMEZONE).startOf("month").startOf("day").utc().toISOString();
      const end_date = momentT.tz(TIMEZONE).endOf("month").endOf("day").utc().toISOString();
      fetchData(start_date, end_date);
    }
  }, [userID]);

  async function fetchData(start, end, user = null) {
    return new Promise((res, ) => {
      axios
        .get(
          `/${userID}/attendance?team=true&start_date=${start}&end_date=${end}&user=${user || ""}`
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item) => {
              let status = "Absent";

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
                date: item?.time_in,
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

  function generateAttendanceData(rawData, start, end) {
    const start_date = moment(start);
    const end_date = moment(end);

    const uniqueUsers = Array.from(
      new Set(rawData.map((item) => item.user_email))
    );

    const datesInMonth = [];
    let current = moment(start_date);
    while (current.isSameOrBefore(end_date)) {
      datesInMonth.push(current.format("YYYY-MM-DD"));
      current.add(1, "day");
    }

    const finalData = [];

    const userMap = {};
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
            moment(item.date).format("YYYY-MM-DD") === date
        );

        finalData.push({
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

    finalData.sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = moment().format("YYYY-MM-DD");

    const filteredData = finalData.filter((item) => item.date <= today);

    return filteredData;
  }

  const columns = [
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
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
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
            ? moment(new Date(row.getValue("time_in"))).format("hh:mm A")
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
      value: "user_name",
      label: "User",
    },
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
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading title="Attendace" description="Manage attendance" />
      </div>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
      <PageTable
        columns={columns}
        data={data}
        tableHeader={tableHeader}
        onRowClick={(val, event) => {
          setSelectedAttendance(val);
          setVisible(true);
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
                const startDate = momentT.tz(TIMEZONE).startOf("month").startOf("day").utc().toISOString();
                const endDate = momentT.tz(TIMEZONE).endOf("month").endOf("day").utc().toISOString();
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
          await fetchData(
            val.start,
            val.end,
            val.user
          );
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

export const AttendanceDetail = ({ detail, visible, onClose }) => {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className={`${
          detail?.time_out
            ? " sm:max-w-4xl lg:max-w-5xl"
            : "sm:max-w-2xl lg:max-w-xl"
        } `}
      >
        <DialogHeader>
          <DialogTitle>Attendance detail</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="h-[80vh] px-2">
            <div className="px-2 flex flex-col gap-4 sm:flex-row">
              {detail?.time_in && (
                <div className="flex-1 flex flex-col gap-4">
                  <Label>Time In</Label>
                  {detail?.image_time_in ? (
                    <RenderImage img={detail?.image_time_in} />
                  ) : (
                    <div>N/A</div>
                  )}

                  <MapProvider>
                    <LocationMap position={detail.location_time_in} />
                  </MapProvider>
                </div>
              )}

              {detail?.time_out && (
                <div className="flex-1 flex flex-col gap-4 sm:ml-4">
                  <Label>Time Out</Label>
                  {detail?.image_time_out ? (
                    <RenderImage img={detail?.image_time_out} />
                  ) : (
                    <div>N/A</div>
                  )}
                  <MapProvider>
                    <LocationMap position={detail.location_time_out} />
                  </MapProvider>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RenderImage = ({ img }) => {
  const [localImage, setLocalImage] = useState(null);

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

  return (
    <img
      src={localImage}
      alt="timein-img"
      className="w-full object-cover rounded-lg"
    />
  );
};

const LocationMap = ({ position }) => {
  const { theme } = useTheme();

  const defaultMapContainerStyle = {
    width: "100%",
    height: "80vh",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = {
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
    ({ position }) => {
      return (
        <GoogleMap
          mapContainerStyle={defaultMapContainerStyle}
          center={defaultMapCenter}
          zoom={defaultMapZoom}
          options={defaultMapOptions}
        >
          <Marker
            position={{
              lat: parseFloat(position[0]),
              lng: parseFloat(position[1]),
            }}
          />
        </GoogleMap>
      );
    },
    [defaultMapOptions]
  );

  return (
    <div className="w-full">
      <RenderMap position={position} />
    </div>
  );
};
