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
  Loader2,
  MoreHorizontal,
  Plus,
  Star,
  Trash,
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
import { useContext, useEffect, useRef, useState } from "react";

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
import { custom, z } from "zod";
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
import Dropzone from "@/components/dropzone";

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
import { CitiesSearch } from "../cities-search";
import { IndustrySearch } from "../industry-search";
import moment from "moment";
import { UploadImage } from "@/lib/uploadFunction";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/store/context/UserContext";
import AddCustomerDialog from "../addCustomer";

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
    value: "created_at",
    label: "Added",
  },
];

export default function CustomerEmployee({ id, customer_data, onRefresh }) {
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
  const [addCustomer, setAddCustomer] = useState(false);
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      if (customer_data && customer_data.length > 0) {
        const filteredCustomers = customer_data.filter(
          (customer) => !customer.member
        );
        setData(filteredCustomers);
      }
    }
  }, [id, customer_data]);

  async function fetchData() {
    axios.get(`/api/user/${id}/customer`).then((response) => {
      const filteredCustomers = response.data.filter(
        (customer) => !customer.member
      );
      setData(filteredCustomers);
    });
  }

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
      cell: ({ row }) => (
        <div>
          {new Date(row.getValue("created_at")).toLocaleDateString("en-GB")}
        </div>
      ),
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Link
            href={`/${UserState?.value?.data?.base_route}/customer/detail?id=${currentItem.id}`}
          >
            <ChevronsRight />
          </Link>
          // <DropdownMenu>
          //   <DropdownMenuTrigger asChild>
          //     <Button variant="ghost" className="h-8 w-8 p-0">
          //       <MoreHorizontal className="h-4 w-4" />
          //     </Button>
          //   </DropdownMenuTrigger>
          //   <DropdownMenuContent align="end">
          //     <DropdownMenuLabel>Actions</DropdownMenuLabel>
          //     <Link href={`customer/detail?id=${currentItem.id}`}>
          //       <DropdownMenuItem className="hover:cursor-pointer">
          //         View
          //       </DropdownMenuItem>
          //     </Link>
          //     <DropdownMenuItem
          //       className="hover:cursor-pointer"
          //       onClick={() => setShowConfirmation(true)}
          //     >
          //       Delete
          //     </DropdownMenuItem>
          //   </DropdownMenuContent>
          // </DropdownMenu>
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
      <div className="flex flex-1 min-h-[600px]">
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
              <Button onClick={() => setAddCustomer(true)}>Add Customer</Button>
            </div>
          </div>
        </PageTable>
      </div>

      <AddCustomerDialog
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={() => {
          setData([]);
          if (id) {
            fetchData();
          } else {
            onRefresh();
          }
        }}
      />

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
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
