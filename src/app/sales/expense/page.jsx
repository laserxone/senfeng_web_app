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
import { useCallback, useContext, useEffect, useState } from "react";
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
import { UserContext } from "@/store/context/UserContext";
import { UserSearch } from "@/components/user-search";
import moment from "moment";
import { UploadImage } from "@/lib/uploadFunction";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import { redirect } from "next/navigation";

export default function Page() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [visibleAdd, setVisibleAdd] = useState(false);

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      if(!UserState.value.data?.branch_expenses_assigned){
        redirect("/not-allowed")
      }
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData(UserState?.value?.data?.id, startDate, endDate);
    }
  }, [UserState?.value?.data]);

  async function fetchData(id, startDate, endDate) {
    axios
      .get(
        `/api/user/${id}/expense?start_date=${startDate}&end_date=${endDate}`
      )
      .then((response) => {
        setData(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const columns = [
    {
      accessorKey: "note",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Note
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("note")}</div>,
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
          <ChevronsRight
            className="cursor-pointer"
            onClick={() => {
              setImageURL(currentItem);
              setVisible(true);
            }}
          />
          // <DropdownMenu>
          //   <DropdownMenuTrigger asChild>
          //     <Button variant="ghost" className="h-8 w-8 p-0">
          //       <MoreHorizontal className="h-4 w-4" />
          //     </Button>
          //   </DropdownMenuTrigger>
          //   <DropdownMenuContent align="end">
          //     <DropdownMenuLabel>Actions</DropdownMenuLabel>
          //     <DropdownMenuItem
          //       className="hover:cursor-pointer"
          //       onClick={() => {
          //         setImageURL(currentItem);
          //         setVisible(true);
          //       }}
          //     >
          //       View
          //     </DropdownMenuItem>

          //     {/* <DropdownMenuItem onClick={() => setShowConfirmation(true)}>
          //       Delete
          //     </DropdownMenuItem> */}
          //   </DropdownMenuContent>
          // </DropdownMenu>
        );
      },
    },
  ];

  function handleDownload() {
    const headers = ["Note", "Amount", "Date", "Submitted By"];
    let finalData = [];
    finalData = [...data];
    const formattedData = finalData.map((item) => [
      item.note,
      item.amount,
      new Date(item.date).toLocaleDateString("en-GB"),
      item.submitted_by_name,
    ]);
    exportToExcel(headers, formattedData, "Branch-Expenses.xlsx");
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Office Expenses" description="Manage office expenses" />
        <Button onClick={() => setVisibleAdd(true)}>Add Office Expenses</Button>
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
        data={data}
        totalItems={data.length}
        searchItem={"note"}
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
        onReturn={(val) => {
          fetchData(
            UserState.value.data?.id,
            val.start.toISOString(),
            val.end.toISOString()
          );
        }}
      />

      <AddExpensesDialog
        visible={visibleAdd}
        onClose={setVisibleAdd}
        user_id={UserState.value.data?.id}
        onRefresh={() =>
          fetchData(
            UserState.value.data.id,
            moment().startOf("month").toISOString(),
            moment().endOf("month").toISOString()
          )
        }
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
  const [localImage, setLocalImage] = useState(null)

  useEffect(()=>{
    if(img){
      if(img.includes("http")){
        setLocalImage(img)
      } else {
        getDownloadURL(ref(storage, img))
        .then((url)=>{
          setLocalImage(url)
        })
      }
    }
  },[img])

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
              src={localImage}
              alt="officeexpenses-img"
              style={{ flex: 1 }}
            />
          </ControlledZoom>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const FilterSheet = ({ visible, onClose, onReturn }) => {
  const formSchema = z.object({
    start: z.date({ required_error: "Start date is required." }),
    end: z.date({ required_error: "End date is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: undefined,
      end: undefined,
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
          <SheetDescription>Filter office expense data</SheetDescription>
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
                    <AppCalendar date={field.value} onChange={field.onChange} />
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
                    <AppCalendar date={field.value} onChange={field.onChange} />
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

const AddExpensesDialog = ({ visible, onClose, onRefresh, user_id }) => {
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    note: z.string().min(1, { message: "Note is required." }),
    amount: z
      .number()
      .min(0.01, { message: "Amount must be greater than zero." }),
    date: z.date({ required_error: "Date is required." }),
    image: z.string().min(1, { message: "Image is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: "",
      date: "",
      image: "",
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    try {
      if (values.image) {
        const name = `Expenses/${moment().valueOf().toString()}.png`;
        const imgRes = await UploadImage(values.image, name);
        const response = await axios.post("/api/expenses", {
          ...values,
          submitted_by: user_id,
          image: name,
        });
        onRefresh();
        handleClose(false);
      } else {
        const response = await axios.post("/api/expenses", {
          ...values,
          submitted_by: user_id,
        });
        onRefresh();
        handleClose(false);
      }
    } catch (error) {
      setLoading(false);
    }
  }

  function handleClose(val) {
    form.reset();
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Office Expense</DialogTitle>
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
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter note" {...field} />
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
