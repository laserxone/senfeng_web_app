"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronsRight,
  ChevronsUpDown,
  CircleArrowRight,
  DeleteIcon,
  Frown,
  MoreHorizontal,
  Smile,
  Trash,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { useEffect, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import PageTable from "@/components/app-table";
import ConfimationDialog from "@/components/alert-dialog";
import AppCalendar from "@/components/appCalendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heading } from "@/components/ui/heading";
import axios from "axios";
import Link from "next/link";

const tableHeader = [
  {
    value: "customer_name",
    label: "Client",
  },
  {
    value: "note",
    label: "Feedback",
  },
  {
    value: "status",
    label: "Status",
  },
];

export default function Page() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [openDesignation, setOpenDesignation] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      axios.get("/api/feedback").then((response) => {
        setData(response.data);
      });
    }
    fetchData();
  }, []);

  const columns = [
    {
      accessorKey: "customer_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Link
            className="hover:underline"
            href={`/owner/customer/detail?id=${item.id}`}
          >
            <div className="ml-2">{row.getValue("customer_name")}</div>
          </Link>
        );
      },
    },
    {
      accessorKey: "note",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("note")}</div>,
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
        <div>
          {row.getValue("status") === "Satisfactory" ? (
            <div className="flex items-center gap-2">
              <Smile size={"20px"} color="green" /> {" Satisfactory"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Frown size={"20px"} color="red" /> {" Unsatisfactory"}
            </div>
          )}
        </div>
      ),
    },

    {
      accessorKey: "created_at",
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
          {row.getValue("created_at")
            ? new Date(row.getValue("created_at")).toLocaleDateString("en-GB")
            : ""}
        </div>
      ),
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <Button  variant="ghost" onClick={() => setShowConfirmation(true)}>
          <Trash2
            
            className="h-5 w-5 text-red-500"
          />
          </Button>
        );
      },
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
      <div className="flex items-center justify-between">
        <Heading title="Feedback" description="Manage Feedback from clients" />
        <FeedbackDialog />
      </div>

      <PageTable
        ref={pageTableRef}
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={value.toLowerCase()}
        searchName={value ? `Search ${value}...` : "Select filter first..."}
        tableHeader={tableHeader}
        // filter={true}
        // onFilterClick={() => setFilterVisible(true)}
      >
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Select onValueChange={setValue} value={value}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tableHeader.map((framework) => (
                    <SelectItem key={framework.value} value={framework.value}>
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
          </div>
        </div>
      </PageTable>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove feedback from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />

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

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Select Dates and press filter.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 w-full">
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
        </div>
        <SheetFooter>
          <SheetClose disabled={!startDate || !endDate} asChild>
            <Button onClick={() => console.log("press")}>Filter</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const FeedbackDialog = ({ visible, onClose }) => {
  const formSchema = z.object({
    feedback: z
      .string()
      .min(6, { message: "Feedback must be at least 6 characters." }),
    client: z.string().min(1, { message: "Client name is required." }), // Ensure client is not null
    status: z.string().min(1, { message: "Status is required." }), // Ensure only valid status values
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
      client: "",
      status: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset();
          }}
        >
          Add Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new feedback</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Feedback Input */}
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter feedback" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Select Dropdown */}
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Clients</SelectLabel>
                          <SelectItem value="apple">Apple</SelectItem>
                          <SelectItem value="banana">Banana</SelectItem>
                          <SelectItem value="blueberry">Blueberry</SelectItem>
                          <SelectItem value="grapes">Grapes</SelectItem>
                          <SelectItem value="pineapple">Pineapple</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Satisfactory">
                            Satisfactory
                          </SelectItem>
                          <SelectItem value="Unsatisfactory">
                            Unsatisfactory
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
