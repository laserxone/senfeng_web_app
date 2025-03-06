"use client";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronRight,
  Filter,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ConfimationDialog from "@/components/alert-dialog";
import AppCalendar from "@/components/appCalendar";
import PageTable from "@/components/app-table";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import Image from "next/image";
import { MapProvider } from "@/providers/map-provider";
import { useTheme } from "next-themes";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { UserSearch } from "@/components/user-search";
import moment from "moment";

export default function Attendance({ id }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState(null);

  useEffect(() => {
    if (id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData(id, startDate, endDate);
    }
  }, [id]);

  async function fetchData(id, startDate, endDate) {
    axios
      .get(`/api/user/${id}/attendance?start_date=${startDate}&end_date=${endDate}`)
      .then((response) => {
        console.log(response.data);
        if (response.data.length > 0) {
          const apiData = response.data.map((item) => {
            return {
              ...item,
              date: item?.time_in,
              status: item?.time_in ? "Present" : "Absent",
            };
          });
          setData(apiData);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const columns = [
    {
      accessorKey: "date",
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
            ? new Date(row.getValue("date")).toLocaleDateString("en-GB")
            : ""}
        </div>
      ),
    },
    {
      accessorKey: "time_in",
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

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return <AttendanceDetail detail={row.original} />;
      },
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

  function handleClear() {
    if (pageTableRef.current) {
      pageTableRef.current.handleClear();
      setValue("");
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 mt-4">
      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          ref={pageTableRef}
          columns={columns}
          data={
           data
          }
          totalItems={
           data.length
          }
          searchItem={value.toLowerCase()}
          searchName={value ? `Search ${value}...` : "Select filter first..."}
          tableHeader={tableHeader}
        >
          <div className=" flex justify-between">
            <div className="flex gap-4">
              <Select
                onValueChange={(val) => {
                  setValue(val);
                }}
                value={value}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {tableHeader.map((framework) => (
                      <SelectItem
                        key={framework.value}
                        value={framework.value}
                        onClick={() => {
                          setValue(
                            framework.value === value ? "" : framework.value
                          );
                        }}
                      >
                        {framework.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  handleClear();
                }}
              >
                Clear
              </Button>

              <Button
                onClick={() => setFilterVisible(true)}
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Filter />
              </Button>
            </div>
          </div>
          {/* <Button>Download</Button> */}
        </PageTable>
      </div>
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={(val) => {
          fetchData(id, val.start.toISOString(), val.end.toISOString())
        }}
      />
    </div>
  );
}

const FilterSheet = ({ visible, onClose, onReturn }) => {
  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: null,
      end: null,
    },
  });

  function onSubmit(values) {
    onReturn(values);
    onClose();
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Filter data</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <AppCalendar
                      date={field.value}
                      onChange={(date) => field.onChange(date)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <AppCalendar
                      date={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit">
              Submit
            </Button>
          </form>
        </Form>

        {/* <div className="flex flex-col gap-4 py-4 w-full">
          <div className="grid grid-cols-4 items-center gap-4 w-full">
            <Label htmlFor="monthlysalary" className="text-left">
              Select User
            </Label>
            <Select onValueChange={setUser} value={user}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {users.map((eachUser) => (
                    <SelectItem
                      key={eachUser.value}
                      value={eachUser.value}
                      onClick={() => {
                        setValue(
                          eachUser.value === value ? "" : framework.value
                        );
                      }}
                    >
                      {eachUser.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalsalary" className="text-left">
              Start Date
            </Label>
            <AppCalendar date={startDate} onChange={setStartDate} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlysalary" className="text-left">
              End Date
            </Label>
            <AppCalendar date={endDate} onChange={setEndDate} />
          </div>
        </div> */}
        {/* <SheetFooter>
          <SheetClose disabled={!startDate || !endDate} asChild>
            <Button onClick={() => console.log("press")}>Filter</Button>
          </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
};

const AttendanceDetail = ({ detail }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <ChevronRight />
        </Button>
      </DialogTrigger>
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
