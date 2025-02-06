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
import { useRef, useState } from "react";

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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import PageContainer from "@/components/page-container";
import { Heading } from "@/components/ui/heading";

const data = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    designation: "Software Engineer",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    designation: "Product Manager",
  },
  {
    id: 3,
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    designation: "UI/UX Designer",
  },
  {
    id: 4,
    name: "Robert Brown",
    email: "robert.brown@example.com",
    designation: "DevOps Engineer",
  },
  {
    id: 5,
    name: "Emily Davis",
    email: "emily.davis@example.com",
    designation: "Marketing Specialist",
  },
  {
    id: 6,
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    designation: "Data Scientist",
  },
  {
    id: 7,
    name: "Sarah Miller",
    email: "sarah.miller@example.com",
    designation: "HR Manager",
  },
  {
    id: 8,
    name: "David Martinez",
    email: "david.martinez@example.com",
    designation: "Cybersecurity Analyst",
  },
  {
    id: 9,
    name: "Olivia Anderson",
    email: "olivia.anderson@example.com",
    designation: "Business Analyst",
  },
  {
    id: 10,
    name: "William Taylor",
    email: "william.taylor@example.com",
    designation: "Full Stack Developer",
  },

  {
    id: 11,
    name: "Sarah Miller",
    email: "sarah.miller@example.com",
    designation: "HR Manager",
  },
  {
    id: 12,
    name: "David Martinez",
    email: "david.martinez@example.com",
    designation: "Cybersecurity Analyst",
  },
  {
    id: 13,
    name: "Olivia Anderson",
    email: "olivia.anderson@example.com",
    designation: "Business Analyst",
  },
  {
    id: 14,
    name: "William Taylor",
    email: "william.taylor@example.com",
    designation: "Full Stack Developer",
  },
];

const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="ml-2">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "designation",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Designation
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("designation")}</div>,
  },

  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return <TeamDetail detail={row.original} />;
    },
  },
];

const tableHeader = [
  {
    value: "Name",
    label: "Name",
  },
  {
    value: "Email",
    label: "Email",
  },
  {
    value: "Designation",
    label: "Designation",
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

  function handleClear() {
    if (pageTableRef.current) {
      pageTableRef.current.handleClear();
      setValue("");
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Team" description="Manage team members" />
        <AddUserDialog />
      </div>
      <PageTable
        ref={pageTableRef}
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={value.toLowerCase()}
        searchName={value ? `Search ${value}...` : "Select filter first..."}
        tableHeader={tableHeader}
      >
        <div className=" flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={setValue} value={value}>
              <SelectTrigger className="w-[200px] justify-between">
                {value
                  ? tableHeader.find((framework) => framework.value === value)
                      ?.label
                  : "Select filter..."}
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
    </div>
  );
}

const TeamDetail = ({ detail }) => {
  const [totalSalary, setTotalSalary] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [note, setNote] = useState("");
  const [branch, setBranch] = useState(false);

  function handleChange(e) {
    const { value, id } = e.target;
    if (id === "basicsalary") {
      setBasicSalary(value);
    }
    if (id === "totalsalary") {
      setTotalSalary(value);
    }
    if (id === "monthlytarget") {
      setMonthlyTarget(value);
    }
    if (id == "note") {
      setNote(value);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <ChevronsRight />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>User Detail</SheetTitle>
          <SheetDescription>
            Make changes to user profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 w-full">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalsalary" className="text-left">
              Total Salary
            </Label>
            <Input
              type="number"
              id="totalsalary"
              value={totalSalary}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlysalary" className="text-left">
              Basic Salary
            </Label>
            <Input
              type="number"
              id="basicsalary"
              value={basicSalary}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="monthlytarget"
              className="text-left"
              style={{ flexWrap: " nowrap" }}
            >
              Monthly Target
            </Label>
            <Input
              type="number"
              id="monthlytarget"
              value={monthlyTarget}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-left">
              Note
            </Label>
            <Input
              type="text"
              id="note"
              value={note}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="inventory"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Assign Inventory
            </label>
            <Checkbox id="inventory" />
          </div>

          <div className="flex flex-1 gap-4">
            <div className="flex items-center space-x-2">
              <label
                htmlFor="branch"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Assign Branch Expenses
              </label>
              <Checkbox
                id="branch"
                checked={branch}
                onCheckedChange={(e) => setBranch(e)}
              />
            </div>
            {branch && (
              <>
                {" "}
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="write"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Write
                  </label>
                  <Checkbox id="write" />
                </div>
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="delete"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Delete
                  </label>
                  <Checkbox id="delete" />
                </div>
              </>
            )}
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const AddUserDialog = () => {
  const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    designation: z.string().min(1, { message: "Designation missing" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      designation: "",
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  const designations = [
    { label: "Manager", value: "Manager" },
    { label: "Sales", value: "Sales" },
    { label: "Engineer", value: "Engineer" },
    { label: "Dealer", value: "Dealer" },
    {
      label: "Customer Relationship Manager",
      value: "Customer Relationship Manager",
    },
    { label: "Office Boy", value: "Office Boy" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset();
          }}
          
        >
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new user</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
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
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(e) => {
                          const value = e;
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select designation..."
                            className="w-full"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {tableHeader.map((framework) => (
                              <SelectItem
                                key={framework.value}
                                value={framework.value}
                              >
                                {framework.label}
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

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
