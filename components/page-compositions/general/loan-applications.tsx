"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  History,
  ImagePlus,
  Layers,
  Receipt,
  Settings,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

interface LoanFormData {
  employeeId: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string;
  monthlySalary: string;
  employmentTenure: string;
  loanAmount: string;
  loanType: string;
  purpose: string;
  urgencyLevel: string;
  receivingDate: Date | undefined;
  returnDate: Date | undefined;
  firstInstallmentDate: Date | undefined;
  numberOfInstallments: string;
  paymentMethod: string;
  bankAccountNumber: string;
  guarantorName: string;
  guarantorEmployeeId: string;
  guarantorDepartment: string;
  guarantorPhone: string;
  chequeImages: File[];
  supportingDocuments: File[];
  termsAccepted: boolean;
  salaryDeductionConsent: boolean;
  hierarchyId: string;
}

const initialFormData: LoanFormData = {
  employeeId: "",
  employeeName: "",
  designation: "",
  email: "",
  phone: "",
  monthlySalary: "",
  employmentTenure: "",
  loanAmount: "",
  loanType: "",
  purpose: "",
  urgencyLevel: "",
  receivingDate: undefined,
  returnDate: undefined,
  firstInstallmentDate: undefined,
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
  hierarchyId: "",
};

type Approver = {
  id: number;
  user_id: number;
  approval_order: number;
  user_name: string;
  user_email: string;
  user_designation: string;
};

type Hierarchy = {
  id: number;
  name: string;
  hierarchy_type: string;
  description: string | null;
  approvers: Approver[] | null;
};

type ApprovalStep = {
  id: number;
  approver_id: number;
  approval_order: number;
  status: "pending" | "approved" | "rejected";
  comments: string | null;
  acted_at: string | null;
  approver_name: string;
  approver_designation: string;
};

type LoanApplication = {
  id: number;
  application_number: string;
  applicant_name: string;
  applicant_designation: string;
  hierarchy_name: string | null;
  loan_amount: number;
  loan_type: string;
  purpose: string;
  urgency_level: string;
  num_installments: number;
  status: "pending" | "in_progress" | "approved" | "rejected" | "disbursed";
  current_approver_order: number;
  created_at: string;
  approval_steps: ApprovalStep[] | null;
  cheque_images?: string[];
  supporting_documents?: string[];
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-purple-100 text-purple-700",
};

const urgencyColors: Record<string, string> = {
  normal: "bg-gray-100 text-gray-700",
  urgent: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function LoanApplications() {
  const { userID, base_route } = useUserDetail();
  const [formData, setFormData] = useState<LoanFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailApplication, setDetailApplication] =
    useState<LoanApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [allApplications, setAllApplications] = useState<LoanApplication[]>([]);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("applications");
  const [selectedForDelete, setSelectedForDelete] =
    useState<LoanApplication | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {
    if (userID) {
      fetchData();
      fetchHierarchy();
      fetchDataAll();
    }
  }, [userID]);

  const updateLoanApplicationQuery = useCallback(
    (applicationId?: string | number) => {
      const url = new URL(window.location.href);

      if (applicationId !== undefined) {
        url.searchParams.set("l", String(applicationId));
        window.history.pushState({}, "", url);
      } else {
        url.searchParams.delete("l");
        window.history.replaceState({}, "", url);
      }

      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [],
  );

  useEffect(() => {
    const syncLoanApplicationFromUrl = () => {
      const applicationId = new URLSearchParams(window.location.search).get(
        "l",
      );
      const application = applicationId
        ? allApplications.find((item) => String(item.id) === applicationId)
        : undefined;

      setDetailApplication(application || null);
      setIsDetailOpen(Boolean(application));
    };

    syncLoanApplicationFromUrl();
    window.addEventListener("popstate", syncLoanApplicationFromUrl);

    return () => {
      window.removeEventListener("popstate", syncLoanApplicationFromUrl);
    };
  }, [allApplications]);

  function handleDetailOpenChange(nextOpen: boolean) {
    setIsDetailOpen(nextOpen);

    if (!nextOpen) {
      updateLoanApplicationQuery();
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await axios.get(
        `/${userID}/loan-applications?applicant_id=${userID}`,
      );
      setApplications(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDataAll() {
    setLoading(true);
    try {
      const res = await axios.get(`/${userID}/loan-applications`);
      setAllApplications(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHierarchy() {
    try {
      const res = await axios.get(`/${userID}/hierarchies`);
      if (res.data?.length) {
        const found = res.data?.filter(
          (item: Hierarchy) => item.hierarchy_type === "loan",
        );
        if (found && found?.length > 0) {
          updateField("hierarchyId", found?.[0]?.id?.toString());
        }
      }
      setHierarchies(res.data);
    } finally {
    }
  }

  async function handleDelete() {
    if (!selectedForDelete?.id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(
        `/${userID}/loan-applications/${selectedForDelete.id}`,
      );
      await fetchData();
      await fetchDataAll();
      setSelectedForDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const updateField = <K extends keyof LoanFormData>(
    field: K,
    value: LoanFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChequeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateField("chequeImages", Array.from(e.target.files));
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateField("supportingDocuments", Array.from(e.target.files));
    }
  };

  const calculateEMI = () => {
    const principal = parseFloat(formData.loanAmount) || 0;
    const installments = parseInt(formData.numberOfInstallments) || 1;
    if (principal && installments) {
      return (principal / installments).toFixed(0);
    }
    return "0";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHierarchy?.approvers?.length) {
      toast.error(
        "The selected loan hierarchy must have at least one approver.",
      );
      return;
    }

    setIsSubmitting(true);

    const supportingDocumentPaths = await Promise.all(
      formData.supportingDocuments.map(async (file: File, index: number) => {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `loan-applications/${userID}/supporting-documents/${Date.now()}-${fileName}`;
        await UploadImage(
          URL.createObjectURL(file),
          path,
          file.type || "application/octet-stream",
        );

        return path;
      }),
    );

    // Upload cheque images
    const chequeImagePaths = await Promise.all(
      formData.chequeImages.map(async (file: File, index: number) => {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `loan-applications/${userID}/cheques/${Date.now()}-${fileName}`;
        await UploadImage(
          URL.createObjectURL(file),
          path,
          file.type || "application/octet-stream",
        );

        return path;
      }),
    );

    try {
      await axios.post(`/${userID}/loan-applications`, {
        applicant_id: userID,
        hierarchy_id: formData.hierarchyId
          ? parseInt(formData.hierarchyId)
          : null,
        loan_amount: parseFloat(formData.loanAmount),
        loan_type: formData.loanType,
        purpose: formData.purpose,
        urgency_level: formData.urgencyLevel || "normal",
        receiving_date: formData.receivingDate || null,
        return_date: formData.returnDate || null,
        first_installment_date: formData.firstInstallmentDate || null,
        num_installments: parseInt(formData.numberOfInstallments),
        payment_method: formData.paymentMethod || null,
        bank_account: formData.bankAccountNumber || null,
        guarantor_name: formData.guarantorName || null,
        guarantor_department: formData.guarantorDepartment || null,
        guarantor_phone: formData.guarantorPhone || null,
        salary_deduction_consent: formData.salaryDeductionConsent,
        terms_accepted: formData.termsAccepted,
        cheque_images: chequeImagePaths,
        supporting_documents: supportingDocumentPaths,
      });

      const { hierarchyId, ...rest } = initialFormData;
      setFormData({ ...rest, hierarchyId });
      await fetchData();
      await fetchHierarchy();
      setTab("applications");
      toast.success("Application submitted");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const selectedHierarchy = hierarchies?.find(
    (h) => h.id === parseInt(formData.hierarchyId),
  );
  const hasApprovers = Boolean(selectedHierarchy?.approvers?.length);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Link
          href={`/${base_route}/applications`}
          className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:text-slate-950 hover:shadow-lg"
        >
          <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </Link>

        <Heading panel title="Loan Applications" />
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <Tabs
          defaultValue="applications"
          className="space-y-4"
          onValueChange={setTab}
        >
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="new">New Application</TabsTrigger>
            <TabsTrigger value="approvals">My Approvals</TabsTrigger>
            <TabsTrigger value="all">All Applications</TabsTrigger>
          </TabsList>
          <div className="space-y-4" hidden={tab !== "applications"}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Loan Applications</h2>
            </div>

            {!applications ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 w-2/3 rounded bg-muted" />
                      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">
                    No applications yet
                  </h3>
                  <p className="mb-4 max-w-sm text-center text-muted-foreground">
                    You haven&apos;t submitted any loan applications. Click the
                    button below to apply.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {applications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <div
                      className={cn(
                        "h-1",
                        application.status === "approved" && "bg-emerald-500",
                        application.status === "rejected" && "bg-red-500",
                        application.status === "in_progress" && "bg-blue-500",
                        application.status === "pending" && "bg-amber-500",
                        application.status === "disbursed" && "bg-purple-500",
                      )}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {formatCurrency(Number(application.loan_amount))}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {application.application_number}
                          </CardDescription>
                        </div>
                        <Badge
                          className={cn(
                            "capitalize",
                            statusColors[application.status],
                          )}
                        >
                          {application.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="capitalize">{application.loan_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Applied
                          </p>
                          <p>{formatDate(application.created_at)}</p>
                        </div>
                      </div>

                      {/* Approval Timeline */}
                      {application.approval_steps &&
                        application.approval_steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Approval Progress
                            </p>
                            <div className="flex items-center gap-1">
                              {application.approval_steps.map((step, index) => (
                                <div
                                  key={step.id}
                                  className="flex items-center"
                                >
                                  <div
                                    className={cn(
                                      "flex size-6 items-center justify-center rounded-full text-xs",
                                      step.status === "approved" &&
                                        "bg-emerald-100 text-emerald-700",
                                      step.status === "rejected" &&
                                        "bg-red-100 text-red-700",
                                      step.status === "pending" &&
                                        step.approval_order ===
                                          application.current_approver_order
                                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                                        : step.status === "pending" &&
                                            "bg-gray-100 text-gray-500",
                                    )}
                                    title={`${step.approver_name} - ${step.status}`}
                                  >
                                    {step.status === "approved" ? (
                                      <Check className="size-3" />
                                    ) : step.status === "rejected" ? (
                                      <X className="size-3" />
                                    ) : (
                                      index + 1
                                    )}
                                  </div>
                                  {index <
                                    application.approval_steps!.length - 1 && (
                                    <ChevronRight className="mx-0.5 size-3 text-muted-foreground" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDetailApplication(application);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="mr-2 size-4" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4" hidden={tab !== "new"}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="size-5 text-emerald-600" />
                  New Loan Application
                </CardTitle>
                <CardDescription>
                  Complete all required fields to submit your loan request for
                  approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Approval Hierarchy Selection */}
                  <FieldSet className="space-y-4 rounded-lg border p-4">
                    <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                      <Settings className="size-4 text-emerald-600" />
                      Approval Workflow
                    </FieldLegend>

                    <Field>
                      <FieldLabel className="text-sm">
                        Approval Hierarchy *
                      </FieldLabel>
                      <Select
                        disabled={true}
                        value={formData.hierarchyId}
                        onValueChange={(value) =>
                          updateField("hierarchyId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose approval hierarchy" />
                        </SelectTrigger>
                        <SelectContent>
                          {hierarchies?.map((hierarchy) => (
                            <SelectItem
                              key={hierarchy.id}
                              value={hierarchy.id.toString()}
                            >
                              <div>
                                <span className="font-medium">
                                  {hierarchy.name}
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({hierarchy.approvers?.length || 0} approvers)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {selectedHierarchy && selectedHierarchy.approvers && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Your application will go through:
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedHierarchy.approvers.map(
                            (approver, index) => (
                              <div
                                key={approver.id}
                                className="flex items-center"
                              >
                                <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm">
                                    {approver.user_name}
                                  </span>
                                </div>
                                {index <
                                  selectedHierarchy.approvers!.length - 1 && (
                                  <ChevronRight className="mx-1 size-4 text-muted-foreground" />
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </FieldSet>

                  {/* Loan Details Section */}
                  <FieldSet className="space-y-4 rounded-lg border p-4">
                    <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                      <CreditCard className="size-4 text-emerald-600" />
                      Loan Details
                    </FieldLegend>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          onChange={(e) =>
                            updateField("loanAmount", e.target.value)
                          }
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
                          onValueChange={(value) =>
                            updateField("loanType", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select loan type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emergency">
                              Emergency Loan
                            </SelectItem>
                            <SelectItem value="medical">
                              Medical Loan
                            </SelectItem>
                            <SelectItem value="education">
                              Education Loan
                            </SelectItem>
                            <SelectItem value="housing">
                              Housing Loan
                            </SelectItem>
                            <SelectItem value="vehicle">
                              Vehicle Loan
                            </SelectItem>
                            <SelectItem value="wedding">
                              Wedding Loan
                            </SelectItem>
                            <SelectItem value="personal">
                              Personal Loan
                            </SelectItem>
                            <SelectItem value="advance-salary">
                              Salary Advance
                            </SelectItem>
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
                          onValueChange={(value) =>
                            updateField("urgencyLevel", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">
                              Normal (7-10 days)
                            </SelectItem>
                            <SelectItem value="urgent">
                              Urgent (3-5 days)
                            </SelectItem>
                            <SelectItem value="critical">
                              Critical (1-2 days)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <Layers className="size-3.5 text-emerald-600" />
                          Number of Installments *
                        </FieldLabel>
                        <Select
                          value={formData.numberOfInstallments}
                          onValueChange={(value) =>
                            updateField("numberOfInstallments", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select installments" />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 6, 9, 12, 18, 24].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} months
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel className="flex items-center gap-2 text-sm">
                        <FileText className="size-3.5 text-emerald-600" />
                        Purpose of Loan *
                      </FieldLabel>
                      <textarea
                        placeholder="Please provide a detailed explanation for the loan request..."
                        rows={3}
                        value={formData.purpose}
                        onChange={(e) => updateField("purpose", e.target.value)}
                        className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </Field>

                    {formData.loanAmount && formData.numberOfInstallments && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-700">
                            Estimated Monthly Deduction:
                          </span>
                          <span className="text-lg font-bold text-emerald-700">
                            PKR {calculateEMI()}
                          </span>
                        </div>
                      </div>
                    )}
                  </FieldSet>

                  {/* Repayment Schedule Section */}
                  <FieldSet className="space-y-4 rounded-lg border p-4">
                    <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                      <CalendarDays className="size-4 text-emerald-600" />
                      Repayment Schedule
                    </FieldLegend>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <Clock className="size-3.5 text-emerald-600" />
                          Expected Receiving Date
                        </FieldLabel>
                        <AppCalendar
                          min={new Date()}
                          date={formData.receivingDate}
                          onChange={(d) => updateField("receivingDate", d)}
                          max={""}
                        />
                      </Field>

                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <CalendarDays className="size-3.5 text-emerald-600" />
                          Return Date
                        </FieldLabel>
                        <AppCalendar
                          min={new Date()}
                          date={formData.returnDate}
                          onChange={(d) => updateField("returnDate", d)}
                          max={""}
                        />
                      </Field>

                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <CalendarDays className="size-3.5 text-emerald-600" />
                          First Installment
                        </FieldLabel>
                        <AppCalendar
                          min={new Date()}
                          date={formData.firstInstallmentDate}
                          onChange={(d) =>
                            updateField("firstInstallmentDate", d)
                          }
                          max={""}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <Wallet className="size-3.5 text-emerald-600" />
                          Payment Method
                        </FieldLabel>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) =>
                            updateField("paymentMethod", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salary_deduction">
                              Salary Deduction
                            </SelectItem>
                            <SelectItem value="bank_transfer">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <CreditCard className="size-3.5 text-emerald-600" />
                          Bank Account (Optional)
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="Enter account number"
                          value={formData.bankAccountNumber}
                          onChange={(e) =>
                            updateField("bankAccountNumber", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </FieldSet>

                  {/* Guarantor Section */}
                  {parseFloat(formData.loanAmount) > 100000 && (
                    <FieldSet className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                      <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold text-amber-700">
                        <User className="size-4" />
                        Guarantor Information (Required for loans above PKR
                        100,000)
                      </FieldLegend>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel className="text-sm">
                            Guarantor Name *
                          </FieldLabel>
                          <Input
                            type="text"
                            placeholder="Enter guarantor name"
                            value={formData.guarantorName}
                            onChange={(e) =>
                              updateField("guarantorName", e.target.value)
                            }
                            required
                          />
                        </Field>

                        <Field>
                          <FieldLabel className="text-sm">
                            Department *
                          </FieldLabel>
                          <Input
                            type="text"
                            placeholder="Guarantor's department"
                            value={formData.guarantorDepartment}
                            onChange={(e) =>
                              updateField("guarantorDepartment", e.target.value)
                            }
                            required
                          />
                        </Field>

                        <Field>
                          <FieldLabel className="text-sm">
                            Phone Number *
                          </FieldLabel>
                          <Input
                            type="tel"
                            placeholder="Guarantor's phone"
                            value={formData.guarantorPhone}
                            onChange={(e) =>
                              updateField("guarantorPhone", e.target.value)
                            }
                            required
                          />
                        </Field>
                      </div>
                    </FieldSet>
                  )}

                  {/* Document Uploads */}
                  <FieldSet className="space-y-4 rounded-lg border p-4">
                    <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                      <Upload className="size-4 text-emerald-600" />
                      Document Attachments
                    </FieldLegend>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <ImagePlus className="size-3.5 text-emerald-600" />
                          Post-Dated Cheque Images
                        </FieldLabel>
                        <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50">
                          <Upload className="mb-1 size-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formData.chequeImages.length > 0
                              ? `${formData.chequeImages.length} file(s) selected`
                              : "Click to upload"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleChequeUpload}
                          />
                        </label>
                      </Field>

                      <Field>
                        <FieldLabel className="flex items-center gap-2 text-sm">
                          <FileText className="size-3.5 text-emerald-600" />
                          Supporting Documents
                        </FieldLabel>
                        <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50">
                          <Upload className="mb-1 size-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formData.supportingDocuments.length > 0
                              ? `${formData.supportingDocuments.length} file(s) selected`
                              : "Click to upload"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleDocumentUpload}
                          />
                        </label>
                      </Field>
                    </div>
                  </FieldSet>

                  {/* Terms and Conditions */}
                  <FieldSet className="space-y-4 rounded-lg border p-4">
                    <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      Terms and Acknowledgment
                    </FieldLegend>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="salaryConsent"
                          checked={formData.salaryDeductionConsent}
                          onCheckedChange={(checked) =>
                            updateField(
                              "salaryDeductionConsent",
                              checked === true,
                            )
                          }
                        />
                        <label
                          htmlFor="salaryConsent"
                          className="text-sm leading-relaxed"
                        >
                          I authorize the company to deduct the loan installment
                          amount from my monthly salary until the loan is fully
                          repaid. I understand that in case of resignation or
                          termination, the outstanding loan amount will be
                          deducted from my final settlement.
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="termsAccepted"
                          checked={formData.termsAccepted}
                          onCheckedChange={(checked) =>
                            updateField("termsAccepted", checked === true)
                          }
                        />
                        <label
                          htmlFor="termsAccepted"
                          className="text-sm leading-relaxed"
                        >
                          I confirm that all information provided is accurate
                          and complete. I agree to the company&apos;s loan
                          policy and understand that providing false information
                          may result in disciplinary action.
                        </label>
                      </div>
                    </div>
                  </FieldSet>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.termsAccepted ||
                      !formData.salaryDeductionConsent ||
                      !formData.hierarchyId ||
                      !hasApprovers
                    }
                    className="h-12 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-lg shadow-lg hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
                  >
                    {isSubmitting
                      ? "Submitting Application..."
                      : "Submit Loan Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4" hidden={tab !== "approvals"}>
            <RenderMyApprovals />
          </div>

          <div className="space-y-4" hidden={tab !== "all"}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Applications</h2>
            </div>

            {!allApplications ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 w-2/3 rounded bg-muted" />
                      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">
                    No applications yet
                  </h3>
                  <p className="mb-4 max-w-sm text-center text-muted-foreground">
                    You haven&apos;t submitted any loan applications. Click the
                    button below to apply.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {allApplications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <div
                      className={cn(
                        "h-1",
                        application.status === "approved" && "bg-emerald-500",
                        application.status === "rejected" && "bg-red-500",
                        application.status === "in_progress" && "bg-blue-500",
                        application.status === "pending" && "bg-amber-500",
                        application.status === "disbursed" && "bg-purple-500",
                      )}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {formatCurrency(Number(application.loan_amount))}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {application.application_number}
                          </CardDescription>
                        </div>
                        <Badge
                          className={cn(
                            "capitalize",
                            statusColors[application.status],
                          )}
                        >
                          {application.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Applicant
                          </p>
                          <p className="font-bold">
                            {application.applicant_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="capitalize">{application.loan_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Applied
                          </p>
                          <p>{formatDate(application.created_at)}</p>
                        </div>
                      </div>

                      {/* Approval Timeline */}
                      {application.approval_steps &&
                        application.approval_steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Approval Progress
                            </p>
                            <div className="flex items-center gap-1">
                              {application.approval_steps.map((step, index) => (
                                <div
                                  key={step.id}
                                  className="flex items-center"
                                >
                                  <div
                                    className={cn(
                                      "flex size-6 items-center justify-center rounded-full text-xs",
                                      step.status === "approved" &&
                                        "bg-emerald-100 text-emerald-700",
                                      step.status === "rejected" &&
                                        "bg-red-100 text-red-700",
                                      step.status === "pending" &&
                                        step.approval_order ===
                                          application.current_approver_order
                                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                                        : step.status === "pending" &&
                                            "bg-gray-100 text-gray-500",
                                    )}
                                    title={`${step.approver_name} - ${step.status}`}
                                  >
                                    {step.status === "approved" ? (
                                      <Check className="size-3" />
                                    ) : step.status === "rejected" ? (
                                      <X className="size-3" />
                                    ) : (
                                      index + 1
                                    )}
                                  </div>
                                  {index <
                                    application.approval_steps!.length - 1 && (
                                    <ChevronRight className="mx-0.5 size-3 text-muted-foreground" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          updateLoanApplicationQuery(application.id)
                        }
                      >
                        <Eye className="mr-2 size-4" />
                        View Details
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedForDelete(application);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      )}

      <Dialog open={isDetailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {detailApplication?.application_number}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-2">
            {detailApplication && (
              <div className="space-y-6 px-2">
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn(
                      "capitalize",
                      statusColors[detailApplication.status],
                    )}
                  >
                    {detailApplication.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Loan Amount
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatCurrency(Number(detailApplication.loan_amount))}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Loan Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold capitalize">
                        {detailApplication.loan_type}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{detailApplication.purpose}</p>
                  </CardContent>
                </Card>

                {detailApplication.approval_steps &&
                  detailApplication.approval_steps.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Clock className="size-4 text-emerald-600" />
                          Approval Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {detailApplication.approval_steps.map(
                            (step, index) => (
                              <div
                                key={step.id}
                                className="flex items-start gap-4"
                              >
                                <div
                                  className={cn(
                                    "flex size-10 flex-shrink-0 items-center justify-center rounded-full",
                                    step.status === "approved" &&
                                      "bg-emerald-100 text-emerald-700",
                                    step.status === "rejected" &&
                                      "bg-red-100 text-red-700",
                                    step.status === "pending" &&
                                      step.approval_order ===
                                        detailApplication.current_approver_order
                                      ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                                      : step.status === "pending" &&
                                          "bg-gray-100 text-gray-500",
                                  )}
                                >
                                  {step.status === "approved" ? (
                                    <Check className="size-5" />
                                  ) : step.status === "rejected" ? (
                                    <X className="size-5" />
                                  ) : (
                                    <span className="font-medium">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 pt-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">
                                      {step.approver_name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs capitalize",
                                        step.status === "approved" &&
                                          "border-emerald-200 text-emerald-700",
                                        step.status === "rejected" &&
                                          "border-red-200 text-red-700",
                                        step.status === "pending" &&
                                          step.approval_order ===
                                            detailApplication.current_approver_order &&
                                          "border-blue-200 text-blue-700",
                                      )}
                                    >
                                      {step.status === "pending" &&
                                      step.approval_order ===
                                        detailApplication.current_approver_order
                                        ? "Awaiting"
                                        : step.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {step.approver_designation}
                                  </p>
                                  {step.comments && (
                                    <p className="mt-2 rounded-md bg-muted p-2 text-sm italic">
                                      &quot;{step.comments}&quot;
                                    </p>
                                  )}
                                  {step.acted_at && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {formatDate(step.acted_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                <Label className="pb-2 text-xl font-semibold">
                  Cheque Images
                </Label>
                <div className="flex flex-wrap gap-2">
                  {detailApplication?.cheque_images?.map((item) => (
                    <MyImgZooming img={item} key={item} />
                  ))}
                </div>
                <Label className="pb-2 text-xl font-semibold">
                  Supporting Documents
                </Label>
                <div className="flex flex-wrap gap-2">
                  {detailApplication?.supporting_documents?.map((item) => (
                    <MyImgZooming img={item} key={item} />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        loading={deleteLoading}
        open={!!selectedForDelete}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove application from the system"}
        onPressYes={() => handleDelete()}
        onPressCancel={() => setSelectedForDelete(null)}
      />
    </div>
  );
}

type LoanApplicationApprover = {
  id: number;
  application_number: string;
  applicant_id: number;
  applicant_name: string;
  applicant_designation: string;
  hierarchy_name: string | null;
  loan_amount: number;
  loan_type: string;
  purpose: string;
  urgency_level: string;
  receiving_date: string | null;
  return_date: string | null;
  first_installment_date: string | null;
  num_installments: number;
  payment_method: string | null;
  bank_account: string | null;
  guarantor_name: string | null;
  guarantor_department: string | null;
  guarantor_phone: string | null;
  status: "pending" | "in_progress" | "approved" | "rejected" | "disbursed";
  current_approver_order: number;
  created_at: string;
  approval_steps: ApprovalStep[] | null;
  is_my_turn?: boolean;
  my_approval_status?: "pending" | "approved" | "rejected" | null;
  cheque_images: string[];
  supporting_documents: string[];
};

const RenderMyApprovals = () => {
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<LoanApplicationApprover[]>(
    [],
  );
  const [selectedApplication, setSelectedApplication] =
    useState<LoanApplicationApprover | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">(
    "approved",
  );
  const [approvalComments, setApprovalComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await axios.get(
        `/${userID}/loan-applications?approver_id=${userID}`,
      );
      setApplications(res.data);
    } finally {
      setLoading(false);
    }
  }

  const pendingApplications =
    applications?.filter((app) => app.is_my_turn) || [];
  const processedApplications =
    applications?.filter((app) => !app.is_my_turn && app.my_approval_status) ||
    [];
  const viewableApplications =
    applications?.filter((app) => !app.is_my_turn && !app.my_approval_status) ||
    [];

  const handleViewDetails = (application: LoanApplicationApprover) => {
    setSelectedApplication(application);
    setIsDetailDialogOpen(true);
  };

  const handleApprovalClick = (
    application: LoanApplicationApprover,
    action: "approved" | "rejected",
  ) => {
    setSelectedApplication(application);
    setApprovalAction(action);
    setApprovalComments("");
    setIsApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedApplication || !userID) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `/${userID}/loan-applications/${selectedApplication.id}/approve`,
        {
          approver_id: userID,
          action: approvalAction,
          comments: approvalComments,
        },
      );

      await fetchData();
      setIsApprovalDialogOpen(false);
      setSelectedApplication(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="size-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pendingApplications.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Your Approval
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {
                      processedApplications.filter(
                        (a) => a.my_approval_status === "approved",
                      ).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Approved by You
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="size-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {
                      processedApplications.filter(
                        (a) => a.my_approval_status === "rejected",
                      ).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rejected by You
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="size-4" />
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="processed" className="gap-2">
              <History className="size-4" />
              Processed ({processedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <FileText className="size-4" />
              All Viewable ({viewableApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Applications Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <CheckCircle2 className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">All caught up!</h3>
                  <p className="max-w-sm text-center text-muted-foreground">
                    You have no pending applications requiring your approval.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {pendingApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onViewDetails={() => handleViewDetails(application)}
                    onApprove={() =>
                      handleApprovalClick(application, "approved")
                    }
                    onReject={() =>
                      handleApprovalClick(application, "rejected")
                    }
                    showActions
                    currentUserId={userID}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Processed Applications Tab */}
          <TabsContent value="processed" className="space-y-4">
            {processedApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <History className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">No history yet</h3>
                  <p className="max-w-sm text-center text-muted-foreground">
                    Applications you have approved or rejected will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {processedApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onViewDetails={() => handleViewDetails(application)}
                    currentUserId={userID}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Viewable Applications Tab */}
          <TabsContent value="all" className="space-y-4">
            {viewableApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">
                    No other applications
                  </h3>
                  <p className="max-w-sm text-center text-muted-foreground">
                    Other applications in your hierarchies will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {viewableApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onViewDetails={() => handleViewDetails(application)}
                    currentUserId={userID}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApplication?.application_number}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70dvh] pr-2">
            {selectedApplication && (
              <div className="space-y-6 px-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={cn(
                      "px-3 py-1 text-sm capitalize",
                      statusColors[selectedApplication.status],
                    )}
                  >
                    {selectedApplication.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    className={cn(
                      "px-3 py-1 text-sm capitalize",
                      urgencyColors[selectedApplication.urgency_level],
                    )}
                  >
                    {selectedApplication.urgency_level}
                  </Badge>
                  {selectedApplication.is_my_turn && (
                    <Badge className="bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      Awaiting Your Approval
                    </Badge>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="size-4 text-blue-600" />
                        Applicant Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">
                          {selectedApplication.applicant_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Desgination
                        </span>
                        <span>{selectedApplication.applicant_designation}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="size-4 text-blue-600" />
                        Loan Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Number(selectedApplication.loan_amount),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="capitalize">
                          {selectedApplication.loan_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Installments
                        </span>
                        <span>
                          {selectedApplication.num_installments} months
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EMI</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Number(selectedApplication.loan_amount) /
                              selectedApplication.num_installments,
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="size-4 text-blue-600" />
                      Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedApplication.purpose}</p>
                  </CardContent>
                </Card>

                {selectedApplication.guarantor_name && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="size-4 text-blue-600" />
                        Guarantor Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Name: </span>
                        <span className="font-medium">
                          {selectedApplication.guarantor_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Department:{" "}
                        </span>
                        <span>{selectedApplication.guarantor_department}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone: </span>
                        <span>{selectedApplication.guarantor_phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedApplication.approval_steps &&
                  selectedApplication.approval_steps.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Clock className="size-4 text-blue-600" />
                          Approval Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedApplication.approval_steps.map(
                            (step, index) => (
                              <div
                                key={step.id}
                                className="flex items-start gap-4"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "flex size-10 flex-shrink-0 items-center justify-center rounded-full border-2",
                                      step.status === "approved" &&
                                        "border-emerald-200 bg-emerald-100 text-emerald-700",
                                      step.status === "rejected" &&
                                        "border-red-200 bg-red-100 text-red-700",
                                      step.status === "pending" &&
                                        step.approval_order ===
                                          selectedApplication.current_approver_order
                                        ? "border-blue-400 bg-blue-100 text-blue-700 ring-2 ring-blue-200"
                                        : step.status === "pending" &&
                                            "border-gray-200 bg-gray-100 text-gray-500",
                                    )}
                                  >
                                    {step.status === "approved" ? (
                                      <Check className="size-5" />
                                    ) : step.status === "rejected" ? (
                                      <X className="size-5" />
                                    ) : (
                                      <span className="text-sm font-bold">
                                        {index + 1}
                                      </span>
                                    )}
                                  </div>
                                  {index <
                                    selectedApplication.approval_steps!.length -
                                      1 && (
                                    <div
                                      className={cn(
                                        "mt-2 h-8 w-0.5",
                                        step.status === "approved"
                                          ? "bg-emerald-300"
                                          : "bg-gray-200",
                                      )}
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 pb-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {step.approver_name}
                                        {step.approver_id === userID && (
                                          <span className="ml-2 text-xs text-blue-600">
                                            (You)
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {step.approver_designation}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs capitalize",
                                        step.status === "approved" &&
                                          "border-emerald-200 bg-emerald-50 text-emerald-700",
                                        step.status === "rejected" &&
                                          "border-red-200 bg-red-50 text-red-700",
                                        step.status === "pending" &&
                                          step.approval_order ===
                                            selectedApplication.current_approver_order &&
                                          "border-blue-200 bg-blue-50 text-blue-700",
                                      )}
                                    >
                                      {step.status === "pending" &&
                                      step.approval_order ===
                                        selectedApplication.current_approver_order
                                        ? "Current Approver"
                                        : step.status}
                                    </Badge>
                                  </div>
                                  {step.comments && (
                                    <div className="mt-2 rounded-md bg-muted/50 p-2">
                                      <p className="text-sm text-muted-foreground italic">
                                        &quot;{step.comments}&quot;
                                      </p>
                                    </div>
                                  )}
                                  {step.acted_at && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {formatDateTime(step.acted_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                <Label className="pb-2 text-xl font-semibold">
                  Cheque Images
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication?.cheque_images?.map((item) => (
                    <MyImgZooming img={item} key={item} />
                  ))}
                </div>
                <Label className="pb-2 text-xl font-semibold">
                  Supporting Documents
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication?.supporting_documents?.map((item) => (
                    <MyImgZooming img={item} key={item} />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {selectedApplication?.is_my_turn && (
            <div className="flex gap-3 border-t pt-4">
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleApprovalClick(selectedApplication, "approved");
                }}
              >
                <Check className="mr-2 size-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleApprovalClick(selectedApplication, "rejected");
                }}
              >
                <X className="mr-2 size-4" />
                Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === "approved" ? (
                <>
                  <Check className="size-5 text-emerald-600" />
                  Approve Application
                </>
              ) : (
                <>
                  <AlertCircle className="size-5 text-red-600" />
                  Reject Application
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication?.application_number} -{" "}
              {formatCurrency(Number(selectedApplication?.loan_amount || 0))}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Field>
              <FieldLabel>
                Comments {approvalAction === "rejected" && "(Required)"}
              </FieldLabel>
              <Textarea
                placeholder={
                  approvalAction === "approved"
                    ? "Add any comments for the applicant (optional)"
                    : "Please provide a reason for rejection"
                }
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={4}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={
                isProcessing ||
                (approvalAction === "rejected" && !approvalComments)
              }
              className={cn(
                approvalAction === "approved"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "bg-red-600 hover:bg-red-700",
              )}
            >
              {isProcessing
                ? "Processing..."
                : approvalAction === "approved"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

function ApplicationCard({
  application,
  onViewDetails,
  onApprove,
  onReject,
  showActions = false,
  currentUserId,
}: {
  application: LoanApplicationApprover;
  onViewDetails: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
  currentUserId: number | string;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "h-1",
          application.status === "approved" && "bg-emerald-500",
          application.status === "rejected" && "bg-red-500",
          application.status === "in_progress" && "bg-blue-500",
          application.status === "pending" && "bg-amber-500",
          application.status === "disbursed" && "bg-purple-500",
        )}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {formatCurrency(Number(application.loan_amount))}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {application.application_number}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={cn("capitalize", statusColors[application.status])}
            >
              {application.status.replace("_", " ")}
            </Badge>
            {application.is_my_turn && (
              <Badge className="bg-blue-100 text-xs text-blue-700">
                Your Turn
              </Badge>
            )}
            {application.my_approval_status && (
              <Badge
                className={cn(
                  "text-xs",
                  application.my_approval_status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                You {application.my_approval_status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span className="font-medium">{application.applicant_name}</span>
            <span className="text-muted-foreground">
              ({application.applicant_designation})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="capitalize">{application.loan_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applied</p>
              <p>{formatDate(application.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Approval Progress */}
        {application.approval_steps &&
          application.approval_steps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Approval Progress
              </p>
              <div className="flex items-center gap-1">
                {application.approval_steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border text-xs",
                        step.status === "approved" &&
                          "border-emerald-200 bg-emerald-100 text-emerald-700",
                        step.status === "rejected" &&
                          "border-red-200 bg-red-100 text-red-700",
                        step.status === "pending" &&
                          step.approval_order ===
                            application.current_approver_order
                          ? "border-blue-400 bg-blue-100 text-blue-700 ring-2 ring-blue-200"
                          : step.status === "pending" &&
                              "border-gray-200 bg-gray-100 text-gray-500",
                        step.approver_id === currentUserId &&
                          "ring-2 ring-purple-400 ring-offset-1",
                      )}
                      title={`${step.approver_name} - ${step.status}${step.approver_id === currentUserId ? " (You)" : ""}`}
                    >
                      {step.status === "approved" ? (
                        <Check className="size-3" />
                      ) : step.status === "rejected" ? (
                        <X className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < application.approval_steps!.length - 1 && (
                      <ChevronRight className="mx-0.5 size-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className={cn("flex gap-2", showActions ? "pt-2" : "")}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
          >
            <Eye className="mr-2 size-4" />
            View Details
          </Button>
          {showActions && (
            <>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={onApprove}
              >
                <Check className="size-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <X className="size-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
