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
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import Link from "next/link";
import { BASE_URL } from "@/constants/data";
import { startHolyLoader } from "holy-loader";
import { useRouter } from "next/navigation";
import AppCalendar from "@/components/appCalendar";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { RequiredStar } from "@/components/RequiredStar";
import moment from "moment";
import { UserContext } from "@/store/context/UserContext";

const columns = [
  {
    accessorKey: "name",
    filterFn: "includesString",
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
    filterFn: "includesString",
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
    accessorKey: "joining_date",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joining Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        {row.getValue("joining_date")
          ? moment(row.getValue("joining_date")).format("YYYY-MM-DD")
          : null}
      </div>
    ),
  },

  {
    accessorKey: "email",
    filterFn: "includesString",
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
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { state: UserState } = useContext(UserContext);
  const { toast } = useToast();

  useEffect(() => {
    if (UserState.value.data?.id) fetchData();
  }, [UserState]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`${BASE_URL}/user`)
        .then((response) => {
          setData(response.data);
        })
        .finally(() => {
          resolve(true);
          setLoading(false);
        });
    });
  }

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
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Add User
        </Button>
      </div>
      <PageTable
        loading={loading}
        ref={pageTableRef}
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={value.toLowerCase()}
        searchName={value ? `Search ${value}...` : "Select filter first..."}
        tableHeader={tableHeader}
        onRowClick={(val) => {
          if (val.id) {
            startHolyLoader();
            router.push(`/owner/team/detail?id=${val.id}`);
          }
        }}
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

      <AddUserDialog
        visible={open}
        onClose={setOpen}
        onReturn={(newUser) => {
          let temp = [...data];
          temp.push(newUser);
          temp.sort((a, b) => {
            const nameA = a.name ? a.name.toLowerCase() : "";
            const nameB = b.name ? b.name.toLowerCase() : "";

            if (!nameA && nameB) return 1;
            if (nameA && !nameB) return -1;

            return nameA.localeCompare(nameB);
          });
          setData([...temp]);
          toast({ title: "New user added" });
        }}
      />
    </div>
  );
}


const AddUserDialog = ({ visible, onClose, onReturn }) => {
  const [dataLoading, setDataLoading] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    designation: z.string().min(1, { message: "Designation missing" }),
    joining_date: z.date({ required_error: "Joining date is required." }),
    note: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      designation: "",
      joining_date: "",
      note: "",
    },
  });

  function onSubmit(values) {
    setDataLoading(true);

    axios
      .post(`${BASE_URL}/user`, { ...values, name: values.name.toUpperCase() })
      .then((response) => {
        onReturn(response.data);
        handleClose(false);
      })
      .finally(() => {
        setDataLoading(false);
      });
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
    {
      label: "Customer Relationship Manager (After Sales)",
      value: "Customer Relationship Manager (After Sales)",
    },
    { label: "Office Boy", value: "Office Boy" },
  ];

  async function handleClose(val) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
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
                    <FormLabel>
                      Name <RequiredStar />
                    </FormLabel>
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
                    <FormLabel>
                      Email <RequiredStar />
                    </FormLabel>
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
                    <FormLabel>
                      Designation <RequiredStar />
                    </FormLabel>
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
                            {designations.map((framework) => (
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

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter personal note" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joining_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Joining Date <RequiredStar />
                    </FormLabel>
                    <AppCalendar date={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit">
                {dataLoading && <Spinner />} Save
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
