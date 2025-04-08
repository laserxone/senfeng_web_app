"use client";
import {
  ArrowUpDown,
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import FilterSheet from "@/components/users/filterSheet";
import { BASE_URL } from "@/constants/data";
import { MapProvider } from "@/providers/map-provider";
import { UserContext } from "@/store/context/UserContext";
import { GoogleMap, Marker } from "@react-google-maps/api";
import axios from "axios";
import moment from "moment";
import { useTheme } from "next-themes";

export default function Page() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      const start_date = moment().startOf("month").toISOString();
      const end_date = moment().endOf("month").toISOString();
      fetchData(start_date, end_date);
    }
  }, [UserState?.value?.data]);

  async function fetchData(start, end, user = null) {
    return new Promise((res, rej) => {
      axios
        .get(
          `${BASE_URL}/attendance?start_date=${start}&end_date=${end}&user=${
            user || ""
          }`
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item) => {
              return {
                ...item,
                date: item?.time_in,
                status: item?.time_in ? "Present" : "Absent",
              };
            });
            setData(apiData);
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
        totalItems={data.length}
        tableHeader={tableHeader}
        onRowClick={(val) => {
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
                const startDate = moment().startOf("month").toISOString();
                const endDate = moment().endOf("month").toISOString();
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
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(
            val.start.toISOString(),
            val.end.toISOString(),
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
                  <img
                    src={detail.image_time_in}
                    alt="timein-img"
                    className="w-full object-cover rounded-lg"
                  />
                  <MapProvider>
                    <LocationMap position={detail.location_time_in} />
                  </MapProvider>
                </div>
              )}

              {detail?.time_out && (
                <div className="flex-1 flex flex-col gap-4 sm:ml-4">
                  <Label>Time Out</Label>
                  <img
                    src={detail.image_time_out}
                    alt="timeout-img"
                    className="w-full object-cover rounded-lg"
                  />
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
