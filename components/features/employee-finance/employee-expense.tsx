"use client"
import {
  ArrowUpDown,
  CalendarDays,
  ImageIcon,
  Plus,
  ReceiptText,
  Trash2,
  UserRound,
  WalletCards
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useContext, useEffect, useState } from "react"

import AppCalendar from "@/components/features/calendar/app-calendar"
import FilterSheet from "@/components/features/users/filter-sheet"
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog"
import PageTable from "@/components/shared/tables/app-table"
import Dropzone from "@/components/shared/uploads/dropzone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { TIMEZONE } from "@/constants/data"

import { MyImgZooming } from "@/components/shared/media/img-zooming"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import Spinner from "@/components/ui/spinner"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import formatCurrency from "@/lib/formatCurrency"
import { OfficeExpenseProps } from "@/lib/types"
import { UploadImage } from "@/lib/uploadFunction"
import { OfficeContext } from "@/store/context/OfficeContext"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer"
import { ColumnDef } from "@tanstack/react-table"
import moment from "moment"
import momentT from "moment-timezone"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
})

const ExpensePdfDocument = ({ data }: { data: OfficeExpenseProps[] }) => (
  <Document>
    <Page size="A4" style={expensePdfStyles.page}>
      <Text style={expensePdfStyles.title}>Office Expenses</Text>
      <Text style={expensePdfStyles.totalText}>
        Total PKR:{" "}
        {formatCurrency(
          data.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        )}
      </Text>
      <View style={expensePdfStyles.table}>
        <View style={expensePdfStyles.row} fixed>
          <Text
            style={[expensePdfStyles.headerCell, expensePdfStyles.dateCell]}
          >
            Date
          </Text>
          <Text
            style={[expensePdfStyles.headerCell, expensePdfStyles.noteCell]}
          >
            Note
          </Text>
          <Text
            style={[expensePdfStyles.headerCell, expensePdfStyles.amountCell]}
          >
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
              <Text
                style={[expensePdfStyles.cell, expensePdfStyles.amountCell]}
              >
                {Number(item.amount || 0)}
              </Text>
              <Text
                style={[
                  expensePdfStyles.cell,
                  expensePdfStyles.submittedByCell,
                ]}
              >
                {item.submitted_by_name || ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </Page>
  </Document>
)

export default function EmployeeBranchExpenses() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [filterVisible, setFilterVisible] = useState(false)
  const [data, setData] = useState<OfficeExpenseProps[]>([])
  const [imageURL, setImageURL] = useState<OfficeExpenseProps | null>(null)
  const [visible, setVisible] = useState(false)
  const {
    userID,
    isAdmin,
    branch_expenses_assigned,
    branch_expenses_write_access,
  } = useUserDetail()
  const [visibleAdd, setVisibleAdd] = useState(false)

  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userID) {
      const allowed = branch_expenses_assigned || isAdmin
      if (!allowed) {
        router.push("/not-allowed")
      }
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString()
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString()
      fetchData(startDate, endDate)
    }
  }, [userID])

  async function fetchData(startDate: string, endDate: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/expenses?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setData(response.data)
        })
        .catch((e) => {
          console.log(e)
        })
        .finally(() => {
          setLoading(false)
          resolve(true)
        })
    })
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
        )
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
        )
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
        )
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
        )
      },
      cell: ({ row }) => <div>{row.getValue("submitted_by_name")}</div>,
    },
  ]

  async function handleDelete(id: number | undefined) {
    if (!id) return
    setDeleteLoading(true)
    try {
      await axios.delete(`/${userID}/expenses/${id}`)
      toast.success("Branch Expense Deleted")
      const startDate = moment()
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString()
      const endDate = moment().endOf("month").endOf("day").utc().toISOString()
      await fetchData(startDate, endDate)
    } finally {
      setDeleteLoading(false)
      setShowConfirmation(false)
      setVisible(false)
      setImageURL(null)
    }
  }

  const total = data.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ReceiptText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Office expenses
                </h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">
                  Branch finance
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review and manage branch spending records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* <ExpenseExport data={data} /> */}
            {branch_expenses_write_access && (
              <Button onClick={() => setVisibleAdd(true)} className="gap-2">
                <Plus className="size-4" />
                Add expense
              </Button>
            )}
          </div>
        </div>

        <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <WalletCards className="size-4 text-emerald-600 dark:text-emerald-400" />
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Total
              </span>
              <span className="truncate text-sm font-bold">
                PKR {formatCurrency(total)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
            <ReceiptText className="size-4 text-violet-600 dark:text-violet-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Entries
              </span>
              <span className="text-sm font-bold">{data.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
            <CalendarDays className="size-4 text-amber-600 dark:text-amber-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Period
              </span>
              <span className="text-sm font-bold">Monthly</span>
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
      <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <PageTable
          loading={loading}
          columns={columns}
          data={data}
          onRowClick={(val, e) => {
            setImageURL(val)
            setVisible(true)
          }}
          filter
          onFilterPress={() => setFilterVisible(true)}
          reset
          resetLoading={resetLoading}
          onResetPress={async () => {
            setResetLoading(true)
            const startDate = momentT
              .tz(TIMEZONE)
              .startOf("month")
              .startOf("day")
              .utc()
              .toISOString()
            const endDate = momentT
              .tz(TIMEZONE)
              .endOf("month")
              .endOf("day")
              .utc()
              .toISOString()
            await fetchData(startDate, endDate)
            setResetLoading(false)
          }}
        />
      </section>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end)
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
            momentT.tz(TIMEZONE).endOf("month").endOf("day").utc().toISOString()
          )
        }}
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
  )
}
type ImageSheetProps = {
  visible: boolean
  onClose: () => void
  img: string | null
  submittedBy: string | null
  onDelete: () => void
  loading?: boolean
  date: string | Date | undefined
}

const ImageSheet = ({
  visible,
  onClose,
  img,
  submittedBy,
  onDelete,
  loading,
  date,
}: ImageSheetProps) => {
  const { isAdmin, branch_expenses_delete_access } = useUserDetail()

  const hasPermission = isAdmin || branch_expenses_delete_access

  const isCurrentOrFutureMonth =
    date && !moment(date).startOf("day").isBefore(moment().startOf("month"))

  const isAllowed = hasPermission && isCurrentOrFutureMonth

  function handleClose() {
    onClose()
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
                <Label className="mt-1 block text-sm font-semibold break-words">
                  {submittedBy || "N/A"}
                </Label>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-muted/15 p-3">
            {img ? (
              <MyImgZooming img={img} className="rounded-xl object-contain" />
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
  )
}

const formSchema = z.object({
  note: z.string().min(1, { message: "TID is required." }),
  amount: z.coerce.number<number>().min(0, "Amount is required"),
  date: z.date({ error: "Date is required." }),
  image: z.string().min(1, { message: "Image is required." }),
})

type ExpenseFormValues = z.infer<typeof formSchema>

export const AddExpensesDialog = ({
  visible,
  onClose,
  onRefresh,
  user_id,
}: {
  visible: boolean
  onClose: (val: boolean) => void
  onRefresh: () => Promise<void>
  user_id: number | null | string
}) => {
  const [loading, setLoading] = useState(false)
  const { state: OfficeState } = useContext(OfficeContext)!

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: 0,
      date: undefined,
      image: "",
    },
  })

  async function onSubmit(values: ExpenseFormValues) {
    setLoading(true)
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/Expenses/${moment()
          .valueOf()
          .toString()}.png`
        const imgRes = await UploadImage(values.image, name)
        const response = await axios.post(`/${user_id}/expenses`, {
          ...values,
          submitted_by: user_id,
          image: name,
        })
        await onRefresh()
        handleClose(false)
      } else {
        const response = await axios.post(`/${user_id}/expenses`, {
          ...values,
          submitted_by: user_id,
        })
        await onRefresh()
        handleClose(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }

  function handleClose(val: boolean) {
    form.reset()
    setLoading(false)
    onClose(val)
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Add New Office Expense
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Record amount, date, note, and receipt attachment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="p-3.5 pb-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground">
              {/* Entry Details */}
              <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
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
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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
  )
}
