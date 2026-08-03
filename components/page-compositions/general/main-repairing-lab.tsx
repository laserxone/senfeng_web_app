"use client"
import PageTable from "@/components/shared/tables/app-table"
import AppCalendar from "@/components/features/calendar/app-calendar"
import { CustomerSearch } from "@/components/features/customers/components/customer-search"
import { RequiredStar } from "@/components/shared/common/RequiredStar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Heading from "@/components/ui/heading"
import { Input } from "@/components/ui/input"
import Spinner from "@/components/ui/spinner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { UserSearch } from "@/components/shared/search/user-search"
import { useDebounce } from "@/hooks/use-debounce"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { AssignForm, RepairingProps } from "@/lib/types"
import { YESTERDAY } from "@/lib/utils"
import { OfficeContext } from "@/store/context/OfficeContext"
import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react"
import moment from "moment"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useContext, useEffect, useMemo, useState } from "react"
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MainRepairingLab() {
  const [data, setData] = useState<RepairingProps[]>([])
  const [loading, setLoading] = useState(false)

  const { userID, designation } = useUserDetail()
  const debouncedUserId = useDebounce(userID, 1000)
  const [assignTask, setAssignTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<RepairingProps | null>(null)
  const [filter, setFilter] = useState("all")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedTaskDelete, setSelectedTaskDelete] = useState<number | null>(
    null
  )
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const repairId = searchParams.get("r")

  const selectedTaskDetail = useMemo(
    () => data.find((item) => String(item.id) === repairId) ?? null,
    [data, repairId]
  )

  function updateRepairParam(id?: number) {
    const params = new URLSearchParams(searchParams.toString())

    if (id) params.set("r", String(id))
    else params.delete("r")

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  useEffect(() => {
    if (debouncedUserId) {
      fetchData()
    }
  }, [debouncedUserId])

  async function fetchData() {
    setLoading(true)
    axios
      .get(`/${debouncedUserId}/lab`)
      .then((response) => {
        setData(response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const columns: ColumnDef<RepairingProps>[] = [
    {
      accessorKey: "assign_date",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className={`${
              row.original.status === "pending" ? "bg-red-500" : "bg-green-500"
            } h-3 w-3 border border-white`}
          />{" "}
          <div>
            {moment(new Date(row.getValue("assign_date"))).format("YYYY-MM-DD")}
          </div>
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned To
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },

    {
      accessorKey: "deliver_date",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delivery Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {moment(new Date(row.getValue("deliver_date"))).format("YYYY-MM-DD")}
        </div>
      ),
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },

    {
      accessorKey: "owner_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sale Person
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("owner_name")}</div>,
    },

    {
      accessorKey: "remarks",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remarks
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("remarks")}</div>,
    },

    {
      accessorKey: "remarks_other",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Engineer Remarks
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("remarks_other")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
              aria-label="View repair task"
              onClick={(event) => {
                event.stopPropagation()
                updateRepairParam(currentItem.id)
              }}
            >
              <Eye />
            </Button>
            {designation !== "Engineer" && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete repair task"
                onClick={(event) => {
                  event.stopPropagation()
                  if (currentItem.id) setSelectedTaskDelete(currentItem.id)
                }}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  async function handleDelete(labID: number | null) {
    if (!labID) return
    setDeleteLoading(true)
    axios
      .delete(`/${userID}/lab/${labID}`)
      .then(() => {
        fetchData()
        setSelectedTaskDelete(null)
      })
      .finally(() => {
        setDeleteLoading(false)
      })
  }

  const filteredData =
    filter === "all"
      ? data
      : data.filter((item) => item.status?.includes(filter))

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Heading panel title="Repair and Maintenance" description="" />
        <div className="flex gap-2">
          <Button onClick={() => setAssignTask(true)}>Register Lab Task</Button>
        </div>
      </div>

      <PageTable
        onRowClick={(item) => setSelectedTask(item)}
        loading={loading}
        columns={columns}
        data={filteredData}
      >
        <div className="w-[200px]">
          <Select onValueChange={setFilter} value={filter}>
            <SelectTrigger>
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Cleared</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </PageTable>

      <AssignTasksModal
        open={assignTask}
        onChange={setAssignTask}
        userID={debouncedUserId}
        onRefresh={fetchData}
      />

      <UpdateTaskModal
        open={!!selectedTask}
        onChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
        userID={debouncedUserId}
        task={selectedTask}
        onRefresh={fetchData}
      />

      <RepairTaskDetailSheet
        open={Boolean(repairId && selectedTaskDetail)}
        task={selectedTaskDetail}
        onOpenChange={(open) => {
          if (!open) updateRepairParam()
        }}
      />

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedTaskDelete}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove this item from the system"}
        onPressYes={() => handleDelete(selectedTaskDelete)}
        onPressCancel={() => setSelectedTaskDelete(null)}
      />
    </div>
  )
}

const AssignTasksModal = ({
  open,
  onChange,
  userID,
  onRefresh,
}: {
  open: boolean
  onChange: (val: boolean) => void
  userID: number
  onRefresh: () => Promise<void>
}) => {
  const [form, setForm] = useState<AssignForm>({
    assign_date: undefined,
    deliver_date: undefined,
    user_id: null,
    customer_id: null,
    charges: 0,
    remarks: "",
  })
  const [loading, setLoading] = useState(false)
  const { state: OfficeState } = useContext(OfficeContext)!

  const updateForm = (key: string, value: string | Date | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Placeholder function for API call
  const handleSaveTask = async () => {
    setLoading(true)

    axios
      .post(`/${userID}/lab`, {
        ...form,
        managing_office: OfficeState.value.data || "lahore",
      })
      .then(() => {
        onRefresh()
        setForm({
          assign_date: undefined,
          deliver_date: undefined,
          user_id: null,
          customer_id: null,
          charges: 0,
          remarks: "",
        })
        onChange(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-lg">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Assign Lab Task
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Schedule repair work, ownership, charges, and remarks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="flex flex-col gap-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase">
            {/* Schedule */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Schedule
              </FieldLegend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Assign Date */}
                <Field>
                  <FieldLabel>
                    Assign Date <RequiredStar />
                  </FieldLabel>
                  <AppCalendar
                    date={form.assign_date}
                    onChange={(date) => updateForm("assign_date", date)}
                    min={YESTERDAY}
                  />
                </Field>

                {/* Delivery Date */}
                <Field>
                  <FieldLabel>
                    Delivery Date <RequiredStar />
                  </FieldLabel>
                  <AppCalendar
                    date={form.deliver_date}
                    onChange={(date) => updateForm("deliver_date", date)}
                    min={YESTERDAY}
                    max={""}
                  />
                </Field>
              </div>
            </FieldSet>

            {/* Assignment Details */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Assignment Details
              </FieldLegend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Assigned To */}
                <Field>
                  <FieldLabel>
                    Assigned To <RequiredStar />
                  </FieldLabel>
                  <UserSearch
                    value={form.user_id}
                    onReturn={(e) => updateForm("user_id", e)}
                  />
                </Field>

                {/* Customer */}
                <Field>
                  <FieldLabel>
                    Customer <RequiredStar />
                  </FieldLabel>
                  <CustomerSearch
                    value={form.customer_id}
                    onReturn={(e) => updateForm("customer_id", e)}
                  />
                </Field>
              </div>

              {/* Charges */}
              <Field>
                <FieldLabel>
                  Charges <RequiredStar />
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Enter charges"
                  value={form.charges}
                  onChange={(e) =>
                    updateForm("charges", Number(e.target.value))
                  }
                />
              </Field>
            </FieldSet>

            {/* Remarks */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Remarks <RequiredStar />
              </FieldLegend>

              <Field>
                <Textarea
                  placeholder="Enter remarks"
                  value={form.remarks}
                  onChange={(e) => updateForm("remarks", e.target.value)}
                />
              </Field>
            </FieldSet>

            {/* Save Button */}
            <Button
              className="w-full"
              disabled={
                !form.assign_date ||
                !form.deliver_date ||
                !form.user_id ||
                !form.customer_id ||
                !form.charges ||
                !form.remarks ||
                loading
              }
              onClick={handleSaveTask}
            >
              {loading && <Spinner />} Save
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const UpdateTaskModal = ({
  open,
  onChange,
  userID,
  onRefresh,
  task,
}: {
  open: boolean
  onChange: (val: boolean) => void
  userID: number
  onRefresh: () => Promise<void>
  task: RepairingProps | null
}) => {
  useEffect(() => {
    if (open) {
      setForm({ status: null, remarks_other: "" })
      setLoading(false)
    }
  }, [open])
  const [form, setForm] = useState({
    status: null,
    remarks_other: "",
  })
  const [loading, setLoading] = useState(false)

  const updateForm = (key: string, value: Date | string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveTask = async () => {
    setLoading(true)

    axios
      .put(`/${userID}/lab/${task?.id}`, form)
      .then(() => {
        onRefresh()
        setForm({
          status: null,
          remarks_other: "",
        })
        onChange(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Update Task
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="flex flex-col gap-3 p-3.5 pb-4">
            <div>
              <p className="text-sm font-medium">
                Status <RequiredStar />
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={form.status === "pending" ? "default" : "outline"}
                  onClick={() => updateForm("status", "pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={form.status === "completed" ? "default" : "outline"}
                  onClick={() => updateForm("status", "completed")}
                >
                  Completed
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">Engineer remarks</p>
              <Textarea
                placeholder="Enter remarks"
                value={form.remarks_other}
                onChange={(e) => updateForm("remarks_other", e.target.value)}
              />
            </div>

            <Button disabled={!form.status || loading} onClick={handleSaveTask}>
              {loading && <Spinner />} Save
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function RepairTaskDetailSheet({
  open,
  task,
  onOpenChange,
}: {
  open: boolean
  task: RepairingProps | null
  onOpenChange: (open: boolean) => void
}) {
  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-14 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
              <Wrench className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle>Repair task details</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Assignment and repair information
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={
                task.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }
            >
              {task.status || "Pending"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2">
            <RepairDetail
              icon={UserRound}
              label="Customer"
              value={task.customer_name || "—"}
            />
            <RepairDetail
              icon={UserRound}
              label="Assigned to"
              value={task.user_name || "—"}
            />
            <RepairDetail
              icon={CalendarDays}
              label="Assigned date"
              value={formatRepairDate(task.assign_date)}
            />
            <RepairDetail
              icon={CalendarDays}
              label="Delivery date"
              value={formatRepairDate(task.deliver_date)}
            />
            <RepairDetail
              icon={UserRound}
              label="Sales person"
              value={task.owner_name || "—"}
            />
            <RepairDetail
              icon={CircleDollarSign}
              label="Charges"
              value={task.charges || "—"}
            />
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Task remarks
            </p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">
              {task.remarks || "No remarks provided."}
            </p>
          </section>

          <section className="rounded-xl border bg-muted/15 p-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Engineer remarks
            </p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">
              {task.remarks_other || "No engineer remarks provided."}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatRepairDate(value: string) {
  return value && moment(value).isValid()
    ? moment(value).format("DD MMM YYYY")
    : "—"
}

function RepairDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex size-7 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
        <Icon className="size-3.5" />
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-xs leading-5 font-medium">{value}</p>
    </div>
  )
}
