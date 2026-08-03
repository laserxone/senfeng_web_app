"use client"

import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import type { MyCustomer } from "@/lib/types"
import {
  Document,
  Image as PdfImage,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import {
  Box,
  Camera,
  Mail,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react"
import NextImage from "next/image"
import type { ChangeEvent, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

type CustomerMachineOrder = {
  id: number
  orderNumbers: string[]
  power: string
  model?: string
  serial: string
}

type GatePassFormValues = {
  partName: string
  partType: string
  partNumber: string
  partPrice: string
  quantity: string
  remarks: string
  carrierDetails: string
  trackingNo: string
}

type CheckState = {
  returnable: boolean
  gift: boolean
  selfCollection: boolean
  courier: boolean
  companyDelivery: boolean
}

export default function GatePassSlip() {
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null
  )
  const [selectedMachine, setSelectedMachine] =
    useState<CustomerMachineOrder | null>(null)
  const [formValues, setFormValues] = useState<GatePassFormValues>({
    partName: "",
    partType: "",
    partNumber: "",
    partPrice: "",
    quantity: "",
    remarks: "",
    carrierDetails: "",
    trackingNo: "",
  })
  const [checked, setChecked] = useState<CheckState>({
    returnable: false,
    gift: false,
    selfCollection: false,
    courier: false,
    companyDelivery: false,
  })
  const [photoDataUrl, setPhotoDataUrl] = useState("")
  const [photoName, setPhotoName] = useState("")
  const [pdfLoading, setPdfLoading] = useState(false)

  const customerNumber = useMemo(() => {
    if (!selectedCustomer?.number) return ""
    return Array.isArray(selectedCustomer.number)
      ? selectedCustomer.number.join(", ")
      : selectedCustomer.number
  }, [selectedCustomer])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const updateFormValue = (key: keyof GatePassFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  const updateChecked = (key: keyof CheckState, value: boolean) => {
    setChecked((current) => ({ ...current, [key]: value }))
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : "")
    }
    reader.readAsDataURL(file)
  }

  const handleCreatePdf = async () => {
    setPdfLoading(true)
    const docNo = `GP-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`

    try {
      const blob = await pdf(
        <GatePassPdfDocument
          checked={checked}
          customerNumber={customerNumber}
          date={today}
          docNo={docNo}
          formValues={formValues}
          photoDataUrl={photoDataUrl}
          selectedCustomer={selectedCustomer}
          selectedMachine={selectedMachine}
        />
      ).toBlob()
      saveAs(blob, `Gate-Pass-${docNo}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    setSelectedMachine(null)
  }, [selectedCustomer?.id])

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-3 print:bg-white">
      <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-md bg-white p-3 shadow-lg ring-1 ring-slate-200 sm:rounded-lg sm:p-4 print:shadow-none print:ring-0">
        {/* Header */}
        <header className="relative mb-3 border-b border-blue-700/70 pb-3 sm:mb-4 sm:pb-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_180px] md:items-start">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-[0.14em] text-blue-700 sm:text-3xl sm:tracking-[0.18em]">
                SENFENG
              </h1>

              <div className="mt-2 space-y-2 text-xs text-slate-700 sm:mt-3">
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-blue-700">
                      SENFENG PAKISTAN
                    </h3>
                    <p>Street# 2, Sharif Garden Daroghawaala,</p>
                    <p>Lahore, Punjab 54000, Pakistan</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-blue-700" />
                  <p className="break-all">senfenglaserpakistan@gmail.com</p>
                </div>
              </div>
            </div>

            <div className="flex justify-start md:justify-center">
              <div className="w-full rounded-md bg-blue-700 px-3 py-2 text-center shadow-sm sm:w-fit sm:px-5">
                <h2 className="text-sm font-bold tracking-wide text-white uppercase sm:text-base">
                  Gate Pass / Parts Issuance Slip
                </h2>
              </div>
            </div>

            <div className="space-y-2 rounded-md border bg-slate-50 p-2 text-xs md:w-[180px]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800">Doc No.:</span>
                <span className="h-5 flex-1 border-b border-slate-400" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-blue-700">Date:</span>
                <span className="font-semibold text-blue-700">{today}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Customer Section */}
        <Section
          number="1"
          title="Customer & Machine Information"
          icon={<User className="h-5 w-5" />}
          color="blue"
        >
          <div className="space-y-3">
            <div className="rounded-md border border-blue-100 bg-blue-50/60 p-2 print:hidden">
              <CustomerSearchWithData
                value={selectedCustomer}
                onReturn={setSelectedCustomer}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              <div className="space-y-2.5">
                <InputLine
                  label="Customer Name"
                  value={
                    selectedCustomer?.owner || selectedCustomer?.name || ""
                  }
                />
                <InputLine
                  label="Company Name"
                  value={
                    selectedCustomer?.company || selectedCustomer?.name || ""
                  }
                />
                <InputLine label="Contact Number" value={customerNumber} />
              </div>

              <div className="space-y-2.5 border-t border-dashed border-slate-300 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4">
                <InputLine
                  label="City"
                  value={selectedCustomer?.location || ""}
                />
                <InputLine
                  label="Machine Model"
                  value={
                    selectedMachine?.serial || selectedMachine?.power || ""
                  }
                />
                <MachineOrderSelect
                  customerId={selectedCustomer?.id}
                  value={selectedMachine}
                  onReturn={setSelectedMachine}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Product Section */}
        <Section
          number="2"
          title="Product / Part Information"
          icon={<Box className="h-5 w-5" />}
          color="teal"
        >
          <div className="grid gap-3 md:grid-cols-[190px_1fr] md:gap-4">
            <label className="group flex min-h-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-slate-400 transition hover:border-teal-400 hover:bg-teal-50/60 sm:min-h-[178px]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {photoDataUrl ? (
                <NextImage
                  src={photoDataUrl}
                  alt="Selected part"
                  width={190}
                  height={178}
                  unoptimized
                  className="h-full max-h-[178px] min-h-[150px] w-full object-cover sm:min-h-[178px]"
                />
              ) : (
                <>
                  <Camera className="mb-2 h-8 w-8 transition group-hover:text-teal-600 sm:h-10 sm:w-10" />
                  <p className="font-bold text-teal-700">PART PHOTO</p>
                  <p className="mt-1 text-xs">Attach photo here</p>
                </>
              )}
              {photoName ? (
                <span className="mt-2 max-w-[160px] truncate px-2 text-xs font-semibold text-teal-700 print:hidden">
                  {photoName}
                </span>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <InputBox
                label="Part Name"
                value={formValues.partName}
                onChange={(value) => updateFormValue("partName", value)}
              />
              <InputBox
                label="Part Type"
                value={formValues.partType}
                onChange={(value) => updateFormValue("partType", value)}
              />
              <InputBox
                label="Part Number"
                value={formValues.partNumber}
                onChange={(value) => updateFormValue("partNumber", value)}
              />
              <InputBox
                label="Part Price"
                value={formValues.partPrice}
                onChange={(value) => updateFormValue("partPrice", value)}
              />
              <InputBox
                label="Quantity"
                value={formValues.quantity}
                onChange={(value) => updateFormValue("quantity", value)}
              />
              <InputBox
                label="Remarks / Notes"
                value={formValues.remarks}
                onChange={(value) => updateFormValue("remarks", value)}
                tall
              />

              <div className="flex flex-col items-stretch justify-center gap-2 border-t border-dashed border-slate-300 pt-3 sm:col-span-2 sm:flex-row sm:items-center">
                <StatusToggle
                  label="Returnable"
                  color="teal"
                  checked={checked.returnable}
                  onChange={(value) => updateChecked("returnable", value)}
                />
                <StatusToggle
                  label="Gift / Non-Returnable"
                  color="orange"
                  checked={checked.gift}
                  onChange={(value) => updateChecked("gift", value)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Delivery Section */}
        <Section
          number="3"
          title="Delivery Information"
          icon={<Truck className="h-5 w-5" />}
          color="purple"
        >
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Mode of Delivery
              </p>

              <div className="grid gap-2 text-xs sm:grid-cols-3">
                <CheckOption
                  label="Self Collection"
                  checked={checked.selfCollection}
                  onChange={(value) => updateChecked("selfCollection", value)}
                />
                <CheckOption
                  label="Courier / Cargo"
                  checked={checked.courier}
                  onChange={(value) => updateChecked("courier", value)}
                />
                <CheckOption
                  label="Company Delivery"
                  checked={checked.companyDelivery}
                  onChange={(value) => updateChecked("companyDelivery", value)}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-dashed border-slate-300 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4">
              <InputBox
                label="Carrier / Courier Details"
                value={formValues.carrierDetails}
                onChange={(value) => updateFormValue("carrierDetails", value)}
              />
              <InputBox
                label="Tracking / AWB No."
                value={formValues.trackingNo}
                onChange={(value) => updateFormValue("trackingNo", value)}
              />
            </div>
          </div>
        </Section>

        {/* Approval Section */}
        <Section
          number="4"
          title="Issuance & Approval"
          icon={<ShieldCheck className="h-5 w-5" />}
          color="orange"
        >
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <SignatureCard title="Issued By" />
            <SignatureCard title="Authorized By" />
            <SignatureCard title="Approved By" />
          </div>
        </Section>

        <div className="mt-4 flex justify-stretch sm:justify-end print:hidden">
          <button
            type="button"
            onClick={handleCreatePdf}
            disabled={pdfLoading}
            className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            {pdfLoading ? "Creating PDF..." : "Create PDF"}
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-center gap-2 border-t border-slate-200 pt-3 text-center text-xs font-semibold text-blue-700 sm:gap-3">
          <span className="hidden h-px w-14 bg-blue-700 sm:block" />
          <PackageCheck className="h-4 w-4 shrink-0" />
          <span>Thank you for your business!</span>
          <span className="hidden h-px w-14 bg-blue-700 sm:block" />
        </footer>
      </div>
    </div>
  )
}

function GatePassPdfDocument({
  checked,
  customerNumber,
  date,
  docNo,
  formValues,
  photoDataUrl,
  selectedCustomer,
  selectedMachine,
}: {
  checked: CheckState
  customerNumber: string
  date: string
  docNo: string
  formValues: GatePassFormValues
  photoDataUrl: string
  selectedCustomer: MyCustomer | null
  selectedMachine: CustomerMachineOrder | null
}) {
  const customerName = selectedCustomer?.owner || selectedCustomer?.name || ""
  const companyName = selectedCustomer?.company || selectedCustomer?.name || ""
  const orderNumbers = selectedMachine?.orderNumbers?.join(", ") || ""
  const machineModel = selectedMachine?.serial || selectedMachine?.power || ""

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.brand}>SENFENG</Text>
            <View style={pdfStyles.addressBlock}>
              <Text style={pdfStyles.company}>SENFENG PAKISTAN</Text>
              <Text style={pdfStyles.small}>
                Street# 2, Sharif Garden Daroghawaala,
              </Text>
              <Text style={pdfStyles.small}>
                Lahore, Punjab 54000, Pakistan
              </Text>
              <Text style={pdfStyles.small}>
                senfenglaserpakistan@gmail.com
              </Text>
            </View>
          </View>
          <View style={pdfStyles.headerCenter}>
            <Text style={pdfStyles.screenTitle}>
              Gate Pass / Parts Issuance Slip
            </Text>
          </View>
          <View style={pdfStyles.docBox}>
            <View style={pdfStyles.docRow}>
              <Text style={pdfStyles.docLabel}>Doc No.:</Text>
              <Text style={pdfStyles.docLabel}>{docNo}</Text>
            </View>
            <View style={pdfStyles.docRow}>
              <Text style={pdfStyles.docDateLabel}>Date:</Text>
              <Text style={pdfStyles.docDate}>{date}</Text>
            </View>
          </View>
        </View>

        <PdfSection
          number="1"
          title="Customer & Machine Information"
          color="blue"
        >
          <View style={pdfStyles.customerGrid}>
            <View style={pdfStyles.customerColumn}>
              <PdfLineField
                label="Customer Name"
                value={customerName}
                color="blue"
              />
              <PdfLineField
                label="Company Name"
                value={companyName}
                color="blue"
              />
              <PdfLineField
                label="Contact Number"
                value={customerNumber}
                color="blue"
              />
            </View>
            <View style={[pdfStyles.customerColumn, pdfStyles.customerDivider]}>
              <PdfLineField
                label="City"
                value={selectedCustomer?.location || ""}
                color="blue"
              />
              <PdfLineField
                label="Machine Model"
                value={machineModel}
                color="blue"
              />
              <PdfLineField
                label="Machine Serial Number"
                value={orderNumbers}
                color="blue"
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection number="2" title="Product / Part Information" color="teal">
          <View style={pdfStyles.productRow}>
            <View style={pdfStyles.photoBox}>
              {photoDataUrl ? (
                <PdfImage src={photoDataUrl} style={pdfStyles.photo} />
              ) : (
                <Text style={pdfStyles.placeholder}>PART PHOTO</Text>
              )}
            </View>
            <View style={pdfStyles.productFields}>
              <View style={pdfStyles.twoCol}>
                <PdfBoxField label="Part Name" value={formValues.partName} />
                <PdfBoxField label="Part Type" value={formValues.partType} />
                <PdfBoxField
                  label="Part Number"
                  value={formValues.partNumber}
                />
                <PdfBoxField label="Part Price" value={formValues.partPrice} />
                <PdfBoxField label="Quantity" value={formValues.quantity} />
                <PdfBoxField
                  label="Remarks / Notes"
                  value={formValues.remarks}
                />
              </View>
              <View style={pdfStyles.statusRow}>
                <PdfStatusCheck
                  label="Returnable"
                  checked={checked.returnable}
                  color="teal"
                />
                <PdfStatusCheck
                  label="Gift / Non-Returnable"
                  checked={checked.gift}
                  color="orange"
                />
              </View>
            </View>
          </View>
        </PdfSection>

        <PdfSection number="3" title="Delivery Information" color="purple">
          <View style={pdfStyles.deliveryGrid}>
            <View style={pdfStyles.deliveryColumn}>
              <Text style={pdfStyles.deliveryTitle}>Mode of Delivery</Text>
              <View style={pdfStyles.deliveryOptions}>
                <PdfCheck
                  label="Self Collection"
                  checked={checked.selfCollection}
                />
                <PdfCheck label="Courier / Cargo" checked={checked.courier} />
                <PdfCheck
                  label="Company Delivery"
                  checked={checked.companyDelivery}
                />
              </View>
            </View>
            <View style={[pdfStyles.deliveryColumn, pdfStyles.customerDivider]}>
              <PdfBoxField
                label="Carrier / Courier Details"
                value={formValues.carrierDetails}
                full
              />
              <PdfBoxField
                label="Tracking / AWB No."
                value={formValues.trackingNo}
                full
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection number="4" title="Issuance & Approval" color="orange">
          <View style={pdfStyles.signatureRow}>
            <PdfSignature title="Issued By" />
            <PdfSignature title="Authorized By" />
            <PdfSignature title="Approved By" />
          </View>
        </PdfSection>

        <Text style={pdfStyles.footer}>Thank you for your business!</Text>
      </Page>
    </Document>
  )
}

function PdfSection({
  number,
  title,
  color,
  children,
}: {
  number: string
  title: string
  color: "blue" | "teal" | "purple" | "orange"
  children: ReactNode
}) {
  const colorStyle = pdfSectionColors[color]

  return (
    <View style={[pdfStyles.section, { borderColor: colorStyle.border }]}>
      <View
        style={[pdfStyles.sectionTab, { backgroundColor: colorStyle.fill }]}
      >
        <Text style={pdfStyles.sectionNumber}>{number}</Text>
        <Text style={pdfStyles.sectionTitle}>{title}</Text>
      </View>
      <View style={pdfStyles.sectionBody}>{children}</View>
    </View>
  )
}

function PdfLineField({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "blue" | "teal"
}) {
  return (
    <View style={pdfStyles.lineField}>
      <Text style={pdfStyles.fieldLabel}>{label}</Text>
      <Text
        style={[
          pdfStyles.lineValue,
          { borderColor: color === "blue" ? "#93c5fd" : "#5eead4" },
        ]}
      >
        {value || " "}
      </Text>
    </View>
  )
}

function PdfBoxField({
  label,
  value,
  full = false,
}: {
  label: string
  value: string
  full?: boolean
}) {
  return (
    <View style={full ? pdfStyles.boxFieldFull : pdfStyles.boxField}>
      <Text style={pdfStyles.boxLabel}>{label}</Text>
      <Text style={pdfStyles.boxValue}>{value || " "}</Text>
    </View>
  )
}

function PdfCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={pdfStyles.checkItem}>
      <Text style={pdfStyles.checkBox}>{checked ? "X" : ""}</Text>
      <Text style={pdfStyles.checkLabel}>{label}</Text>
    </View>
  )
}

function PdfStatusCheck({
  label,
  checked,
  color,
}: {
  label: string
  checked: boolean
  color: "teal" | "orange"
}) {
  const isTeal = color === "teal"

  return (
    <View
      style={[
        pdfStyles.statusCheck,
        {
          borderColor: isTeal ? "#14b8a6" : "#fb923c",
          backgroundColor: isTeal ? "#f0fdfa" : "#fff7ed",
        },
      ]}
    >
      <Text
        style={[
          pdfStyles.statusText,
          { color: isTeal ? "#0f766e" : "#ea580c" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          pdfStyles.statusBox,
          { borderColor: isTeal ? "#0f766e" : "#ea580c" },
        ]}
      >
        {checked ? "X" : ""}
      </Text>
    </View>
  )
}

function PdfSignature({ title }: { title: string }) {
  return (
    <View style={pdfStyles.signatureCard}>
      <Text style={pdfStyles.signatureTitle}>{title}</Text>
      <PdfSignatureLine label="Name:" />
      <PdfSignatureLine label="Signature:" />
      <PdfSignatureLine label="Date:" />
    </View>
  )
}

function PdfSignatureLine({ label }: { label: string }) {
  return (
    <View style={pdfStyles.signatureLine}>
      <Text style={pdfStyles.signatureLabel}>{label}</Text>
      <Text style={pdfStyles.signatureValue}> </Text>
    </View>
  )
}

const pdfSectionColors = {
  blue: { fill: "#1d4ed8", border: "#2563eb" },
  teal: { fill: "#0f766e", border: "#0d9488" },
  purple: { fill: "#7e22ce", border: "#9333ea" },
  orange: { fill: "#ea580c", border: "#f97316" },
}

const pdfStyles = StyleSheet.create({
  page: {
    padding: 14,
    fontSize: 8,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#1d4ed8",
    paddingBottom: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    width: 230,
  },
  headerCenter: {
    width: 210,
    alignItems: "center",
    paddingTop: 6,
  },
  brand: {
    color: "#1d4ed8",
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 4,
  },
  addressBlock: {
    marginTop: 8,
  },
  company: {
    color: "#1d4ed8",
    fontSize: 8,
    fontWeight: 800,
  },
  small: {
    color: "#475569",
    fontSize: 7,
    marginTop: 2,
  },
  screenTitle: {
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  docBox: {
    width: 128,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    padding: 7,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  docLabel: {
    width: 42,
    fontSize: 7,
    fontWeight: 700,
    color: "#1e293b",
  },
  docLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
  },
  docDateLabel: {
    width: 42,
    color: "#1d4ed8",
    fontSize: 7,
    fontWeight: 800,
  },
  docDate: {
    color: "#1d4ed8",
    fontSize: 8,
    fontWeight: 800,
  },
  section: {
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 7,
    overflow: "hidden",
  },
  sectionTab: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomRightRadius: 8,
  },
  sectionNumber: {
    width: 17,
    height: 17,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    textAlign: "center",
    fontSize: 10,
    fontWeight: 900,
    marginRight: 6,
    marginTop: 5,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  sectionBody: {
    padding: 9,
  },
  twoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  customerGrid: {
    flexDirection: "row",
  },
  customerColumn: {
    width: "50%",
    paddingRight: 8,
  },
  customerDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#cbd5e1",
    borderStyle: "dashed",
    paddingLeft: 10,
    paddingRight: 0,
  },
  lineField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  fieldLabel: {
    width: 82,
    color: "#1e293b",
    fontSize: 7,
    fontWeight: 700,
  },
  lineValue: {
    flex: 1,
    minHeight: 18,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#eff6ff",
    fontSize: 8,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  productRow: {
    flexDirection: "row",
  },
  photoBox: {
    width: 128,
    minHeight: 123,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  photo: {
    width: 128,
    height: 123,
  },
  placeholder: {
    color: "#0f766e",
    fontSize: 9,
    fontWeight: 800,
  },
  productFields: {
    flex: 1,
  },
  boxField: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 8,
  },
  boxFieldFull: {
    width: "100%",
    marginBottom: 8,
  },
  boxLabel: {
    color: "#1e293b",
    fontSize: 7,
    fontWeight: 700,
    marginBottom: 3,
  },
  boxValue: {
    minHeight: 20,
    borderWidth: 1,
    borderColor: "#5eead4",
    borderRadius: 4,
    fontSize: 8,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  statusRow: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    borderStyle: "dashed",
    paddingTop: 8,
    flexDirection: "row",
  },
  statusCheck: {
    width: 132,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    fontSize: 7,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  statusBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    textAlign: "center",
    fontSize: 8,
    fontWeight: 900,
    marginTop: 5,
  },
  deliveryGrid: {
    flexDirection: "row",
  },
  deliveryColumn: {
    width: "50%",
    paddingRight: 8,
  },
  deliveryTitle: {
    color: "#334155",
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 8,
  },
  deliveryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "33%",
    marginBottom: 8,
  },
  checkBox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: "#64748b",
    borderRadius: 2,
    textAlign: "center",
    fontSize: 7,
    marginRight: 5,
  },
  checkLabel: {
    fontSize: 7,
    color: "#334155",
  },
  signatureRow: {
    flexDirection: "row",
  },
  signatureCard: {
    width: "32%",
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 6,
    backgroundColor: "#fff7ed",
    padding: 8,
  },
  signatureTitle: {
    color: "#ea580c",
    fontSize: 9,
    fontWeight: 800,
    marginBottom: 10,
  },
  signatureLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  signatureLabel: {
    width: 48,
    fontSize: 7,
    color: "#334155",
    fontWeight: 600,
  },
  signatureValue: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#64748b",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    marginTop: 2,
    textAlign: "center",
    color: "#1d4ed8",
    fontSize: 8,
    fontWeight: 800,
  },
})

function Section({
  number,
  title,
  icon,
  color,
  children,
}: {
  number: string
  title: string
  icon: ReactNode
  color: "blue" | "teal" | "purple" | "orange"
  children: ReactNode
}) {
  const colors = {
    blue: "from-blue-700 to-blue-500 border-blue-600",
    teal: "from-teal-700 to-teal-500 border-teal-600",
    purple: "from-purple-700 to-purple-500 border-purple-600",
    orange: "from-orange-600 to-orange-400 border-orange-500",
  }

  return (
    <section
      className={`mb-3 overflow-hidden rounded-md border ${colors[color].split(" ")[2]} bg-white sm:rounded-lg`}
    >
      <div
        className={`flex w-full items-center gap-2 rounded-br-xl bg-gradient-to-r px-3 py-2 text-white sm:w-fit ${colors[color]}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-800">
          {number}
        </span>
        <span className="shrink-0">{icon}</span>
        <h3 className="min-w-0 text-xs font-bold tracking-wide uppercase sm:text-sm">
          {title}
        </h3>
      </div>

      <div className="p-2.5 sm:p-3">{children}</div>
    </section>
  )
}

function InputLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[118px_1fr] sm:items-center sm:gap-2">
      <label className="text-xs font-semibold text-slate-800">{label}</label>
      <input
        value={value}
        readOnly={value !== undefined}
        className="h-8 min-w-0 rounded-md border border-blue-300 px-2 text-sm outline-none read-only:bg-blue-50/50"
      />
    </div>
  )
}

function MachineOrderSelect({
  customerId,
  value,
  onReturn,
}: {
  customerId?: number
  value: CustomerMachineOrder | null
  onReturn: (value: CustomerMachineOrder | null) => void
}) {
  const { userID } = useUserDetail()
  const [items, setItems] = useState<CustomerMachineOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMachines() {
      if (!userID || !customerId) {
        setItems([])
        return
      }

      setLoading(true)
      try {
        const response: { data: CustomerMachineOrder[] } = await axios.get(
          `/${userID}/customer/${customerId}/limited`
        )
        setItems(response.data || [])
      } catch (error) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMachines()
  }, [customerId, userID])

  const placeholder = !customerId
    ? "Select customer first"
    : loading
      ? "Loading machines..."
      : "Select order / serial"

  return (
    <div className="grid gap-1 sm:grid-cols-[118px_1fr] sm:items-center sm:gap-2">
      <label className="text-xs font-semibold text-slate-800">
        Machine Serial Number
      </label>
      <Select
        value={value ? String(value.id) : ""}
        disabled={!customerId || loading}
        onValueChange={(selectedId) => {
          const selected =
            items.find((item) => String(item.id) === selectedId) || null
          onReturn(selected)
        }}
      >
        <SelectTrigger
          size="sm"
          className="h-8 w-full min-w-0 rounded-md border-blue-300 bg-white px-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 [&>span]:truncate"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.length === 0 && customerId && !loading ? (
            <SelectItem value="empty" disabled>
              No machines found
            </SelectItem>
          ) : (
            items.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {[
                  item.orderNumbers?.join(", "),
                  item.serial,
                  item.model || item.power,
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

function InputBox({
  label,
  value,
  onChange,
  tall = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  tall?: boolean
}) {
  return (
    <div className={tall ? "sm:row-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold text-slate-800">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full min-w-0 rounded-md border border-teal-300 px-2 text-sm outline-none ${
          tall ? "h-[70px]" : "h-8"
        }`}
      />
    </div>
  )
}

function StatusToggle({
  label,
  color,
  checked,
  onChange,
}: {
  label: string
  color: "teal" | "orange"
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const style =
    color === "teal"
      ? "border-teal-500 bg-teal-50 text-teal-700"
      : "border-orange-400 bg-orange-50 text-orange-600"

  return (
    <label
      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs font-bold uppercase sm:min-w-[180px] ${style}`}
    >
      <span className="min-w-0">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded-md border-2 border-current bg-white accent-current"
      />
    </label>
  )
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 font-medium text-slate-700 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-slate-400 accent-blue-700"
      />
      <span className="min-w-0">{label}</span>
    </label>
  )
}

function SignatureCard({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-orange-200 bg-orange-50/20 p-3">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-600">
        <User className="h-4 w-4 shrink-0" />
        {title}
      </h4>

      <div className="space-y-2 text-xs">
        <SignatureLine label="Name:" />
        <SignatureLine label="Signature:" />
        <SignatureLine label="Date:" />
      </div>
    </div>
  )
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="border-b border-slate-500" />
    </div>
  )
}
