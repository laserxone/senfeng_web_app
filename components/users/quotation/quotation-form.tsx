"use client"

import { CustomerSearchWithData } from "@/components/customer-search-with-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MyCustomer, QuotationData } from "@/lib/types"
import { Building2, Clock, CreditCard, DollarSign, FileText, Mail, Phone, Settings, Truck, User, Users, Zap } from "lucide-react"
import { useState } from "react"

interface QuotationFormProps {
  data: QuotationData
  onChange: (data: QuotationData) => void
  onGeneratePDF: () => void
  isGenerating: boolean
}

export function QuotationForm({ data, onChange, onGeneratePDF, isGenerating }: QuotationFormProps) {
  const [open, setOpen] = useState(false)
  const handleChange = (field: keyof QuotationData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);

  function onClose() {
    onChange({
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
    setOpen(false)
    setSelectedCustomer(null)
  }

  return (
    <>
      <Button onClick={() => setOpen(!open)}>
        Create Quotation
      </Button>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Quotation Details
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[80vh]">

            <div className="space-y-6">
              {/* Quotation Details */}
              <Card>

                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quotationNo">Quotation No.</Label>
                    <Input
                      id="quotationNo"
                      placeholder="e.g., 2024-0001"
                      value={data.quotationNo}
                      onChange={(e) => handleChange("quotationNo", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={data.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">


                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="customerName" className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Select Customer
                    </Label>
                    <CustomerSearchWithData
                      value={selectedCustomer}
                      onReturn={(val) => {

                        setSelectedCustomer(val);
                        onChange({ ...data, customerName: val.name || val.owner || "", contactPerson: val.owner || "", contactNumber: val?.number ? val.number.join(", ") : "", email: val?.email || "" })
                      }}
                    />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Customer / Company Name
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer or company name"
                      value={data.customerName}
                      onChange={(e) => handleChange("customerName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Contact Person
                    </Label>
                    <Input
                      id="contactPerson"
                      placeholder="Enter contact person name"
                      value={data.contactPerson}
                      onChange={(e) => handleChange("contactPerson", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Contact Number
                    </Label>
                    <Input
                      id="contactNumber"
                      placeholder="Enter contact number"
                      value={data.contactNumber}
                      onChange={(e) => handleChange("contactNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={data.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>

                </CardContent>
              </Card>

              {/* Machine Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Machine Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="machineType" className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Machine Type
                    </Label>
                    <Input
                      id="machineType"
                      placeholder="e.g., Fiber Laser Cutting Machine"
                      value={data.machineType}
                      onChange={(e) => handleChange("machineType", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="machinePower" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Machine Power
                    </Label>
                    <Input
                      id="machinePower"
                      placeholder="e.g., 3000W"
                      value={data.machinePower}
                      onChange={(e) => handleChange("machinePower", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceOfMachine" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Price of Machine
                    </Label>
                    <Input
                      id="priceOfMachine"
                      placeholder="e.g., $50,000"
                      value={data.priceOfMachine}
                      onChange={(e) => handleChange("priceOfMachine", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validity" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Validity
                    </Label>
                    <Input
                      id="validity"
                      placeholder="e.g., 30 days"
                      value={data.validity}
                      onChange={(e) => handleChange("validity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment Terms
                    </Label>
                    <Input
                      id="paymentTerms"
                      placeholder="e.g., 50% advance, 50% before delivery"
                      value={data.paymentTerms}
                      onChange={(e) => handleChange("paymentTerms", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      Delivery Time
                    </Label>
                    <Input
                      id="deliveryTime"
                      placeholder="e.g., 45-60 working days"
                      value={data.deliveryTime}
                      onChange={(e) => handleChange("deliveryTime", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                onClick={onGeneratePDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>Generating PDF...</>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Generate & Download PDF
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </>
  )
}
