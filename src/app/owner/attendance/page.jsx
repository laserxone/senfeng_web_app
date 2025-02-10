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
import { useRef, useState } from "react";
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

const data = [
  {
    id: 1,
    user: "John Doe",
    time_in: "08:30 AM",
    time_out: "05:00 PM",
    note_time_in: "Arrived on time",
    note_time_out: "Left on time",
    date: "2024-02-01",
    status: "Present",
  },
  {
    id: 2,
    user: "Jane Smith",
    time_in: "09:15 AM",
    time_out: "04:45 PM",
    note_time_in: "Slightly late",
    note_time_out: "Left early",
    date: "2024-02-02",
    status: "Present",
  },
  {
    id: 3,
    user: "Michael Johnson",
    time_in: "",
    time_out: "",
    note_time_in: "Did not check in",
    note_time_out: "Did not check out",
    date: "2024-02-03",
    status: "Absent",
  },
  {
    id: 4,
    user: "Emily Brown",
    time_in: "08:45 AM",
    time_out: "05:10 PM",
    note_time_in: "On time",
    note_time_out: "Stayed a little longer",
    date: "2024-02-04",
    status: "Present",
  },
  {
    id: 5,
    user: "David Wilson",
    time_in: "",
    time_out: "",
    note_time_in: "No show",
    note_time_out: "No show",
    date: "2024-02-05",
    status: "Absent",
  },
];

export default function Page() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();

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
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
    {
      accessorKey: "user",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user")}</div>,
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
      cell: ({ row }) => <div className="ml-2">{row.getValue("time_in")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("time_out")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("status")}</div>,
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;

        return <AttendanceDetail detail={row.original} />;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const tableHeader = [
    {
      value: "User",
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

  function handleClear() {
    if (pageTableRef.current) {
      pageTableRef.current.handleClear();
      setValue("");
    }
  }

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
        ref={pageTableRef}
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={value.toLowerCase()}
        searchName={value ? `Search ${value}...` : "Select filter first..."}
        tableHeader={tableHeader}
      >
        <div className=" flex justify-between">
          <div className="flex gap-4">
            <Select onValueChange={(val)=>{
              setValue(val)}} value={value}>
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
            onClick={()=> setFilterVisible(true)}
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Filter />
          </Button>
        
          </div>
        </div>
        <Button>Download</Button>
      </PageTable>
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
      />
    </div>
  );
}

const FilterSheet = ({ visible, onClose }) => {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [user, setUser] = useState();
  const users = [
    {
      label: "Abdul Rehman",
      value: "Abdul Rehman",
    },
    {
      label: "Junaid Abid",
      value: "Junaid Abid",
    },
    {
      label: "Adeel Ahsan",
      value: "Adeel Ahsan",
    },
  ];

  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
    user: z.string().min(1, { message: "User is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: null,
      end: null,
      user: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Filter remibursement data</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select User</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {users.map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        console.log(date);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Attendance detail</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="h-[80vh] px-2">
            <div className="px-2"></div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
