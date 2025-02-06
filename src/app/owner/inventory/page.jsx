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
  CircleDollarSign,
  Filter,
  MoreHorizontal,
  PackageMinus,
  PackageSearch,
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
import { useEffect, useRef, useState } from "react";
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
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const tableHeader = [
  {
    value: "Name",
    label: "Name",
  },
  {
    value: "Category",
    label: "Category",
  },
  {
    value: "Gift",
    label: "Gift",
  },
  {
    value: "qty",
    label: "Quantity",
  },
];

export default function Page() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [stock, setStock] = useState([]);
  const [value, setValue] = useState("");
  const pageTableRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    axios
      .get("https://senfeng-web.vercel.app/api/pos")
      .then((response) => {
        if (response.data?.stock) {
          setStock(response.data.stock);
        }
      })
      .catch((e) => {
        console.log(e);
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
            Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },

    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("price")}</div>,
    },

    {
      accessorKey: "qty",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Quantity
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("qty")}</div>,
    },

    {
      accessorKey: "gift",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Gift
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("gift")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;

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
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Edit
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

  function handleClear() {
    if (pageTableRef.current) {
      pageTableRef.current.handleClear();
      setValue("");
    }
  }

  function handleOutOfStock() {
    if (pageTableRef.current) {
      pageTableRef.current.handleLocalInput();
    }
  }

  const totalStockValue = stock.reduce(
    (total, item) => total + item.qty * Number(item.price),
    0
  );
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(totalStockValue);

  const totalOutOfStock = stock.filter((item) => item.qty === 0).length;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Inventory" description="Manage inventory" />
        <AddInventory />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <PackageSearch />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
            {/* <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Store Value
            </CardTitle>
            <CircleDollarSign />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTotal}</div>
            {/* <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p> */}
          </CardContent>
        </Card>
        <div
          onClick={() => {
            setValue("qty");
            handleOutOfStock();
          }}
          className="hover:cursor-pointer"
        >
         <Card className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out Of Stock
              </CardTitle>
              <PackageMinus />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOutOfStock}</div>
              {/* <p className="text-xs text-muted-foreground">
              +19% from last month
            </p> */}
            </CardContent>
          </Card>
        </div>
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
        data={stock}
        totalItems={stock.length}
        searchItem={value.toLowerCase()}
        searchName={value ? `Search ${value}...` : "Select filter first"}
        tableHeader={tableHeader}
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
                        setValue(framework.value);
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

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Select Dates and press filter.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 w-full">
          <div>
            <Label htmlFor="totalsalary" className="text-left">
              Start Date
            </Label>
            <AppCalendar date={startDate} onChange={setStartDate} />
          </div>

          <div>
            <Label htmlFor="monthlysalary" className="text-left">
              End Date
            </Label>
            <AppCalendar date={endDate} onChange={setEndDate} />
          </div>
        </div>
        <SheetFooter>
          <SheetClose disabled={!startDate || !endDate} asChild>
            <Button className="w-full" onClick={() => console.log("press")}>
              Filter
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const AddInventory = () => {
  const formSchema = z.object({
    category: z.string().min(1, { message: "Category is required." }),
    name: z.string().min(1, { message: "Name is required." }),
    price: z.number().min(1, { message: "Price is required." }),
    qty: z.number().min(1, { message: "Quantity is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      name: "",
      price: 0,
      qty: 0,
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  const categories = [
    { label: "Raytools Nozzle", value: "Raytools Nozzle" },
    { label: "Senfeng Nozzle", value: "Senfeng Nozzle" },
    { label: "High Speed Senfeng Nozzle", value: "High Speed Senfeng Nozzle" },
    { label: "Welding Nozzle", value: "Welding Nozzle" },
    { label: "Lense", value: "Lense" },
    { label: "Ceramic Ring", value: "Ceramic Ring" },
    { label: "Guage", value: "Guage" },
    { label: "Dust Cover", value: "Dust Cover" },
    { label: "Computer Accessory", value: "Computer Accessory" },
    { label: "Cutting Head", value: "Cutting Head" },
    { label: "Spare Part", value: "Spare Part" }
  ];
  

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset();
          }}
          
        >
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new item</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="max-h-[80vh] px-2">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.value}
                                    value={category.value}
                                  >
                                    {category.label}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter item price"
                            type="number"
                            value={field.value ? field.value : ""}
                            onChange={(e) =>
                              isNaN(e.target.value)
                                ? ""
                                : field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter item quantity"
                            type="number"
                            value={field.value ? field.value : ""}
                            onChange={(e) =>
                              isNaN(e.target.value)
                                ? ""
                                : field.onChange(Number(e.target.value))
                            }
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
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
