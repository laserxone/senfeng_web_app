"use client"

import AppCalendar from "@/components/appCalendar"
import { CustomerSearchWithData } from "@/components/customer-search-with-data"
import { PricesSearch } from "@/components/prices-search"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuotationPDF } from "@/components/users/quotation/quotation-pdf"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { formatPrice } from "@/lib/formatPrice"
import { MyCustomer, PricesSearchProps, QuotationData } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { pdf } from "@react-pdf/renderer"
import {
  Building2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Settings,
  Truck,
  User,
  Users,
  Zap,
} from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

export const quotationSchema = z.object({
  date: z.date({
    error: "Date is required",
  }),

  customer_name: z
    .string()
    .min(1, "Customer / Company name is required"),

  contact_person: z
    .string()
    .min(1, "Contact person is required"),

  contact_number: z
    .string()
    .min(1, "Contact number is required"),

  email: z
    .string().optional(),

  machine_model: z
    .string()
    .min(1, "Machine type is required"),

  machine_power: z
    .string()
    .optional(),

  price: z
    .string()
    .min(1, "Price is required"),

  original_pdf: z
    .string()
    .optional(),

  validity: z
    .string()
    .min(1, "Validity is required"),

  payment_terms: z
    .string()
    .min(1, "Payment terms are required"),

  delivery_time: z
    .string()
    .min(1, "Delivery time is required"),

  customer_id: z
    .union([z.string(), z.number()])
}).refine((val) => val.customer_id, {
  message: "Customer selection is required",
  path: ["customer_id"]
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
  original_pdf: ""
}

export function QuotationForm({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<PricesSearchProps | null>(null)
  const [disable, setDisable] = useState(true)

  const { userID } = useUserDetail()

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues,
  })

  const handleGeneratePDF = async (data: QuotationData) => {

    setIsGenerating(true)

    try {
      const res = await axios.post(`/${userID}/quotation`, { ...data, user_id: userID })
      const resID = res.data?.id || ""
      const finalData = { ...data, id: resID }

      const generatedPdfBlob = await pdf(<QuotationPDF data={finalData} />).toBlob()
      const generatedPdfBytes = await generatedPdfBlob.arrayBuffer()
      const firebasePdfUrl = data?.original_pdf
      if (firebasePdfUrl) {
        const firebasePdfResponse = await fetch(firebasePdfUrl)
        const firebasePdfBytes = await firebasePdfResponse.arrayBuffer()

        const mergedPdf = await PDFDocument.create()

        const generatedPdfDoc = await PDFDocument.load(generatedPdfBytes)
        const firebasePdfDoc = await PDFDocument.load(firebasePdfBytes)

        const generatedPages = await mergedPdf.copyPages(
          generatedPdfDoc,
          generatedPdfDoc.getPageIndices()
        )

        generatedPages.forEach((page) => mergedPdf.addPage(page))

        const firebasePages = await mergedPdf.copyPages(
          firebasePdfDoc,
          firebasePdfDoc.getPageIndices()
        )

        firebasePages.forEach((page) => mergedPdf.addPage(page))

        // 5. Download final merged PDF
        const mergedPdfBytes = await mergedPdf.save()

        const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], {
          type: "application/pdf",
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")


        let normalName = data.customer_name;

        const nameParts = normalName.trim().split(/\s+/);

        if (nameParts.length > 2) {
          normalName = nameParts.slice(0, 2).join(" ");
        }


        let downloadName = `${normalName} ${data.contact_person || ""}-${data.machine_model}-${data.machine_power}-${data.payment_terms || ""}${formatPrice(data.price)}.pdf`

        link.href = url
        link.download = downloadName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      }
      else {
        const url = URL.createObjectURL(generatedPdfBlob)

        const link = document.createElement("a")
        link.href = url
        link.download = `Quotation-${finalData.id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      }
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



  const paymentTerms = form.watch("payment_terms")

  useEffect(() => {
    if (!selectedMachine) return
    if (paymentTerms === 'FOB' || paymentTerms === 'EXW') {
      form.setValue("price", selectedMachine?.data?.fob || "", {
        shouldValidate: true,
      })
    }
    if (paymentTerms === 'DDP') {
      form.setValue("price", selectedMachine?.data?.ddp || "", {
        shouldValidate: true,
      })
    }
  }, [selectedMachine, paymentTerms])

  useEffect(() => {

    if (!selectedMachine || !paymentTerms) return
    if (paymentTerms === 'CFR') {
      form.setValue("price", "")
      setDisable(false)
    }
    else if (paymentTerms === 'FOB' || paymentTerms === 'EXW') {

      if (!selectedMachine?.data?.fob?.trim()) {

        setDisable(false)
      }
      else {
        setDisable(true)
      }
    }
    else if (paymentTerms === 'DDP') {

      if (!selectedMachine?.data?.ddp?.trim()) {

        setDisable(false)
      } else {
        setDisable(true)
      }
    }

  }, [selectedMachine, paymentTerms])

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Quotation</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Quotation Details
            </DialogTitle>
          </DialogHeader>



          <form
            onSubmit={form.handleSubmit(handleGeneratePDF)}
            className="space-y-5"
          >
            <ScrollArea className="h-[calc(100dvh-200px)] pr-4">
              <FieldSet className="rounded-xl border bg-muted/20 p-4">
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

              <FieldSet className="rounded-xl border bg-muted/20 p-4 mt-2">
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

                        form.setValue(
                          "contact_person",
                          val.owner || "",
                          { shouldValidate: true }
                        )

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

                        <Input
                          placeholder="Enter contact number"
                          {...field}
                        />

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

              <FieldSet className="rounded-xl border bg-muted/20 p-4 mt-2">
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

                        form.setValue(
                          "machine_model",
                          val.data?.model || "",
                          { shouldValidate: true }
                        )

                        form.setValue(
                          "machine_power",
                          val.data?.power || "",
                          { shouldValidate: true }
                        )

                        form.setValue("original_pdf", val.data?.attachment_url || "", {
                          shouldValidate: true,
                        })


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

                        <Input disabled={disable} placeholder="e.g., $50,000"
                          // disabled={form.watch("payment_terms") !== 'CFR'}
                          {...field} />

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

                        <Input
                          placeholder="e.g., 45"
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

            </ScrollArea>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                "Generating PDF..."
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </form>


        </DialogContent>
      </Dialog>
    </>
  )
}