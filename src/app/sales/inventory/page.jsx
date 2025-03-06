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
  ChevronsRight,
  CircleDollarSign,
  Filter,
  Loader2,
  MoreHorizontal,
  PackageMinus,
  PackageSearch,
  Plus,
  PlusCircle,
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
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { Textarea } from "@/components/ui/textarea";
import Dropzone from "@/components/dropzone";
import { UploadImage } from "@/lib/uploadFunction";
import moment from "moment";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { UserContext } from "@/store/context/UserContext";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Link from "next/link";
import PageContainer from "@/components/page-container";

export default function Page() {
  return <RenderInventory />;
}

const RenderInventory = () => {
  const pageTableRef = useRef();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [stock, setStock] = useState([]);
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [visibleEdit, setVisibleEdit] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState(false);
  const { state: UserState } = useContext(UserContext);

  const tableHeader = [
    {
      value: "shipment",
      label: "Name",
    },
  ];

  useEffect(() => {
    if (UserState.value.data?.id) {
     
      fetchData();
    }
  }, [UserState.value.data]);

  async function fetchData() {
    axios
      .get("/api/bookings")
      .then((response) => {
        if (response.data) {
          setStock(response.data);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const columns = [
    {
      accessorKey: "shipment",
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
      cell: ({ row }) => <div className="ml-2">{row.getValue("shipment")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <Link href={`/sales/inventory/detail?id=${row?.original?.id}`}>
            <ChevronsRight />
          </Link>
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
    <PageContainer scrollable={false}>
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Machine Inventory" description="Manage machine inventory" />
        <Button
          onClick={() => {
            setVisible(true);
          }}
        >
          Add Shipment
        </Button>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <PackageSearch />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
           
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
             
            </CardContent>
          </Card>
        </div>
      </div> */}

      {/* <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      /> */}

      <AddInventory
        visible={visible}
        onClose={setVisible}
        onRefresh={() => fetchData()}
      />

      <div className="flex flex-1">
        <PageTable
          ref={pageTableRef}
          columns={columns}
          data={stock}
          totalItems={stock.length}
          searchItem={'shipment'}
          searchName={`Search name...`}
          tableHeader={tableHeader}
        >
        
        </PageTable>
      </div>
    </div>
    </PageContainer>
  );
};

const AddInventory = ({ visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    name: z.string().min(1, { message: "Shipment name is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values) {
    try {
      setLoading(true);
      const respose = await axios.post("/api/bookings", {
        shipment: values.name,
        data: [
          {
            QTY: "",
            SERIAL: "",
            MODEL: "",
            POWER: "",
            SOURCE: "",
            CUSTOMER: "",
            CITY: "",
            MANAGER: "",
            PRICE: "",
            DELIVERY: "",
            REMARKS: "",
          },
        ],
      });
      onRefresh();
      handleClose(false);
    } catch (error) {
      setLoading(false);
    }
  }
  function handleClose(val) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new shipment</DialogTitle>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter shipment name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit">
                    {loading && <Loader2 className="animate-spin" />} Submit
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

const EditInventory = ({ visible, onClose, onRefresh, data }) => {
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    unit: z.string().min(1, { message: "Unit is required." }),
    name: z.string().min(1, { message: "Name is required." }),
    price: z.number().min(1, { message: "Price is required." }),
    qty: z.number().min(1, { message: "Quantity is required." }),
    rack: z.string().optional(),
    remarks: z.string().optional(),
    img: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.name,
      price: Number(data.price),
      qty: data.qty,
      unit: data.unit,
      rack: data.rack,
      remarks: data.remarks,
      img: "",
    },
  });

  useEffect(() => {
    if (data) {
      if (data.img) {
        const storageRef = ref(storage, data.img);
        getDownloadURL(storageRef)
          .then((url) => {
            console.log(url);
            form.reset({
              name: data.name || "",
              price: Number(data.price) || "",
              qty: data.qty || "",
              unit: data.unit || "",
              rack: data.rack || "",
              remarks: data.remarks || "",
              img: url || "",
            });
          })
          .catch((e) => {
            console.log("image not found", e?.message);
            form.reset({
              name: data.name || "",
              price: Number(data.price) || "",
              qty: data.qty || "",
              unit: data.unit || "",
              rack: data.rack || "",
              remarks: data.remarks || "",
              img: "",
            });
          });
      } else {
        form.reset({
          name: data.name || "",
          price: Number(data.price) || "",
          qty: data.qty || "",
          unit: data.unit || "",
          rack: data.rack || "",
          remarks: data.remarks || "",
          img: data.img || "",
        });
      }
    }
  }, [data, form]);

  async function onSubmit(values) {
    setLoading(true);
    let delete_image = false;
    if (data.img && !values.img) {
      DeleteFromStorage(data.img);
    }
    try {
      if (!values.img || values.img == data.img) {
        const respose = await axios.put("/api/inventory", {
          ...values,
          id: data.id,
        });
        onRefresh();
        handleClose(false);
      } else {
        let name = "";
        if (data.img) {
          name = `${data.img}`;
        } else {
          name = `Inventory/${moment().valueOf().toString()}.png`;
        }

        const imageResponse = await UploadImage(values.img, name);
        const respose = await axios.put("/api/inventory", {
          ...values,
          id: data.id,
          img: name,
        });
        onRefresh();
        handleClose(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }
  function handleClose(val) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

  const categories = [
    { label: "Set", value: "Set" },
    { label: "No.", value: "No." },
  ];

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
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
                    name="img"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                          <div className="flex flex-1 items-center justify-center">
                            <Dropzone
                              // triggerDelete={() => DeleteFromStorage(data.img)}
                              noImage={false}
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select unit" />
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

                  <FormField
                    control={form.control}
                    name="rack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter remarks" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit">
                    {loading && <Loader2 className="animate-spin" />} Submit
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

const newItem = {
  QTY: "",
  SERIAL: "",
  MODEL: "",
  POWER: "",
  SOURCE: "",
  CUSTOMER: "",
  CITY: "",
  MANAGER: "",
  PRICE: "",
  DELIVERY: "",
  REMARKS: "",
};

const fieldOrder = [
  "QTY",
  "SERIAL",
  "MODEL",
  "POWER",
  "SOURCE",
  "CUSTOMER",
  "CITY",
  "MANAGER",
  "PRICE",
  "DELIVERY",
  "REMARKS",
];
