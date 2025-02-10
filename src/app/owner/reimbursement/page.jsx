"use client";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Filter, MoreHorizontal } from "lucide-react";

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
import { useCallback, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import Dropzone from "@/components/dropzone";
import axios from "axios";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import exportToExcel from "@/lib/exportToExcel";
import { Title } from "@radix-ui/react-dialog";

export default function Page() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterValues, setFilterValues] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      axios
        .get("/api/reimbursement")
        .then((response) => {
          console.log(response.data);
          setData(response.data);
          const uniqueUsersMap = new Map();

          response.data.forEach((item) => {
            if (!uniqueUsersMap.has(item.submitted_by)) {
              uniqueUsersMap.set(item.submitted_by, {
                value: item.submitted_by,
                label: item.submitted_by_name,
              });
            }
          });

          const apiDataUsers = Array.from(uniqueUsersMap.values());
          setUsers(apiDataUsers);
        })
        .catch((e) => {
          console.log(e);
        });

      axios.get("/api/users").then((response) => {
        setAllUsers(response.data);
      });
    }

    fetchData();
  }, []);

  const columns = [
    {
      accessorKey: "title",
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
      cell: ({ row }) => <div className="ml-2">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "city",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("city")}</div>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },

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
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => {
                  setImageURL(currentItem);
                  setVisible(true);
                }}
              >
                View
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowConfirmation(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  function handleDownload() {
    const headers = ["Customer", "City", "Description", "Amount", "Date", "Submitted By"];
    let finalData = [];
    if (filterValues) {
      data.filter((item) => {
        const itemDate = new Date(item.date);
        if (
          item.submitted_by == filterValues.user &&
          itemDate >= filterValues.start &&
          itemDate <= filterValues.end
        ) {
          finalData.push(item);
        }
      });
    } else {
      finalData = [...data];
    }
    const formattedData = finalData.map((item) => [
      item.title,
      item?.city,
      item.description,
      item.amount,
      new Date(item.date).toLocaleDateString("en-GB"),
      item.submitted_by_name,
    ]);
    exportToExcel(headers, formattedData, "Reimbursement.xlsx");
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Reimbursement" description="Manage reimbursements" />
        <AddReimbursementDialog users={allUsers} />
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
        data={
          filterValues
            ? data.filter((item) => {
                const itemDate = new Date(item.date);
                if (
                  item.submitted_by == filterValues.user &&
                  itemDate >= filterValues.start &&
                  itemDate <= filterValues.end
                ) {
                  return item;
                }
              })
            : data
        }
        totalItems={
          filterValues
            ? data.filter((item) => {
                const itemDate = new Date(item.date);
                if (
                  item.submitted_by == filterValues.user &&
                  itemDate >= filterValues.start &&
                  itemDate <= filterValues.end
                ) {
                  return item;
                }
              }).length
            : data.length
        }
        searchItem={"title"}
        searchName={"Search bill..."}
        // filter={true}
        // onFilterClick={() => setFilterVisible(true)}
      >
        <Button
          onClick={() => setFilterVisible(true)}
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <Filter />
        </Button>
        {filterValues && (
          <Button
            variant="destructive"
            onClick={() => {
              setFilterValues(null);
            }}
          >
            Clear
          </Button>
        )}
        <Button onClick={handleDownload}>Download</Button>
      </PageTable>
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        users={users}
        onReturn={(val) => {
          setFilterValues(val);
        }}
      />
      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        description={imageURL?.description || null}
        submittedBy={imageURL?.submitted_by_name || null}
      />
    </div>
  );
}

const ImageSheet = ({ visible, onClose, img, submittedBy, description }) => {
  const [imageOpen, setImageOpen] = useState(false);

  function handleClose() {
    if (!imageOpen) {
      onClose();
    }
  }

  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Bill detail</SheetTitle>

          <strong>Submitted by</strong>
          <Label>{submittedBy}</Label>

          <strong>Description</strong>
          <Label>{description}</Label>

          <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
            <img
              onClick={() => setImageOpen(true)}
              className="hover:cursor-pointer"
              src={img}
              alt="reimbursement-img"
              style={{ flex: 1 }}
            />
          </ControlledZoom>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const FilterSheet = ({ visible, onClose, users, onReturn }) => {
  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
    user: z.number({ required_error: "User is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: undefined,
      end: undefined,
      user: null,
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
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.value} value={user.value}>
                            {user.label}
                          </SelectItem>
                        ))}
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
              Filter
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

const AddReimbursementDialog = ({ users }) => {
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required." }),
    description: z.string().min(1, { message: "Description is required." }),
    amount: z
      .number()
      .min(0.01, { message: "Amount must be greater than zero." }),
    date: z.date({ required_error: "Date is required." }),
    user: z.number({ required_error: "User is required." }),
    image: z.string().min(1, { message: "Image is required." }),
    city: z.string().min(1, { message: "City is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      date: "",
      user: null,
      image: "",
      city: ""
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => form.reset()}>Add Reimbursement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Reimbursement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-2">
          <div className="px-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer" {...field} />
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
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={field.value}
                          onChange={(e) => {
                            if (!isNaN(e.target.value)) {
                              field.onChange(Number(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <AppCalendar
                          date={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <FormControl>
                        <Select
                          value={field?.value || ""}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
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
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-1 items-center justify-center">
                          <Dropzone
                            value={field.value}
                            onDrop={(file) => {
                              field.onChange(file);
                            }}
                            title={"Click to upload"}
                            subheading={"or drag and drop"}
                            description={"PNG or JPG"}
                            drag={"Drop the files here..."}
                          />
                        </div>
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
      </DialogContent>
    </Dialog>
  );
};
