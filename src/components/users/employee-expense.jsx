"use client";
import {
  ArrowUpDown,
  Filter,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useContext, useEffect, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import FilterSheet from "@/components/users/filterSheet";
import { storage } from "@/config/firebase";
import { toast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import { UploadImage } from "@/lib/uploadFunction";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import Spinner from "../ui/spinner";

export default function EmployeeBranchExpenses() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const [visibleAdd, setVisibleAdd] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      if (!UserState.value.data?.branch_expenses_assigned) {
        router.push("/not-allowed");
      }
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData(startDate, endDate);
    }
  }, [UserState?.value?.data]);

  async function fetchData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/expenses?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setData(response.data);
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false)
          resolve(true);

        });
    });
  }

  const columns = [
    {
      accessorKey: "date",
      filterFn: "includesString",
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
        <div className="ml-2">
          {row.getValue("date")
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "note",
      filterFn: "includesString",
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
      cell: ({ row }) => <div>{row.getValue("note")}</div>,
    },
    {
      accessorKey: "amount",
      filterFn: "includesString",
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
      accessorKey: "submitted_by_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Submitted By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("submitted_by_name")}</div>,
    },
  ];

  function handleDownload() {
    setDownloadLoading(true);
    try {
      const headers = ["Date","Note", "Amount", "Submitted By"];
      let finalData = [];
      finalData = [...data];
      const formattedData = finalData.map((item) => [
        moment(item.date).format("YYYY-MM-DD"),
        item.note,
        item.amount,
        item.submitted_by_name,
      ]);
      exportToExcel(headers, formattedData, "Branch-Expenses.xlsx");
    } catch (error) {
      console.log("error");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      if (imageURL && imageURL?.image && !imageURL.image.includes("http")) {
        DeleteFromStorage(imageURL.image);
      }
      const response = await axios.delete(
        `/expenses/${id}`
      );
      toast({ title: "Branch Expense Deleted" });
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      await fetchData(startDate, endDate);
    }  finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setVisible(false);
      setImageURL(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Heading title="Office Expenses" description="Manage office expenses" />
        {UserState.value.data &&
          UserState.value.data?.branch_expenses_write_access && (
            <Button onClick={() => setVisibleAdd(true)}>
              Add Office Expenses
            </Button>
          )}
      </div>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={async () => await handleDelete(imageURL.id)}
        onPressCancel={() => setShowConfirmation(false)}
        loading={deleteLoading}
      />
      <PageTable
      loading={loading}
        columns={columns}
        data={data}
        totalItems={data.length}
        searchItem={"note"}
        searchName={"Search bill..."}
        onRowClick={(val) => {
          setImageURL(val);
          setVisible(true);
        }}
        // filter={true}
        // onFilterClick={() => setFilterVisible(true)}
      >
        <Button
          onClick={() => setFilterVisible(true)}
          variant="ghost"
          className="p-0 w-8"
        >
          <Filter />
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            setResetLoading(true);
            const startDate = moment().startOf("month").toISOString();
            const endDate = moment().endOf("month").toISOString();
            await fetchData(startDate, endDate);
            setResetLoading(false);
          }}
        >
          {resetLoading && <Spinner />} Reset
        </Button>
        <Button onClick={handleDownload}>
          {downloadLoading && <Loader2 className="animate-spin" />} Download
        </Button>
      </PageTable>

      <FilterSheet
        visible={filterVisible}
        onClose={setFilterVisible}
        onReturn={async (val) => {
          await fetchData(val.start.toISOString(), val.end.toISOString());
        }}
      />

      <AddExpensesDialog
        visible={visibleAdd}
        onClose={setVisibleAdd}
        user_id={UserState.value.data?.id}
        onRefresh={async () =>
          await fetchData(
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
        onDelete={() => setShowConfirmation(true)}
      />
    </div>
  );
}

const ImageSheet = ({
  visible,
  onClose,
  img,
  submittedBy,
  description,
  onDelete,
  loading,
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    }
  }, [img]);

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
          {UserState.value.data?.branch_expenses_delete_access && (
            <Button variant="destructive" onClick={onDelete}>
              {loading && <Loader2 className="animate-spin" />} Delete
            </Button>
          )}
        </SheetHeader>
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
        const response = await axios.post(`/expenses`, {
          ...values,
          submitted_by: user_id,
          image: name,
        });
        await onRefresh();
        handleClose(false);
      } else {
        const response = await axios.post(`/expenses`, {
          ...values,
          submitted_by: user_id,
        });
        await onRefresh();
        handleClose(false);
      }
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
                  {loading && <Loader2 className="animate-spin" />} Submit
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
