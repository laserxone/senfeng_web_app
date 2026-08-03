"use client"

import AppCalendar from "@/components/features/calendar/app-calendar"
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data"
import { PricesSearch } from "@/components/shared/search/prices-search"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { MyCustomer, PricesSearchProps, QuotationData } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  Edit3,
  FileText,
  Mail,
  Phone,
  Settings,
  SquarePen,
  Truck,
  User,
  Users,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

export const quotationSchema = z
  .object({
    date: z.date({
      error: "Date is required",
    }),

    customer_name: z.string().min(1, "Customer / Company name is required"),

    contact_person: z.string().min(1, "Contact person is required"),

    contact_number: z.string().min(1, "Contact number is required"),

    email: z.string().optional(),

    machine_model: z.string().min(1, "Machine type is required"),

    machine_power: z.string().optional(),

    price: z.string().min(1, "Price is required"),

    original_pdf: z.string().optional(),

    validity: z.string().min(1, "Validity is required"),

    payment_terms: z.string().min(1, "Payment terms are required"),

    delivery_time: z.string().min(1, "Delivery time is required"),

    customer_id: z.union([z.string(), z.number()]),
  })
  .refine((val) => val.customer_id, {
    message: "Customer selection is required",
    path: ["customer_id"],
  })

export type QuotationFormValues = z.infer<typeof quotationSchema>

const defaultValues: QuotationData = {
  date: new Date(),
  customer_name: "",
  contact_person: "",
  contact_number: "",
  email: "",
  machine_model: "",
  machine_power: "",
  price: "",
  validity: "",
  payment_terms: "",
  delivery_time: "",
  customer_id: "",
  original_pdf: "",
}

export function QuotationFormEdit({
  onRefresh,
  data,
  id,
}: {
  onRefresh: () => Promise<void>
  data: null | QuotationData
  id?: number | string
}) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null
  )
  const [selectedMachine, setSelectedMachine] =
    useState<PricesSearchProps | null>(null)
  const [disable, setDisable] = useState(true)

  const { userID } = useUserDetail()

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues,
  })

  useEffect(() => {
    if (data) {
      form.reset({
        date: new Date(),
        customer_name: data.customer_name,
        contact_person: data.contact_person,
        contact_number: data.contact_number,
        email: data.email,
        machine_model: data.machine_model,
        machine_power: data.machine_power,
        price: data.price,
        validity: data.validity,
        payment_terms: data.payment_terms,
        delivery_time: data.delivery_time,
        customer_id: data.customer_id,
        original_pdf: data.original_pdf,
      })
    }
  }, [data])

  const paymentTerms = form.watch("payment_terms")

  useEffect(() => {
    if (!selectedMachine) return
    if (paymentTerms === "FOB" || paymentTerms === "EXW") {
      form.setValue("price", selectedMachine?.data?.fob || "", {
        shouldValidate: true,
      })
    }
    if (paymentTerms === "DDP") {
      form.setValue("price", selectedMachine?.data?.ddp || "", {
        shouldValidate: true,
      })
    }
  }, [selectedMachine, paymentTerms])

  useEffect(() => {
    if (!selectedMachine || !paymentTerms) return
    if (paymentTerms === "CFR") {
      form.setValue("price", "")
      setDisable(false)
    } else if (paymentTerms === "FOB" || paymentTerms === "EXW") {
      if (!selectedMachine?.data?.fob?.trim()) {
        setDisable(false)
      } else {
        setDisable(true)
      }
    } else if (paymentTerms === "DDP") {
      if (!selectedMachine?.data?.ddp?.trim()) {
        setDisable(false)
      } else {
        setDisable(true)
      }
    }
  }, [selectedMachine, paymentTerms])

  const handleGeneratePDF = async (values: QuotationData) => {
    if (!data?.id) return

    setIsGenerating(true)

    try {
      await axios.put(`/${userID}/quotation/${data.id}`, { ...values })
      await onRefresh()
      handleOpenChange(false)
    } catch (error) {
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)

    if (!value) {
      form.reset(defaultValues)
      setSelectedCustomer(null)
      setSelectedMachine(null)
    }
  }

  return (
    <>
      <Button size={"icon"} onClick={() => setOpen(true)}>
        <SquarePen />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-4xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Edit Quotation
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update customer, machine, pricing, and delivery terms.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <form
              onSubmit={form.handleSubmit(handleGeneratePDF)}
              className="space-y-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
            >
              <FieldSet className="rounded-xl border border-border bg-muted/20 p-3">
                <FieldLegend className="px-2 text-sm font-medium">
                  Basic Information
                </FieldLegend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Quotation No.</FieldLabel>
                    <Input placeholder="Auto generated" disabled />
                  </Field>

                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Date</FieldLabel>

                        <AppCalendar
                          date={field.value}
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

              <FieldSet className="mt-2 rounded-xl border border-border bg-muted/20 p-3">
                <FieldLegend className="flex items-center gap-2 px-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Customer Information
                </FieldLegend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    className="sm:col-span-2"
                    data-invalid={!!form.formState.errors.customer_id}
                  >
                    <FieldLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Select Customer
                    </FieldLabel>

                    <CustomerSearchWithData
                      value={selectedCustomer}
                      onReturn={(val) => {
                        setSelectedCustomer(val)

                        form.setValue("customer_id", val.id, {
                          shouldValidate: true,
                        })

                        form.setValue(
                          "customer_name",
                          val.name || val.owner || "",
                          { shouldValidate: true }
                        )

                        form.setValue("contact_person", val.owner || "", {
                          shouldValidate: true,
                        })

                        form.setValue(
                          "contact_number",
                          val?.number ? val.number.join(", ") : "",
                          { shouldValidate: true }
                        )

                        form.setValue("email", val?.email || "", {
                          shouldValidate: true,
                        })
                      }}
                    />

                    {form.formState.errors.customer_id && (
                      <FieldError
                        errors={[form.formState.errors.customer_id]}
                      />
                    )}
                  </Field>

                  <Controller
                    name="customer_name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Customer / Company Name
                        </FieldLabel>

                        <Input
                          placeholder="Enter customer or company name"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="contact_person"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Contact Person
                        </FieldLabel>

                        <Input
                          placeholder="Enter contact person name"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="contact_number"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Contact Number
                        </FieldLabel>

                        <Input placeholder="Enter contact number" {...field} />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                        </FieldLabel>

                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <FieldSet className="mt-2 rounded-xl border border-border bg-muted/20 p-3">
                <FieldLegend className="flex items-center gap-2 px-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-blue-600" />
                  Machine Details
                </FieldLegend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="sm:col-span-2">
                    <FieldLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Select Machine
                    </FieldLabel>

                    <PricesSearch
                      value={selectedMachine}
                      onReturn={(val) => {
                        setSelectedMachine(val)

                        form.setValue("machine_model", val.data?.model || "", {
                          shouldValidate: true,
                        })

                        form.setValue("machine_power", val.data?.power || "", {
                          shouldValidate: true,
                        })

                        form.setValue(
                          "original_pdf",
                          val.data?.attachment_url || "",
                          {
                            shouldValidate: true,
                          }
                        )
                      }}
                    />
                  </Field>

                  <Controller
                    name="machine_model"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Machine Type
                        </FieldLabel>

                        <Input
                          placeholder="e.g., Fiber Laser Cutting Machine"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="machine_power"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          Machine Power
                        </FieldLabel>

                        <Input placeholder="e.g., 3000W" {...field} />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="payment_terms"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Trade Terms
                        </FieldLabel>

                        <Select
                          disabled={!selectedMachine}
                          onValueChange={(val) => {
                            field.onChange(val)
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"EXW"}>EXW</SelectItem>
                            <SelectItem value={"FOB"}>FOB</SelectItem>
                            <SelectItem value={"CFR"}>CFR</SelectItem>
                            <SelectItem value={"DDP"}>DDP</SelectItem>
                          </SelectContent>
                        </Select>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="validity"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Validity (No of days)
                        </FieldLabel>

                        <Input placeholder="e.g., 30" {...field} />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="price"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Price of Machine
                        </FieldLabel>

                        <Input
                          placeholder="e.g., $50,000"
                          disabled={disable}
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="delivery_time"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          Delivery Time (No of days)
                        </FieldLabel>

                        <Input placeholder="e.g., 45" {...field} />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  "Updating..."
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Update Quotation
                  </>
                )}
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
