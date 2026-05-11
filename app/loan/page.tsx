"use client"

import { useState } from "react"
import {
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hash,
  ImagePlus,
  Layers,
  Mail,
  Phone,
  Receipt,
  Upload,
  User,
  Wallet,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface LoanFormData {
  // Employee Information
  employeeId: string
  employeeName: string
  department: string
  designation: string
  email: string
  phone: string
  monthlySalary: string
  employmentTenure: string
  
  // Loan Details
  loanAmount: string
  loanType: string
  purpose: string
  urgencyLevel: string
  
  // Timeline
  receivingDate: string
  returnDate: string
  firstInstallmentDate: string
  numberOfInstallments: string
  
  // Payment
  paymentMethod: string
  bankAccountNumber: string
  
  // Guarantor (Optional)
  guarantorName: string
  guarantorEmployeeId: string
  guarantorDepartment: string
  guarantorPhone: string
  
  // Documents
  chequeImages: File[]
  supportingDocuments: File[]
  
  // Agreement
  termsAccepted: boolean
  salaryDeductionConsent: boolean
}

const initialFormData: LoanFormData = {
  employeeId: "",
  employeeName: "",
  department: "",
  designation: "",
  email: "",
  phone: "",
  monthlySalary: "",
  employmentTenure: "",
  loanAmount: "",
  loanType: "",
  purpose: "",
  urgencyLevel: "",
  receivingDate: "",
  returnDate: "",
  firstInstallmentDate: "",
  numberOfInstallments: "",
  paymentMethod: "",
  bankAccountNumber: "",
  guarantorName: "",
  guarantorEmployeeId: "",
  guarantorDepartment: "",
  guarantorPhone: "",
  chequeImages: [],
  supportingDocuments: [],
  termsAccepted: false,
  salaryDeductionConsent: false,
}

export default function EmployeeLoanApplicationPage() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<LoanFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = <K extends keyof LoanFormData>(field: K, value: LoanFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChequeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateField("chequeImages", Array.from(e.target.files))
    }
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateField("supportingDocuments", Array.from(e.target.files))
    }
  }

  const calculateEMI = () => {
    const principal = parseFloat(formData.loanAmount) || 0
    const installments = parseInt(formData.numberOfInstallments) || 1
    if (principal && installments) {
      return (principal / installments).toFixed(2)
    }
    return "0.00"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log("Employee Loan Application Submitted:", formData)
    setIsSubmitting(false)
    setOpen(false)
    setFormData(initialFormData)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setOpen(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <Building2 className="size-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">
          Employee Loan Portal
        </h1>
        <p className="text-muted-foreground mb-2 text-lg">
          Internal Loan Management System
        </p>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-pretty text-sm">
          Apply for company-sponsored loans with convenient salary deduction options. 
          Quick processing, zero interest, and flexible repayment terms for all eligible employees.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Zero Interest</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Salary Deduction</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Quick Approval</span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-100">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Banknote className="relative size-6" />
              <span className="relative">Apply for Employee Loan</span>
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Banknote className="size-5 text-white" />
                </div>
                Employee Loan Application
              </DialogTitle>
              <DialogDescription>
                Complete all required fields to submit your loan request for approval.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Information Section */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <User className="size-4 text-emerald-600" />
                  Employee Information
                </FieldLegend>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Hash className="size-3.5 text-emerald-600" />
                      Employee ID *
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="e.g., EMP001"
                      value={formData.employeeId}
                      onChange={(e) => updateField("employeeId", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <User className="size-3.5 text-emerald-600" />
                      Full Name *
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.employeeName}
                      onChange={(e) => updateField("employeeName", e.target.value)}
                      required
                    />
                  </Field>

                

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Briefcase className="size-3.5 text-emerald-600" />
                      Designation *
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="e.g., Senior Developer"
                      value={formData.designation}
                      onChange={(e) => updateField("designation", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Mail className="size-3.5 text-emerald-600" />
                      Official Email *
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Phone className="size-3.5 text-emerald-600" />
                      Phone Number *
                    </FieldLabel>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Wallet className="size-3.5 text-emerald-600" />
                      Monthly Salary *
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Enter monthly salary"
                      min={0}
                      value={formData.monthlySalary}
                      onChange={(e) => updateField("monthlySalary", e.target.value)}
                      required
                    />
                  </Field>

                 
                </div>
              </FieldSet>

              {/* Loan Details Section */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <CreditCard className="size-4 text-emerald-600" />
                  Loan Details
                </FieldLegend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <CreditCard className="size-3.5 text-emerald-600" />
                      Loan Amount *
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Enter loan amount"
                      min={0}
                      value={formData.loanAmount}
                      onChange={(e) => updateField("loanAmount", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Receipt className="size-3.5 text-emerald-600" />
                      Loan Type *
                    </FieldLabel>
                    <Select 
                      value={formData.loanType} 
                      onValueChange={(value) => updateField("loanType", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency Loan</SelectItem>
                        <SelectItem value="medical">Medical Loan</SelectItem>
                        <SelectItem value="education">Education Loan</SelectItem>
                        <SelectItem value="housing">Housing Loan</SelectItem>
                        <SelectItem value="vehicle">Vehicle Loan</SelectItem>
                        <SelectItem value="wedding">Wedding Loan</SelectItem>
                        <SelectItem value="personal">Personal Loan</SelectItem>
                        <SelectItem value="advance-salary">Salary Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Clock className="size-3.5 text-emerald-600" />
                      Urgency Level *
                    </FieldLabel>
                    <Select 
                      value={formData.urgencyLevel} 
                      onValueChange={(value) => updateField("urgencyLevel", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (7-10 days)</SelectItem>
                        <SelectItem value="urgent">Urgent (3-5 days)</SelectItem>
                        <SelectItem value="critical">Critical (1-2 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field className="col-span-2">
                  <FieldLabel className="flex items-center gap-2 text-sm">
                    <FileText className="size-3.5 text-emerald-600" />
                    Purpose of Loan *
                  </FieldLabel>
                  <textarea
                    placeholder="Please provide a detailed explanation for the loan request (e.g., medical emergency, home renovation, education fees...)"
                    rows={3}
                    value={formData.purpose}
                    onChange={(e) => updateField("purpose", e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    required
                  />
                </Field>
              </FieldSet>

              {/* Repayment Schedule Section */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <CalendarDays className="size-4 text-emerald-600" />
                  Repayment Schedule
                </FieldLegend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Clock className="size-3.5 text-emerald-600" />
                      Expected Receiving Date *
                    </FieldLabel>
                    <Input
                      type="date"
                      value={formData.receivingDate}
                      onChange={(e) => updateField("receivingDate", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-3.5 text-emerald-600" />
                      Return Date *
                    </FieldLabel>
                    <Input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => updateField("returnDate", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-3.5 text-emerald-600" />
                      First Installment Date *
                    </FieldLabel>
                    <Input
                      type="date"
                      value={formData.firstInstallmentDate}
                      onChange={(e) => updateField("firstInstallmentDate", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Layers className="size-3.5 text-emerald-600" />
                      Number of Installments *
                    </FieldLabel>
                    <Select 
                      value={formData.numberOfInstallments} 
                      onValueChange={(value) => updateField("numberOfInstallments", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select installments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="2">2 Months</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="9">9 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                        <SelectItem value="18">18 Months</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Receipt className="size-3.5 text-emerald-600" />
                      Payment Method *
                    </FieldLabel>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => updateField("paymentMethod", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary-deduction">Salary Deduction</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <CreditCard className="size-3.5 text-emerald-600" />
                      Bank Account Number
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="For loan disbursement"
                      value={formData.bankAccountNumber}
                      onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                    />
                  </Field>
                </div>

                {/* EMI Calculator Display */}
                {formData.loanAmount && formData.numberOfInstallments && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-emerald-800">
                      <span className="font-medium">Estimated Monthly Deduction:</span>{" "}
                      <span className="text-lg font-bold">${calculateEMI()}</span>
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      This is an interest-free loan. Total repayment equals the loan amount.
                    </p>
                  </div>
                )}
              </FieldSet>

              {/* Guarantor Section (Optional) */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <User className="size-4 text-emerald-600" />
                  Guarantor Information
                  <span className="text-xs font-normal text-muted-foreground">(Required for loans above $5,000)</span>
                </FieldLegend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <User className="size-3.5 text-emerald-600" />
                      Guarantor Name
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Enter guarantor's full name"
                      value={formData.guarantorName}
                      onChange={(e) => updateField("guarantorName", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Hash className="size-3.5 text-emerald-600" />
                      Guarantor Employee ID
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="e.g., EMP002"
                      value={formData.guarantorEmployeeId}
                      onChange={(e) => updateField("guarantorEmployeeId", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Building2 className="size-3.5 text-emerald-600" />
                      Guarantor Department
                    </FieldLabel>
                    <Select 
                      value={formData.guarantorDepartment} 
                      onValueChange={(value) => updateField("guarantorDepartment", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="it">IT</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Phone className="size-3.5 text-emerald-600" />
                      Guarantor Phone
                    </FieldLabel>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.guarantorPhone}
                      onChange={(e) => updateField("guarantorPhone", e.target.value)}
                    />
                  </Field>
                </div>
              </FieldSet>

              {/* Document Upload Section */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <ImagePlus className="size-4 text-emerald-600" />
                  Document Attachments
                </FieldLegend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <ImagePlus className="size-3.5 text-emerald-600" />
                      Cheque Images
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleChequeUpload}
                        className="hidden"
                        id="cheque-upload"
                      />
                      <Label
                        htmlFor="cheque-upload"
                        className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/50 transition-colors"
                      >
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center px-2">
                          Upload post-dated cheque images
                        </span>
                      </Label>
                      {formData.chequeImages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.chequeImages.map((file, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-md truncate max-w-full"
                            >
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <FileText className="size-3.5 text-emerald-600" />
                      Supporting Documents
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <Label
                        htmlFor="document-upload"
                        className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/50 transition-colors"
                      >
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center px-2">
                          Medical bills, admission letters, etc.
                        </span>
                      </Label>
                      {formData.supportingDocuments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.supportingDocuments.map((file, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-md truncate max-w-full"
                            >
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </FieldSet>

              {/* Terms and Conditions */}
              <FieldSet className="border rounded-lg p-4 space-y-4">
                <FieldLegend className="text-base font-semibold flex items-center gap-2 px-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Terms and Acknowledgment
                </FieldLegend>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="salary-consent"
                      checked={formData.salaryDeductionConsent}
                      onCheckedChange={(checked) => 
                        updateField("salaryDeductionConsent", checked as boolean)
                      }
                      required
                    />
                    <Label htmlFor="salary-consent" className="text-sm leading-relaxed cursor-pointer">
                      I authorize the company to deduct the installment amount from my monthly salary until the loan is fully repaid. I understand that in case of resignation or termination, the remaining balance will be deducted from my final settlement.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-accepted"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        updateField("termsAccepted", checked as boolean)
                      }
                      required
                    />
                    <Label htmlFor="terms-accepted" className="text-sm leading-relaxed cursor-pointer">
                      I confirm that all information provided is accurate and complete. I have read and agree to the company&apos;s employee loan policy and understand that providing false information may result in disciplinary action.
                    </Label>
                  </div>
                </div>
              </FieldSet>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.termsAccepted || !formData.salaryDeductionConsent}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <p className="mt-8 text-xs text-muted-foreground">
          For assistance, contact HR at hr@company.com or ext. 1234
        </p>
      </div>
    </main>
  )
}
