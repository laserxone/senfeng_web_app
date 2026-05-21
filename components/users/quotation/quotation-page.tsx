"use client"
import { QuotationForm } from "@/components/users/quotation/quotation-form";
import { QuotationPDF } from "@/components/users/quotation/quotation-pdf";
import { QuotationData } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import Heading from "../../ui/heading";

export default function QuotationPage() {

  const [isGenerating, setIsGenerating] = useState(false)
  const [quotationData, setQuotationData] = useState<QuotationData>({
    quotationNo: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    machineType: "",
    machinePower: "",
    priceOfMachine: "",
    validity: "",
    paymentTerms: "",
    deliveryTime: "",
  })

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(<QuotationPDF data={quotationData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Quotation-${quotationData.quotationNo || "draft"}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between gap-4 mt-2">
        <Heading title="Quotation" description="Create sales quotation" />
 <QuotationForm
          data={quotationData}
          onChange={setQuotationData}
          onGeneratePDF={handleGeneratePDF}
          isGenerating={isGenerating}
        />
      </div>

    </div>
  )
}