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
  MoreHorizontal,
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heading } from "@/components/ui/heading";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/page-container";
import axios from "axios";
import Link from "next/link";

const data = [
  {
    id: 1,
    company: "Tech Innovators Ltd.",
    owner: "John Doe",
    industry: "Technology",
    group: "Software Development",
    location: "San Francisco, USA",
    machines: "Server Rack, AI Workstations, Cloud Clusters",
  },
  {
    id: 2,
    company: "Green Agro Farms",
    owner: "Alice Smith",
    industry: "Agriculture",
    group: "Organic Farming",
    location: "Texas, USA",
    machines: "Tractors, Irrigation Systems, Grain Harvesters",
  },
  {
    id: 3,
    company: "Steelworks Pvt. Ltd.",
    owner: "Raj Patel",
    industry: "Manufacturing",
    group: "Heavy Machinery",
    location: "Mumbai, India",
    machines: "CNC Machines, Welding Stations, Industrial Robots",
  },
  {
    id: 4,
    company: "MediTech Solutions",
    owner: "Sophia Zhang",
    industry: "Healthcare",
    group: "Medical Equipment",
    location: "Berlin, Germany",
    machines: "MRI Scanners, X-Ray Machines, Surgical Robots",
  },
  {
    id: 5,
    company: "AutoMotive Precision",
    owner: "Carlos Hernandez",
    industry: "Automobile",
    group: "Car Manufacturing",
    location: "Tokyo, Japan",
    machines: "Assembly Line Robots, Engine Testers, Paint Sprayers",
  },
];

const tableHeader = [
  {
    value: "Name",
    label: "Name",
  },
  {
    value: "Owner",
    label: "Owner",
  },
  {
    value: "Industry",
    label: "Industry",
  },
  {
    value: "Group",
    label: "Group",
  },
  {
    value: "Location",
    label: "Location",
  },
  {
    value: "Machines",
    label: "Machines",
  },
  {
    value : "created_at",
    label : "Added"
  }
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
  const router = useRouter();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      axios.get("/api/customer").then((response) => {
        const apiData = response.data
        const temp = apiData.map((item)=>{
          return ({...item, machines : item.machines.join(", ")})
        })
        setData([...temp]);
      });
    }

    fetchData();
  }, []);

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "owner",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("owner")}</div>,
    },

    {
      accessorKey: "industry",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("industry")}</div>,
    },

    {
      accessorKey: "group",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Group
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("group")}</div>,
    },

    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },

    {
      accessorKey: "machines",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Machines
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("machines")}</div>,
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{new Date(row.getValue("created_at")).toLocaleDateString("en-GB")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <Link   href={`customer/detail?id=${currentItem.id}`}>
              <DropdownMenuItem
            
                className="hover:cursor-pointer"
             
              >
                View
              </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => setShowConfirmation(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Heading title="Customers" description="Manage your customers" />
          <AddCustomerDialog />
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
          <div className=" flex justify-between">
            <div className="flex gap-4">
              <Select onValueChange={setValue} value={value}>
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
            </div>
          </div>
        </PageTable>

        <FilterSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
        />

        <ConfimationDialog
          open={showConfirmation}
          title={"Are you sure you want to delete?"}
          description={"Your action will remove branch expense from the system"}
          onPressYes={() => console.log("press yes")}
          onPressCancel={() => setShowConfirmation(false)}
        />
      </div>
    </PageContainer>
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

const AddCustomerDialog = () => {
  const formSchema = z.object({
    company: z.string().min(1, { message: "Company is required." }),
    group: z.string().min(1, { message: "Group is required." }),
    owner: z.string().min(1, { message: "Owner is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    city: z.string().min(1, { message: "City is required." }),
    industry: z.string().min(1, { message: "Industry is required." }),
    number: z.string().min(1, { message: "Number is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      group: "",
      owner: "",
      email: "",
      city: "",
      industry: "",
      number: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  const cities = [
    { label: "New York", value: "New York" },
    { label: "Los Angeles", value: "Los Angeles" },
    { label: "Chicago", value: "Chicago" },
    // Add more cities here
  ];

  const industries = [
    { label: "IT", value: "IT" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Finance", value: "Finance" },
    // Add more industries here
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset();
          }}
        >
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new customer</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="h-[80vh] px-2">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter group name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter owner name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {cities.map((city) => (
                                  <SelectItem
                                    key={city.value}
                                    value={city.value}
                                  >
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
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {industries.map((industry) => (
                                  <SelectItem
                                    key={industry.value}
                                    value={industry.value}
                                  >
                                    {industry.label}
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
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter number" {...field} />
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
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
