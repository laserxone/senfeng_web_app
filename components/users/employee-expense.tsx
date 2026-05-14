"use client";
import { ArrowUpDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useContext, useEffect, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import FilterSheet from "@/components/users/filterSheet";
import { storage } from "@/config/firebase";
import { TIMEZONE } from "@/constants/data";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import formatCurrency from "@/lib/formatCurrency";
import { OfficeExpenseProps } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import momentT from "moment-timezone";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardTitle } from "../ui/card";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "../ui/field";
import Spinner from "../ui/spinner";

export default function EmployeeBranchExpenses() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<OfficeExpenseProps[]>([]);
  const [imageURL, setImageURL] = useState<OfficeExpenseProps | null>(null);
  const [visible, setVisible] = useState(false);
  const {
    userID,
    isAdmin,
    branch_expenses_assigned,
    branch_expenses_write_access,
  } = useUserDetail();
  const [visibleAdd, setVisibleAdd] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID) {
      const allowed = branch_expenses_assigned || isAdmin;
      if (!allowed) {
        router.push("/not-allowed");
      }
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      fetchData(startDate, endDate);
    }
  }, [userID]);

  async function fetchData(startDate: string, endDate: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/expenses?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setData(response.data);
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
          resolve(true);
        });
    });
  }



  const columns: ColumnDef<OfficeExpenseProps>[] = [
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
      const headers = ["Date", "Note", "Amount", "Submitted By"];
      let finalData = [];
      finalData = [...data];
      const formattedData = finalData.map((item) => [
        moment(item.date).format("YYYY-MM-DD"),
        item.note,
        Number(item.amount || 0),
        item.submitted_by_name,
        item.image,
      ]);
      exportToExcel(
        headers,
        formattedData,
        "Branch-Expenses.xlsx",
        false,
        "",
        true,
      );
    } catch (error) {
      console.log("error");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDelete(id: number | undefined) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      if (imageURL && imageURL?.image && !imageURL.image.includes("http")) {
        DeleteFromStorage(imageURL.image);
      }
      const response = await axios.delete(`/${userID}/expenses/${id}`);
      toast.success("Branch Expense Deleted")
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      await fetchData(startDate, endDate);
    } finally {
      setDeleteLoading(false);
      setShowConfirmation(false);
      setVisible(false);
      setImageURL(null);
    }
  }

  const total = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Heading title="Office Expenses" description="Manage office expenses" />
        {branch_expenses_write_access && (
          <Button onClick={() => setVisibleAdd(true)}>
            Add Office Expenses
          </Button>
        )}
      </div>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={async () => await handleDelete(imageURL?.id)}
        onPressCancel={() => setShowConfirmation(false)}
        loading={deleteLoading}
      />
      <PageTable
        loading={loading}
        columns={columns}
        data={data}
        onRowClick={(val, e) => {
          setImageURL(val);
          setVisible(true);
        }}
      // filter={true}
      // onFilterClick={() => setFilterVisible(true)}
      >
        <div className="flex flex-1 items-center justify-between flex-wrap gap-2">
          <div className="flex gap-4 flex-wrap">
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
                const startDate = momentT
                  .tz(TIMEZONE)
                  .startOf("month")
                  .startOf("day")
                  .utc()
                  .toISOString();
                const endDate = momentT
                  .tz(TIMEZONE)
                  .endOf("month")
                  .endOf("day")
                  .utc()
                  .toISOString();
                await fetchData(startDate, endDate);
                setResetLoading(false);
              }}
            >
              {resetLoading && <Spinner />} Reset
            </Button>
            <Button onClick={handleDownload}>
              {downloadLoading && <Spinner />} Download
            </Button>
          </div>
          <Card className="self-end">
            <CardContent className="px-4 py-2">
              <CardTitle className="font-medium">
                Total PKR:{" "}
                <span className="font-bold">{formatCurrency(total)}</span>
              </CardTitle>
            </CardContent>
          </Card>
        </div>
      </PageTable>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end);
        }}
      />

      <AddExpensesDialog
        visible={visibleAdd}
        onClose={setVisibleAdd}
        user_id={userID}
        onRefresh={async () => {
          await fetchData(
            momentT
              .tz(TIMEZONE)
              .startOf("month")
              .startOf("day")
              .utc()
              .toISOString(),
            momentT
              .tz(TIMEZONE)
              .endOf("month")
              .endOf("day")
              .utc()
              .toISOString(),
          )
        }
        }
      />

      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        submittedBy={imageURL?.submitted_by_name || null}
        onDelete={() => setShowConfirmation(true)}
        date={imageURL?.date}
      />
    </div>
  );
}
type ImageSheetProps = {
  visible: boolean;
  onClose: () => void;
  img: string | null;
  submittedBy: string | null;
  onDelete: () => void;
  loading?: boolean;
  date: string | Date | undefined;
};
const ImageSheet = ({
  visible,
  onClose,
  img,
  submittedBy,
  onDelete,
  loading,
  date,
}: ImageSheetProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState<null | string>(null);
  const { isAdmin, branch_expenses_delete_access } = useUserDetail();

  const hasPermission = isAdmin || branch_expenses_delete_access;

  const isCurrentOrFutureMonth =
    date && !moment(date).startOf("day").isBefore(moment().startOf("month"));

  const isAllowed = hasPermission && isCurrentOrFutureMonth;

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

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
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

          {localImage &&

            <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
              <img
                onClick={() => setImageOpen(true)}
                className="hover:cursor-pointer"
                src={localImage}
                alt="officeexpenses-img"
                style={{ flex: 1 }}
              />
            </ControlledZoom>
          }
          {isAllowed && (
            <Button variant="destructive" onClick={onDelete}>
              {loading && <Spinner />} Delete
            </Button>
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const formSchema = z.object({
  note: z.string().min(1, { message: "TID is required." }),
  amount: z.coerce.number<number>().min(0, "Amount is required"),
  date: z.date({ error: "Date is required." }),
  image: z.string().min(1, { message: "Image is required." }),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

const AddExpensesDialog = ({ visible, onClose, onRefresh, user_id }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, user_id: number | null }) => {
  const [loading, setLoading] = useState(false);
  const { state: OfficeState } = useContext(OfficeContext);


  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: 0,
      date: undefined,
      image: "",
    },
  });

  async function onSubmit(values: ExpenseFormValues) {
    setLoading(true);
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/Expenses/${moment()
          .valueOf()
          .toString()}.png`;
        const imgRes = await UploadImage(values.image, name);
        const response = await axios.post(`/${user_id}/expenses`, {
          ...values,
          submitted_by: user_id,
          image: name,
        });
        await onRefresh();
        handleClose(false);
      } else {
        const response = await axios.post(`/${user_id}/expenses`, {
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

  function handleClose(val: boolean) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Office Expense</DialogTitle>
        </DialogHeader>

        
          <div className="px-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

              {/* Entry Details */}
              <FieldSet className="border rounded-md p-3 gap-3">
                <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Entry Details</FieldLegend>

                {/* Note */}
                <Controller
                  name="note"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Note</FieldLabel>
                      <Textarea placeholder="Enter note" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Amount */}
                  <Controller
                    name="amount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Amount</FieldLabel>
                        <Input placeholder="Enter amount" {...field} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* Date */}
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Date</FieldLabel>
                        <AppCalendar
                          max={new Date()}
                          date={field.value ? new Date(field.value) : undefined}
                          onChange={field.onChange}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              {/* Attachment */}
              <FieldSet className="border rounded-md p-3 gap-3">
                <FieldLegend className="text-sm text-muted-foreground px-1 mb-1">Attachment</FieldLegend>

                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Dropzone
                        value={field.value}
                        onDrop={field.onChange}
                        title="Click to upload"
                        subheading="or drag and drop"
                        description="PNG or JPG"
                        drag="Drop the files here..."
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldSet>

              {/* Submit */}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </div>
      
      </DialogContent>
    </Dialog>
  );
};
