"use client";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  FileDown,
  Filter,
  ImageIcon,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContext, useEffect, useState } from "react";

import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import AppCalendar from "@/components/features/calendar/app-calendar";
import PageTable from "@/components/shared/tables/app-table";
import Dropzone from "@/components/shared/uploads/dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import FilterSheet from "@/components/features/users/filter-sheet";
import { TIMEZONE } from "@/constants/data";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import formatCurrency from "@/lib/formatCurrency";
import { OfficeExpenseProps } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ColumnDef } from "@tanstack/react-table";
import { saveAs } from "file-saver";
import moment from "moment";
import momentT from "moment-timezone";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import Spinner from "@/components/ui/spinner";

const expensePdfStyles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  totalText: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  row: {
    flexDirection: "row",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 28,
  },
  lastRow: {
    flexDirection: "row",
    minHeight: 28,
  },
  headerCell: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    fontWeight: "bold",
    borderRightStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
  },
  cell: {
    padding: 6,
    borderRightStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  dateCell: {
    width: "18%",
  },
  noteCell: {
    width: "42%",
  },
  amountCell: {
    width: "18%",
  },
  submittedByCell: {
    width: "22%",
    borderRightWidth: 0,
  },
  emptyText: {
    padding: 10,
    color: "#6B7280",
  },
});

const ExpensePdfDocument = ({ data }: { data: OfficeExpenseProps[] }) => (
  <Document>
    <Page size="A4" style={expensePdfStyles.page}>
      <Text style={expensePdfStyles.title}>Office Expenses</Text>
      <Text style={expensePdfStyles.totalText}>
        Total PKR:{" "}
        {formatCurrency(
          data.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        )}
      </Text>
      <View style={expensePdfStyles.table}>
        <View style={expensePdfStyles.row} fixed>
          <Text style={[expensePdfStyles.headerCell, expensePdfStyles.dateCell]}>
            Date
          </Text>
          <Text style={[expensePdfStyles.headerCell, expensePdfStyles.noteCell]}>
            Note
          </Text>
          <Text style={[expensePdfStyles.headerCell, expensePdfStyles.amountCell]}>
            Amount
          </Text>
          <Text
            style={[
              expensePdfStyles.headerCell,
              expensePdfStyles.submittedByCell,
            ]}
          >
            Submitted By
          </Text>
        </View>
        {data.length === 0 ? (
          <Text style={expensePdfStyles.emptyText}>No expenses found</Text>
        ) : (
          data.map((item, index) => (
            <View
              key={`${item.id || index}-${item.date}`}
              style={
                index === data.length - 1
                  ? expensePdfStyles.lastRow
                  : expensePdfStyles.row
              }
              wrap={false}
            >
              <Text style={[expensePdfStyles.cell, expensePdfStyles.dateCell]}>
                {item.date ? moment(item.date).format("YYYY-MM-DD") : ""}
              </Text>
              <Text style={[expensePdfStyles.cell, expensePdfStyles.noteCell]}>
                {item.note || ""}
              </Text>
              <Text style={[expensePdfStyles.cell, expensePdfStyles.amountCell]}>
                {Number(item.amount || 0)}
              </Text>
              <Text
                style={[expensePdfStyles.cell, expensePdfStyles.submittedByCell]}
              >
                {item.submitted_by_name || ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </Page>
  </Document>
);

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
  const [exportLoading, setExportLoading] = useState<"excel" | "pdf" | null>(
    null,
  );
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

  async function handleExcelExport() {
    setExportLoading("excel");
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
      await exportToExcel(
        headers,
        formattedData,
        "Branch-Expenses.xlsx",
        false,
        "",
        true,
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to export Excel");
    } finally {
      setExportLoading(null);
    }
  }

  async function handlePdfExport() {
    setExportLoading("pdf");
    try {
      const blob = await pdf(<ExpensePdfDocument data={data} />).toBlob();
      saveAs(blob, "Branch-Expenses.pdf");
    } catch (error) {
      console.log(error);
      toast.error("Failed to export PDF");
    } finally {
      setExportLoading(null);
    }
  }

  async function handleDelete(id: number | undefined) {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/${userID}/expenses/${id}`);
      toast.success("Branch Expense Deleted")
      const startDate = moment()
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const endDate = moment()
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
    <div className="flex flex-1 flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-col gap-5 border-b bg-muted/20 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Branch finance
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Office Expenses
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage branch expense entries, receipts, exports, and monthly totals.
              </p>
            </div>
          </div>

          {branch_expenses_write_access && (
            <Button
              onClick={() => setVisibleAdd(true)}
              className="w-full gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Office Expenses
            </Button>
          )}
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total PKR
                </p>
                <p className="text-xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Entries
                </p>
                <p className="text-xl font-bold">{data.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  View
                </p>
                <p className="text-xl font-bold">Monthly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={async () => await handleDelete(imageURL?.id)}
        onPressCancel={() => setShowConfirmation(false)}
        loading={deleteLoading}
      />
      <div>
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
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setFilterVisible(true)}
                variant="outline"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                className="gap-2"
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
                {resetLoading ? <Spinner /> : <RotateCcw className="h-4 w-4" />}
                Reset
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"outline"} disabled={!!exportLoading} className="gap-2">
                    {exportLoading ? <Spinner /> : <FileDown className="h-4 w-4" />}
                    Export
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem
                    disabled={!!exportLoading}
                    onClick={handleExcelExport}
                  >
                    {exportLoading === "excel" && <Spinner />} Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!!exportLoading}
                    onClick={handlePdfExport}
                  >
                    {exportLoading === "pdf" && <Spinner />} PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Card className="w-full border bg-background shadow-none sm:w-auto">
              <CardContent className="px-4 py-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total PKR:{" "}
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(total)}
                  </span>
                </CardTitle>
              </CardContent>
            </Card>
          </div>
        </PageTable>
      </div>

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

  const { isAdmin, branch_expenses_delete_access } = useUserDetail();

  const hasPermission = isAdmin || branch_expenses_delete_access;

  const isCurrentOrFutureMonth =
    date && !moment(date).startOf("day").isBefore(moment().startOf("month"));

  const isAllowed = hasPermission && isCurrentOrFutureMonth;

  function handleClose() {
    onClose();
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                Bill detail
              </SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Receipt preview and submitted by information.
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted by
                </p>
                <Label className="mt-1 block break-words text-sm font-semibold">
                  {submittedBy || "N/A"}
                </Label>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-muted/15 p-3">
            {img ? (

              <MyImgZooming
                img={img}
                className="rounded-xl object-contain"
              />

            ) : (
              <div className="grid h-[220px] place-items-center rounded-xl border border-dashed bg-background text-sm text-muted-foreground">
                No receipt image available
              </div>
            )}
          </div>

          {isAllowed && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full gap-2"
            >
              {loading ? <Spinner /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          )}
        </div>
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

export const AddExpensesDialog = ({ visible, onClose, onRefresh, user_id }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, user_id: number | null | string }) => {
  const [loading, setLoading] = useState(false);
  const { state: OfficeState } = useContext(OfficeContext)!


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
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Add New Office Expense
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Record amount, date, note, and receipt attachment.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-140px)]">
          <div className="p-5">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Entry Details */}
              <FieldSet className="gap-4 rounded-2xl border bg-background p-4 shadow-sm">
                <FieldLegend className="px-1 text-sm font-semibold text-foreground">
                  Entry Details
                </FieldLegend>

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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                          // min={new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
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
              <FieldSet className="gap-4 rounded-2xl border bg-muted/15 p-4">
                <FieldLegend className="px-1 text-sm font-semibold text-foreground">
                  Attachment
                </FieldLegend>

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
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
};
