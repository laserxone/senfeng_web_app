import Dropzone from "@/components/dropzone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { DeleteFromStorage } from "@/lib/deleteFunction"
import { MachineProps, MyCustomer, PartsProps, SalesVisitTypes } from "@/lib/types"
import { UploadImage } from "@/lib/uploadFunction"
import { OfficeContext } from "@/store/context/OfficeContext"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarDays,
  Camera,
  CirclePlus,
  Clock3,
  ExternalLink,
  Filter,
  ImageIcon,
  MapPin,
  MapPinOff,
  MessageSquareText,
  Phone,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import "react-medium-image-zoom/dist/styles.css"
import { z } from "zod"
import AddCustomerDialog from "../addCustomer"
import AppCalendar from "../appCalendar"
import { CustomerSearchWithData } from "../customer-search-with-data"
import { MyImgZooming } from "../img-zooming"
import { Field, FieldError, FieldLabel } from "../ui/field"
import { Label } from "../ui/label"
import Spinner from "../ui/spinner"
import FilterSheet from "./filterSheet"

const formSchema = z.object({
  note: z.string().min(1, "Note cannot be empty"),
  image: z.string().min(1, "image cannot be empty"),
  next: z.date(),
  city: z.string().min(1, "City is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
})

type FormValues = z.infer<typeof formSchema>

type LocalCustomerDetailProps = Omit<MyCustomer, "machines"> & {
  bill_received: number;
  bill_total: number;
  profile_completion: number;
  lead_name?: string
  parts: PartsProps[];
  machines: MachineProps[]
}


type VisitTabProps = {
  id: number | null | string
  data: SalesVisitTypes[]
  onRefresh: () => Promise<void>
  customer_data?: {
    id?: number
    location?: string,
    owner?: string,
    number?: string[],
    name?: string
  } | null
  height?: string
  onFetchData?: (a: string, b: string, c?: number) => Promise<void>
}
export default function VisitTab({
  id,
  data,
  onRefresh,
  customer_data,
  onFetchData,
}: VisitTabProps) {
  const [loading, setLoading] = useState(false)
  const [addCustomer, setAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null
  )
  const { userID, designation, base_route, route_branch } = useUserDetail()
  const { state: OfficeState } = useContext(OfficeContext)!
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<number | null>(null)
  const feedbacks = useMemo(
    () =>
      [...(data || [])].sort(
        (a, b) =>
          moment(b?.created_at).valueOf() - moment(a?.created_at).valueOf()
      ),
    [data]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      image: "",
      next: undefined,
      city: "",
      name: "",
      phone: "",
      company: "",
    },
  })

  useEffect(() => {
    if (customer_data?.id) {
      setSelectedCustomer({ id: customer_data.id })
      form.setValue("city", customer_data?.location || "")
      form.setValue("name", customer_data?.owner || "")
      form.setValue(
        "phone",
        customer_data.number ? customer_data?.number?.join(", ") : ""
      )
      form.setValue("company", customer_data?.name || "")
    }
  }, [customer_data])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/customer/${selectedCustomer?.id}/visit/${moment()
          .valueOf()
          .toString()}.png`
        await UploadImage(values.image, name)
        await axios.post(`/${id}/visit`, {
          ...values,
          user_id: id,
          image: name,
          customer_id: selectedCustomer?.id,
        })
        await onRefresh()
        form.reset()
        setSelectedCustomer(customer_data?.id ? { id: customer_data?.id } : null)
        setLoading(false)
      } else {
        await axios.post(`/${id}/visit`, {
          ...values,
          user_id: id,
          customer_id: selectedCustomer?.id,
        })
        await onRefresh()
        form.reset()
        setSelectedCustomer(customer_data?.id ? { id: customer_data?.id } : null)
        setLoading(false)
      }
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  async function handleDelete(item: SalesVisitTypes) {
    try {
      setSelectedDelete(item.id)
      DeleteFromStorage(item.image)
      axios
        .delete(`/${userID}/visit/${item.id}`)
        .then(async () => {
          await onRefresh()
        })
        .finally(() => {
          setSelectedDelete(null)
        })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="w-full p-1">
      <div className="w-full space-y-3">
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-zinc-950 dark:ring-white/10 p-0">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/80 px-3 py-2 dark:bg-zinc-900/70">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold leading-none">
                    Add Visit
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quick note, follow-up, and proof in one place
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                {feedbacks.length} visits
              </Badge>
            </div>
            <form
              onSubmit={form.handleSubmit(onSubmit, (err) => {
                console.log("Validation Errors", err)
              })}
              className="space-y-2.5 p-3"
            >
              {!customer_data?.id && (
                <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/25 p-2 ring-1 ring-border/50">
                  <div className="min-w-[260px] flex-1 space-y-1">
                    <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Customer
                    </Label>
                    <CustomerSearchWithData
                      value={selectedCustomer}
                      onReturn={(val) => {
                        setSelectedCustomer(val)
                        form.setValue("city", val?.location || "")
                        form.setValue("name", val?.owner || "")
                        form.setValue(
                          "phone",
                          val.number ? val?.number?.join(", ") : ""
                        )
                        form.setValue("company", val?.name || "")
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAddCustomer(true)}
                  >
                    <CirclePlus className="h-3.5 w-3.5" />
                    Add
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null)
                      form.reset()
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setFilterVisible(true)}
                    variant="outline"
                    size="icon-sm"
                    aria-label="Filter visits"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>

                  <FilterSheet
                    visible={filterVisible}
                    onClose={() => setFilterVisible(false)}
                    onReturn={async (val) => {
                      await onFetchData?.(val.start, val.end, val.user)
                    }}
                  />

                  <AddCustomerDialog
                    user_designation={designation}
                    office={route_branch}
                    user_id={userID}
                    ownership={
                      designation === "Owner" ||
                      designation === "Customer Relationship Manager" ||
                      designation ===
                      "Customer Relationship Manager (After Sales)"
                    }
                    visible={addCustomer}
                    onClose={setAddCustomer}
                    onRefresh={async (newRow) => {
                      const finalData = {
                        ...newRow,
                        search: newRow.name || newRow.owner,
                      }
                      setSelectedCustomer(finalData)
                    }}
                  />
                </div>
              )}

              <div className="grid gap-2.5 xl:grid-cols-[240px_minmax(0,1fr)_210px]">
                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="gap-1.5"
                    >
                      <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Image
                      </FieldLabel>
                      <div className="flex items-center">
                        <Dropzone
                          value={field.value}
                          onDrop={(file) => field.onChange(file)}
                          title={"Click to upload"}
                          subheading={"or drag and drop"}
                          description={"PNG or JPG"}
                          drag={"Drop the files here..."}
                          className="min-h-20 w-full border-dashed bg-slate-50/70 dark:bg-zinc-900/70"
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="next"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="gap-1.5 xl:order-3"
                    >
                      <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Next follow up
                      </FieldLabel>
                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        min={new Date()}
                        max={""}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="note"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="gap-1.5 xl:order-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Remarks
                        </FieldLabel>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 text-[10px]"
                        >
                          {feedbacks.length} visits
                        </Badge>
                      </div>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Write visit summary, decisions, and pending work..."
                        aria-invalid={fieldState.invalid}
                        className="min-h-20 resize-none rounded-lg bg-slate-50/70 text-sm shadow-inner dark:bg-zinc-900/70"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Button
                disabled={!selectedCustomer?.id || loading}
                type="submit"
                className="h-8 w-full rounded-lg"
              >
                {loading && <Spinner />} Post Visit
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/70 px-3 py-2 dark:bg-zinc-900/70">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold leading-none">
                  Visit History
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest visits first
                </p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full bg-background text-[10px]">
              {feedbacks.length} total
            </Badge>
          </div>

          {feedbacks.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <MessageSquareText className="h-5 w-5" />
              No visits recorded yet
            </div>
          ) : (
            <div className="divide-y">
              {feedbacks.map((feedback, index) => (
                <VisitRecord
                  key={feedback.id || index}
                  feedback={feedback}
                  baseRoute={base_route}
                  deleting={selectedDelete === feedback.id}
                  onDelete={() => handleDelete(feedback)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VisitRecord({
  feedback,
  baseRoute,
  deleting,
  onDelete,
}: {
  feedback: SalesVisitTypes
  baseRoute: string
  deleting: boolean
  onDelete: () => void
}) {
  const hasLocation = feedback.location && feedback.location.length > 0
  const customerLabel =
    feedback?.customer_name ||
    feedback?.company ||
    feedback?.customer_owner ||
    "Customer"
  const customerNumber =
    feedback?.customer_number?.join(", ") || feedback.phone || "No phone"

  return (
    <div className="group bg-background/95 transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-900/70">
      <div className="grid gap-0 p-3 lg:grid-cols-[minmax(0,1fr)_148px]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <CalendarDays className="h-3 w-3" />
                  {moment(new Date(feedback.created_at)).format("YYYY-MM-DD")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {moment(new Date(feedback.created_at)).format("hh:mm A")}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  <span className="truncate">{feedback?.user_name || "Unknown"}</span>
                </span>
              </div>

              <Link
                target="_blank"
                href={`/${baseRoute}/${feedback.customer_member ? "member" : "customer"
                  }/${feedback.customer_id}`}
                className="group/link inline-flex max-w-full items-center gap-1.5 text-sm font-semibold hover:text-primary"
              >
                <span className="truncate">{customerLabel}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover/link:opacity-100" />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2 text-xs"
                disabled={!hasLocation}
                onClick={() => {
                  if (!hasLocation) return
                  const mapUrl = `https://www.google.com/maps?q=${feedback.location[0]},${feedback.location[1]}`
                  window.open(mapUrl, "_blank")
                }}
              >
                {hasLocation ? (
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <MapPinOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Map
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-full text-destructive hover:text-destructive"
                disabled={deleting}
                onClick={onDelete}
                aria-label="Delete visit"
              >
                {deleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 dark:bg-zinc-900">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {feedback?.customer_location || feedback.city || "No location"}
              </span>
            </span>
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 dark:bg-zinc-900">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{customerNumber}</span>
            </span>
          </div>

          {(feedback?.problem || feedback?.solution) && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {feedback?.problem && (
                <VisitDetail label="Problem" value={feedback.problem} />
              )}
              {feedback?.solution && (
                <VisitDetail label="Solution" value={feedback.solution} />
              )}
            </div>
          )}

          <div className="flex gap-2 bg-muted rounded-lg px-3 py-2 text-sm leading-5 whitespace-pre-wrap dark:bg-zinc-900/80 items-center mr-2">
            <MessageSquareText className="h-3 w-3" />
            <p className="text-xs">
              {feedback.note}
            </p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 lg:mt-0 lg:grid-cols-1 lg:border-l lg:pl-3">
          {feedback.signature ? (
            <MediaPreview
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="Signature"
            >
              <MyImgZooming img={feedback.signature} compact />
            </MediaPreview>
          ) : null}
          {feedback.image ? (
            <MediaPreview
              icon={<Camera className="h-3.5 w-3.5" />}
              label="Photo"
            >
              <MyImgZooming img={feedback.image} compact />
            </MediaPreview>
          ) : null}
          {!feedback.signature && !feedback.image && (
            <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground lg:min-h-full">
              No media
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VisitDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="line-clamp-2 text-sm leading-5 text-slate-700 dark:text-zinc-200">
        {value}
      </p>
    </div>
  )
}

function MediaPreview({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className="flex min-h-12 items-center justify-center overflow-hidden rounded-md bg-background">
        {children}
      </div>
    </div>
  )
}

