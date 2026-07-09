"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { UploadImage } from "@/lib/uploadFunction"
import { cn } from "@/lib/utils"
import {
    AlertCircle,
    ArrowLeft,
    Banknote,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    History,
    ImagePlus,
    Package,
    RotateCcw,
    Settings,
    Trash2,
    Truck,
    Upload,
    User,
    X,
    XCircle,
} from "lucide-react"
import Link from "next/link"
import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react"
import { toast } from "sonner"

import ConfirmationDialog from "@/components/alert-dialog"
import AppCalendar from "@/components/app-calendar"
import { MyImgZooming } from "@/components/img-zooming"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Heading from "@/components/ui/heading"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { CustomerSearch } from "../customer-components/customer-search"
import { CustomerMachines } from "../machine-components/customer-machines"
import { RequiredStar } from "../RequiredStar"


/* =========================================================
   TYPES
========================================================= */

interface BackupFormData {
    name: string
    dateOfDelivery: Date | undefined
    amount: string
    shipmentName: string
    image: File | null
    expectedReturnDate: Date | undefined
    hierarchyId: string
    saleId: number | undefined
}

const initialFormData: BackupFormData = {
    name: "",
    dateOfDelivery: undefined,
    amount: "",
    shipmentName: "",
    image: null,
    expectedReturnDate: undefined,
    hierarchyId: "",
    saleId: undefined
}

type Approver = {
    id: number
    user_id: number
    approval_order: number
    user_name: string
    user_email: string
    user_designation: string
}

type Hierarchy = {
    id: number
    name: string
    hierarchy_type: string
    description: string | null
    approvers: Approver[] | null
}

type ApprovalStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "skipped"

type ApplicationStatus =
    | "pending"
    | "in_progress"
    | "approved"
    | "rejected"
    | "issued"
    | "returned"

type ApprovalStep = {
    id: number
    approver_id: number
    approval_order: number
    status: ApprovalStatus
    comments: string | null
    acted_at: string | null
    approver_name: string
    approver_designation: string
}

type BackupApplication = {
    id: number

    name: string
    date_of_delivery: string | null
    amount: string | number | null
    shipment_name: string | null
    image: string | null
    expected_return_date: string | null
    customer_id: string | number
    user_id: number
    user_name: string
    user_designation: string

    hierarchy_id: number | null
    sale_id: number | null
    hierarchy_name: string | null

    status: ApplicationStatus

    issued: boolean
    issue_date: string | null
    actual_return_date: string | null

    current_approver_order: number

    created_at: string
    updated_at: string

    approval_steps: ApprovalStep[] | null

    is_my_turn?: boolean
    my_approval_status?: ApprovalStatus | null
    serial_no: string
    order_no_arr: string[]
    customer_name: string
    customer_owner: string
}


/* =========================================================
   STATUS COLORS
========================================================= */

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    issued: "bg-violet-100 text-violet-700",
    returned: "bg-cyan-100 text-cyan-700",
}


/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: string | number | null | undefined) {
    const numericAmount = Number(amount || 0)

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    }).format(numericAmount)
}

function formatDate(dateString?: string | null) {
    if (!dateString) return "Not set"

    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

function formatDateTime(dateString?: string | null) {
    if (!dateString) return "Not set"

    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatStatus(status: string) {
    return status.replaceAll("_", " ")
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function BackupApplications() {
    const { userID, base_route } = useUserDetail()

    const [formData, setFormData] =
        useState<BackupFormData>(initialFormData)

    const [applications, setApplications] =
        useState<BackupApplication[]>([])

    const [allApplications, setAllApplications] =
        useState<BackupApplication[]>([])

    const [hierarchies, setHierarchies] =
        useState<Hierarchy[]>([])

    const [detailApplication, setDetailApplication] =
        useState<BackupApplication | null>(null)

    const [selectedForDelete, setSelectedForDelete] =
        useState<BackupApplication | null>(null)

    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [customerID, setCustomerID] = useState<string | null | number>(null)

    console.log(customerID)

    const [tab, setTab] = useState("applications")


    useEffect(() => {
        if (!userID) return

        loadInitialData()
    }, [userID])


    async function loadInitialData() {
        setLoading(true)

        try {
            await Promise.all([
                fetchData(),
                fetchDataAll(),
                fetchHierarchy(),
            ])
        } finally {
            setLoading(false)
        }
    }


    async function fetchData() {
        const res = await axios.get(
            `/${userID}/backup-applications?user_id=${userID}`
        )

        setApplications(res.data)
    }

    console.log(applications)


    async function fetchDataAll() {
        const res = await axios.get(
            `/${userID}/backup-applications`
        )

        setAllApplications(res.data)
    }


    async function fetchHierarchy() {
        const res = await axios.get(
            `/${userID}/hierarchies`
        )

        const backupHierarchies: Hierarchy[] =
            res.data?.filter(
                (item: Hierarchy) =>
                    item.hierarchy_type === "backup"
            ) || []

        setHierarchies(backupHierarchies)

        if (backupHierarchies.length > 0) {
            updateField(
                "hierarchyId",
                backupHierarchies[0].id.toString()
            )
        }
    }


    const updateField = <
        K extends keyof BackupFormData
    >(
        field: K,
        value: BackupFormData[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }


    const handleImageUpload = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null

        updateField("image", file)
    }


    async function handleDelete() {
        if (!selectedForDelete?.id) return

        setDeleteLoading(true)

        try {
            await axios.delete(
                `/${userID}/backup-applications/${selectedForDelete.id}`
            )

            await Promise.all([
                fetchData(),
                fetchDataAll(),
            ])

            setSelectedForDelete(null)

            toast.success("Backup application deleted")
        } finally {
            setDeleteLoading(false)
        }
    }


    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        if (!userID) return

        setIsSubmitting(true)

        try {
            let imagePath: string | null = null

            if (formData.image) {
                const safeFileName =
                    formData.image.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "-"
                    )

                imagePath =
                    `backup-applications/${userID}/` +
                    `${Date.now()}-${safeFileName}`

                await UploadImage(
                    URL.createObjectURL(formData.image),
                    imagePath,
                    formData.image.type ||
                    "application/octet-stream"
                )
            }

            await axios.post(
                `/${userID}/backup-applications`,
                {
                    name: formData.name,
                    date_of_delivery:
                        formData.dateOfDelivery || null,

                    amount: formData.amount
                        ? parseFloat(formData.amount)
                        : null,

                    shipment_name:
                        formData.shipmentName || null,

                    image: imagePath,

                    expected_return_date:
                        formData.expectedReturnDate || null,

                    user_id: userID,

                    hierarchy_id:
                        formData.hierarchyId
                            ? parseInt(formData.hierarchyId)
                            : null,
                    sale_id: formData.saleId ?? null
                }
            )

            const hierarchyId = formData.hierarchyId

            setFormData({
                ...initialFormData,
                hierarchyId,
            })

            await Promise.all([
                fetchData(),
                fetchDataAll(),
            ])

            setTab("applications")

            toast.success(
                "Backup application submitted successfully"
            )
        } finally {
            setIsSubmitting(false)
        }
    }


    const selectedHierarchy = hierarchies.find(
        (hierarchy) =>
            hierarchy.id ===
            parseInt(formData.hierarchyId)
    )

    const sales = [{
        id: 1,
        serial_no: "abc"
    }]


    return (
        <div className="flex flex-1 flex-col space-y-4">

            {/* HEADER */}

            <div className="flex items-center gap-4">
                <Link
                    href={`/${base_route}/applications`}
                    className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:text-slate-950 hover:shadow-lg"
                >
                    <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                </Link>

                <Heading title="Backup Applications" />
            </div>


            {loading ? (
                <div className="flex flex-1 items-center justify-center py-20">
                    <Spinner />
                </div>
            ) : (
                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className="space-y-4"
                >
                    <TabsList>
                        <TabsTrigger value="applications">
                            My Applications
                        </TabsTrigger>

                        <TabsTrigger value="new">
                            New Application
                        </TabsTrigger>

                        <TabsTrigger value="approvals">
                            My Approvals
                        </TabsTrigger>

                        <TabsTrigger value="all">
                            All Applications
                        </TabsTrigger>
                    </TabsList>


                    {/* =====================================================
                        MY APPLICATIONS
                    ===================================================== */}

                    <TabsContent
                        value="applications"
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                My Backup Applications
                            </h2>
                        </div>

                        {applications.length === 0 ? (
                            <EmptyState
                                title="No applications yet"
                                description="You haven't submitted any backup applications yet."
                                icon={
                                    <Package className="size-8 text-muted-foreground" />
                                }
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {applications.map(
                                    (application) => (
                                        <BackupApplicationCard
                                            key={application.id}
                                            application={application}
                                            onViewDetails={() => {
                                                setDetailApplication(
                                                    application
                                                )
                                                setIsDetailOpen(true)
                                            }}
                                            currentUserId={userID}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </TabsContent>


                    {/* =====================================================
                        NEW APPLICATION
                    ===================================================== */}

                    <TabsContent
                        value="new"
                        className="space-y-4"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="size-5 text-emerald-600" />
                                    New Backup Application
                                </CardTitle>

                                <CardDescription>
                                    Submit the backup item details for approval.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >

                                    {/* APPROVAL WORKFLOW */}

                                    <FieldSet className="space-y-4 rounded-lg border p-4">
                                        <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                                            <Settings className="size-4 text-emerald-600" />
                                            Approval Workflow
                                        </FieldLegend>

                                        <Field>
                                            <FieldLabel className="text-sm">
                                                Approval Hierarchy *
                                            </FieldLabel>

                                            <Input
                                                disabled
                                                value={
                                                    selectedHierarchy?.name ||
                                                    "No backup hierarchy found"
                                                }
                                            />
                                        </Field>

                                        {selectedHierarchy?.approvers &&
                                            selectedHierarchy.approvers.length >
                                            0 && (
                                                <div className="rounded-lg bg-muted/50 p-3">
                                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                        This application will go through:
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {selectedHierarchy.approvers.map(
                                                            (
                                                                approver,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        approver.id
                                                                    }
                                                                    className="flex items-center"
                                                                >
                                                                    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                                                                        <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                                                                            {index +
                                                                                1}
                                                                        </div>

                                                                        <span className="text-sm">
                                                                            {
                                                                                approver.user_name
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    {index <
                                                                        selectedHierarchy
                                                                            .approvers!
                                                                            .length -
                                                                        1 && (
                                                                            <ChevronRight className="mx-1 size-4 text-muted-foreground" />
                                                                        )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </FieldSet>


                                    {/* BACKUP DETAILS */}

                                    <FieldSet className="space-y-4 rounded-lg border p-4">
                                        <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                                            <Package className="size-4 text-emerald-600" />
                                            Backup Details
                                        </FieldLegend>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                                            <Field>
                                                <FieldLabel>Select Customer <RequiredStar /></FieldLabel>

                                                <CustomerSearch value={customerID} onReturn={(val) => setCustomerID(val)} />
                                            </Field>

                                            {customerID &&

                                                <Field>
                                                    <FieldLabel>Sale <RequiredStar /></FieldLabel>

                                                    <CustomerMachines value={formData.saleId ?? null} customer_id={customerID} onReturn={(e) => updateField(
                                                        "saleId",
                                                        e
                                                    )} />
                                                </Field>
                                            }
                                            <Field>
                                                <FieldLabel className="flex items-center gap-2 text-sm">
                                                    <Package className="size-3.5 text-emerald-600" />
                                                    Name *
                                                </FieldLabel>

                                                <Input
                                                    placeholder="Enter backup item name"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </Field>


                                            <Field>
                                                <FieldLabel className="flex items-center gap-2 text-sm">
                                                    <Banknote className="size-3.5 text-emerald-600" />
                                                    Amount
                                                </FieldLabel>

                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    placeholder="Enter amount"
                                                    value={formData.amount}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "amount",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </Field>


                                            <Field>
                                                <FieldLabel className="flex items-center gap-2 text-sm">
                                                    <Truck className="size-3.5 text-emerald-600" />
                                                    Shipment Name
                                                </FieldLabel>

                                                <Input
                                                    placeholder="Enter shipment or courier name"
                                                    value={
                                                        formData.shipmentName
                                                    }
                                                    onChange={(e) =>
                                                        updateField(
                                                            "shipmentName",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </Field>


                                            <Field>
                                                <FieldLabel className="flex items-center gap-2 text-sm">
                                                    <CalendarDays className="size-3.5 text-emerald-600" />
                                                    Date of Delivery
                                                </FieldLabel>

                                                <AppCalendar
                                                    min={new Date()}
                                                    max={""}
                                                    date={
                                                        formData.dateOfDelivery
                                                    }
                                                    onChange={(date) =>
                                                        updateField(
                                                            "dateOfDelivery",
                                                            date
                                                        )
                                                    }
                                                />
                                            </Field>


                                            <Field>
                                                <FieldLabel className="flex items-center gap-2 text-sm">
                                                    <RotateCcw className="size-3.5 text-emerald-600" />
                                                    Expected Return Date
                                                </FieldLabel>

                                                <AppCalendar
                                                    min={
                                                        formData.dateOfDelivery ||
                                                        new Date()
                                                    }
                                                    max={""}
                                                    date={
                                                        formData.expectedReturnDate
                                                    }
                                                    onChange={(date) =>
                                                        updateField(
                                                            "expectedReturnDate",
                                                            date
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </div>
                                    </FieldSet>


                                    {/* IMAGE */}

                                    <FieldSet className="space-y-4 rounded-lg border p-4">
                                        <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                                            <ImagePlus className="size-4 text-emerald-600" />
                                            Backup Image
                                        </FieldLegend>

                                        <Field>
                                            <FieldLabel className="text-sm">
                                                Upload Image
                                            </FieldLabel>

                                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50">
                                                <Upload className="mb-2 size-7 text-muted-foreground" />

                                                <span className="text-sm font-medium">
                                                    {formData.image
                                                        ? formData.image.name
                                                        : "Click to upload backup image"}
                                                </span>

                                                <span className="mt-1 text-xs text-muted-foreground">
                                                    PNG, JPG or JPEG
                                                </span>

                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                                    onChange={
                                                        handleImageUpload
                                                    }
                                                />
                                            </label>
                                        </Field>
                                    </FieldSet>


                                    <Button
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            !formData.name ||
                                            !formData.hierarchyId
                                        }
                                        className="h-12 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-lg shadow-lg hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
                                    >
                                        {isSubmitting
                                            ? "Submitting Application..."
                                            : "Submit Backup Application"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    {/* =====================================================
                        MY APPROVALS
                    ===================================================== */}

                    <TabsContent
                        value="approvals"
                        className="space-y-4"
                    >
                        <RenderMyApprovals />
                    </TabsContent>


                    {/* =====================================================
                        ALL APPLICATIONS
                    ===================================================== */}

                    <TabsContent
                        value="all"
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                All Backup Applications
                            </h2>
                        </div>

                        {allApplications.length === 0 ? (
                            <EmptyState
                                title="No applications yet"
                                description="No backup applications have been submitted."
                                icon={
                                    <Package className="size-8 text-muted-foreground" />
                                }
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {allApplications.map(
                                    (application) => (
                                        <BackupApplicationCard
                                            key={application.id}
                                            application={application}
                                            showUser
                                            showDelete
                                            currentUserId={userID}
                                            onViewDetails={() => {
                                                setDetailApplication(
                                                    application
                                                )
                                                setIsDetailOpen(true)
                                            }}
                                            onDelete={() =>
                                                setSelectedForDelete(
                                                    application
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}


            {/* =====================================================
                APPLICATION DETAIL DIALOG
            ===================================================== */}

            <Dialog
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            >
                <DialogContent className="w-full sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Backup Application Details
                        </DialogTitle>

                        <DialogDescription>
                            {detailApplication?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[70dvh] pr-2">
                        {detailApplication && (
                            <BackupApplicationDetails
                                application={detailApplication}
                                currentUserId={userID}
                            />
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>


            {/* =====================================================
                DELETE DIALOG
            ===================================================== */}

            <ConfirmationDialog
                loading={deleteLoading}
                open={!!selectedForDelete}
                title="Are you sure you want to delete?"
                description="Your action will permanently remove this backup application from the system."
                onPressYes={handleDelete}
                onPressCancel={() =>
                    setSelectedForDelete(null)
                }
            />
        </div>
    )
}


/* =========================================================
   MY APPROVALS
========================================================= */

function RenderMyApprovals() {
    const { userID } = useUserDetail()

    const [loading, setLoading] = useState(false)

    const [applications, setApplications] =
        useState<BackupApplication[]>([])

    const [
        selectedApplication,
        setSelectedApplication,
    ] = useState<BackupApplication | null>(null)

    const [
        isDetailDialogOpen,
        setIsDetailDialogOpen,
    ] = useState(false)

    const [
        isApprovalDialogOpen,
        setIsApprovalDialogOpen,
    ] = useState(false)

    const [approvalAction, setApprovalAction] =
        useState<"approved" | "rejected">(
            "approved"
        )

    const [
        approvalComments,
        setApprovalComments,
    ] = useState("")

    const [isProcessing, setIsProcessing] =
        useState(false)


    useEffect(() => {
        if (!userID) return

        fetchData()
    }, [userID])


    async function fetchData() {
        setLoading(true)

        try {
            const res = await axios.get(
                `/${userID}/backup-applications?approver_id=${userID}`
            )

            setApplications(res.data)
        } finally {
            setLoading(false)
        }
    }


    const pendingApplications =
        applications.filter(
            (application) =>
                application.is_my_turn
        )

    const processedApplications =
        applications.filter(
            (application) =>
                !application.is_my_turn &&
                application.my_approval_status
        )

    const viewableApplications =
        applications.filter(
            (application) =>
                !application.is_my_turn &&
                !application.my_approval_status
        )


    const handleViewDetails = (
        application: BackupApplication
    ) => {
        setSelectedApplication(application)
        setIsDetailDialogOpen(true)
    }


    const handleApprovalClick = (
        application: BackupApplication,
        action: "approved" | "rejected"
    ) => {
        setSelectedApplication(application)
        setApprovalAction(action)
        setApprovalComments("")
        setIsApprovalDialogOpen(true)
    }


    const handleSubmitApproval = async () => {
        if (!selectedApplication || !userID) return

        setIsProcessing(true)

        try {
            await axios.post(
                `/${userID}/backup-applications/${selectedApplication.id}/approve`,
                {
                    approver_id: userID,
                    action: approvalAction,
                    comments: approvalComments,
                }
            )

            await fetchData()

            setIsApprovalDialogOpen(false)
            setSelectedApplication(null)

            toast.success(
                approvalAction === "approved"
                    ? "Application approved"
                    : "Application rejected"
            )
        } finally {
            setIsProcessing(false)
        }
    }


    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-10">
                <Spinner />
            </div>
        )
    }


    return (
        <>
            <div className="space-y-6">

                {/* SUMMARY */}

                <div className="grid gap-4 md:grid-cols-3">

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
                                    <Clock className="size-6 text-amber-600" />
                                </div>

                                <div>
                                    <p className="text-2xl font-bold">
                                        {
                                            pendingApplications.length
                                        }
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
                                                (application) =>
                                                    application.my_approval_status ===
                                                    "approved"
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
                                                (application) =>
                                                    application.my_approval_status ===
                                                    "rejected"
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


                <Tabs
                    defaultValue="pending"
                    className="space-y-4"
                >
                    <TabsList>
                        <TabsTrigger
                            value="pending"
                            className="gap-2"
                        >
                            <Clock className="size-4" />
                            Pending ({pendingApplications.length})
                        </TabsTrigger>

                        <TabsTrigger
                            value="processed"
                            className="gap-2"
                        >
                            <History className="size-4" />
                            Processed ({processedApplications.length})
                        </TabsTrigger>

                        <TabsTrigger
                            value="all"
                            className="gap-2"
                        >
                            <FileText className="size-4" />
                            All Viewable ({viewableApplications.length})
                        </TabsTrigger>
                    </TabsList>


                    {/* PENDING */}

                    <TabsContent
                        value="pending"
                        className="space-y-4"
                    >
                        {pendingApplications.length === 0 ? (
                            <EmptyState
                                title="All caught up!"
                                description="You have no pending backup applications requiring your approval."
                                icon={
                                    <CheckCircle2 className="size-8 text-muted-foreground" />
                                }
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {pendingApplications.map(
                                    (application) => (
                                        <BackupApplicationCard
                                            key={application.id}
                                            application={application}
                                            showUser
                                            showActions
                                            currentUserId={userID}
                                            onViewDetails={() =>
                                                handleViewDetails(
                                                    application
                                                )
                                            }
                                            onApprove={() =>
                                                handleApprovalClick(
                                                    application,
                                                    "approved"
                                                )
                                            }
                                            onReject={() =>
                                                handleApprovalClick(
                                                    application,
                                                    "rejected"
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </TabsContent>


                    {/* PROCESSED */}

                    <TabsContent
                        value="processed"
                        className="space-y-4"
                    >
                        {processedApplications.length === 0 ? (
                            <EmptyState
                                title="No history yet"
                                description="Applications you approve or reject will appear here."
                                icon={
                                    <History className="size-8 text-muted-foreground" />
                                }
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {processedApplications.map(
                                    (application) => (
                                        <BackupApplicationCard
                                            key={application.id}
                                            application={application}
                                            showUser
                                            currentUserId={userID}
                                            onViewDetails={() =>
                                                handleViewDetails(
                                                    application
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </TabsContent>


                    {/* ALL VIEWABLE */}

                    <TabsContent
                        value="all"
                        className="space-y-4"
                    >
                        {viewableApplications.length === 0 ? (
                            <EmptyState
                                title="No other applications"
                                description="Other applications in your approval hierarchy will appear here."
                                icon={
                                    <FileText className="size-8 text-muted-foreground" />
                                }
                            />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {viewableApplications.map(
                                    (application) => (
                                        <BackupApplicationCard
                                            key={application.id}
                                            application={application}
                                            showUser
                                            currentUserId={userID}
                                            onViewDetails={() =>
                                                handleViewDetails(
                                                    application
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>


            {/* DETAIL DIALOG */}

            <Dialog
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
            >
                <DialogContent className="w-full sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Backup Application Details
                        </DialogTitle>

                        <DialogDescription>
                            {selectedApplication?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[70dvh] pr-2">
                        {selectedApplication && (
                            <BackupApplicationDetails
                                application={
                                    selectedApplication
                                }
                                currentUserId={userID}
                            />
                        )}
                    </ScrollArea>

                    {selectedApplication?.is_my_turn && (
                        <div className="flex gap-3 border-t pt-4">
                            <Button
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                onClick={() => {
                                    setIsDetailDialogOpen(false)

                                    handleApprovalClick(
                                        selectedApplication,
                                        "approved"
                                    )
                                }}
                            >
                                <Check className="mr-2 size-4" />
                                Approve
                            </Button>

                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => {
                                    setIsDetailDialogOpen(false)

                                    handleApprovalClick(
                                        selectedApplication,
                                        "rejected"
                                    )
                                }}
                            >
                                <X className="mr-2 size-4" />
                                Reject
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


            {/* APPROVAL DIALOG */}

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
                                    Approve Backup Application
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="size-5 text-red-600" />
                                    Reject Backup Application
                                </>
                            )}
                        </DialogTitle>

                        <DialogDescription>
                            {selectedApplication?.name}

                            {selectedApplication?.amount
                                ? ` • ${formatCurrency(
                                    selectedApplication.amount
                                )}`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Field>
                            <FieldLabel>
                                Comments{" "}
                                {approvalAction ===
                                    "rejected" &&
                                    "(Required)"}
                            </FieldLabel>

                            <Textarea
                                placeholder={
                                    approvalAction ===
                                        "approved"
                                        ? "Add comments for the applicant (optional)"
                                        : "Please provide a reason for rejection"
                                }
                                value={approvalComments}
                                onChange={(e) =>
                                    setApprovalComments(
                                        e.target.value
                                    )
                                }
                                rows={4}
                            />
                        </Field>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsApprovalDialogOpen(
                                    false
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSubmitApproval}
                            disabled={
                                isProcessing ||
                                (approvalAction ===
                                    "rejected" &&
                                    !approvalComments.trim())
                            }
                            className={cn(
                                approvalAction ===
                                    "approved"
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {isProcessing
                                ? "Processing..."
                                : approvalAction ===
                                    "approved"
                                    ? "Confirm Approval"
                                    : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}


/* =========================================================
   APPLICATION CARD
========================================================= */

function BackupApplicationCard({
    application,
    onViewDetails,
    onApprove,
    onReject,
    onDelete,
    showActions = false,
    showDelete = false,
    showUser = false,
    currentUserId,
}: {
    application: BackupApplication
    onViewDetails: () => void
    onApprove?: () => void
    onReject?: () => void
    onDelete?: () => void
    showActions?: boolean
    showDelete?: boolean
    showUser?: boolean
    currentUserId: number | string
}) {
    return (
        <Card className="overflow-hidden">

            <div
                className={cn(
                    "h-1",
                    application.status === "approved" &&
                    "bg-emerald-500",
                    application.status === "rejected" &&
                    "bg-red-500",
                    application.status === "in_progress" &&
                    "bg-blue-500",
                    application.status === "pending" &&
                    "bg-amber-500",
                    application.status === "issued" &&
                    "bg-violet-500",
                    application.status === "returned" &&
                    "bg-cyan-500"
                )}
            />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                            {application.name}
                        </CardTitle>

                        <CardDescription className="mt-1">
                            {application.shipment_name ||
                                "No shipment specified"}
                        </CardDescription>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">

                        <Badge
                            className={cn(
                                "capitalize",
                                statusColors[
                                application.status
                                ]
                            )}
                        >
                            {formatStatus(
                                application.status
                            )}
                        </Badge>

                        {application.issued && (
                            <Badge className="bg-violet-100 text-xs text-violet-700">
                                Issued
                            </Badge>
                        )}

                        {application.is_my_turn && (
                            <Badge className="bg-blue-100 text-xs text-blue-700">
                                Your Turn
                            </Badge>
                        )}

                        {application.my_approval_status &&
                            application.my_approval_status !==
                            "pending" && (
                                <Badge
                                    className={cn(
                                        "text-xs",
                                        application.my_approval_status ===
                                            "approved"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : application.my_approval_status ===
                                                "rejected"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-700"
                                    )}
                                >
                                    You{" "}
                                    {
                                        application.my_approval_status
                                    }
                                </Badge>
                            )}
                    </div>
                </div>
            </CardHeader>


            <CardContent className="space-y-4">

                {showUser && (
                    <div className="flex items-center gap-2 text-sm">
                        <User className="size-4 text-muted-foreground" />

                        <span className="font-medium">
                            {application.user_name}
                        </span>

                        {application.user_designation && (
                            <span className="text-muted-foreground">
                                (
                                {
                                    application.user_designation
                                }
                                )
                            </span>
                        )}
                    </div>
                )}


                <div className="grid grid-cols-2 gap-3 text-sm">

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Amount
                        </p>

                        <p className="font-medium">
                            {application.amount
                                ? formatCurrency(
                                    application.amount
                                )
                                : "Not specified"}
                        </p>
                    </div>


                    <div>
                        <p className="text-xs text-muted-foreground">
                            Applied
                        </p>

                        <p>
                            {formatDate(
                                application.created_at
                            )}
                        </p>
                    </div>


                    <div>
                        <p className="text-xs text-muted-foreground">
                            Delivery
                        </p>

                        <p>
                            {formatDate(
                                application.date_of_delivery
                            )}
                        </p>
                    </div>


                    <div>
                        <p className="text-xs text-muted-foreground">
                            Expected Return
                        </p>

                        <p>
                            {formatDate(
                                application.expected_return_date
                            )}
                        </p>
                    </div>
                </div>


                <ApprovalProgress
                    application={application}
                    currentUserId={currentUserId}
                />


                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onViewDetails}
                >
                    <Eye className="mr-2 size-4" />
                    View Details
                </Button>


                {showActions && (
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={onApprove}
                        >
                            <Check className="mr-2 size-4" />
                            Approve
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onReject}
                        >
                            <X className="mr-2 size-4" />
                            Reject
                        </Button>
                    </div>
                )}


                {showDelete && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={onDelete}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}


/* =========================================================
   APPROVAL PROGRESS
========================================================= */

function ApprovalProgress({
    application,
    currentUserId,
}: {
    application: BackupApplication
    currentUserId: number | string
}) {
    if (
        !application.approval_steps ||
        application.approval_steps.length === 0
    ) {
        return null
    }

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
                Approval Progress
            </p>

            <div className="flex flex-wrap items-center gap-1">
                {application.approval_steps.map(
                    (step, index) => (
                        <div
                            key={step.id}
                            className="flex items-center"
                        >
                            <div
                                className={cn(
                                    "flex size-7 items-center justify-center rounded-full border text-xs",

                                    step.status === "approved" &&
                                    "border-emerald-200 bg-emerald-100 text-emerald-700",

                                    step.status === "rejected" &&
                                    "border-red-200 bg-red-100 text-red-700",

                                    step.status === "skipped" &&
                                    "border-gray-200 bg-gray-100 text-gray-500",

                                    step.status ===
                                        "pending" &&
                                        step.approval_order ===
                                        application.current_approver_order
                                        ? "border-blue-400 bg-blue-100 text-blue-700 ring-2 ring-blue-200"
                                        : step.status ===
                                        "pending" &&
                                        "border-gray-200 bg-gray-100 text-gray-500",

                                    String(step.approver_id) ===
                                    String(currentUserId) &&
                                    "ring-2 ring-purple-400 ring-offset-1"
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
                                application.approval_steps!
                                    .length -
                                1 && (
                                    <ChevronRight className="mx-0.5 size-3 text-muted-foreground" />
                                )}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}


/* =========================================================
   APPLICATION DETAILS
========================================================= */

function BackupApplicationDetails({
    application,
    currentUserId,
}: {
    application: BackupApplication
    currentUserId: number | string
}) {
    const { base_route } = useUserDetail()
    return (
        <div className="space-y-6 px-2 pb-4">

            {/* STATUS */}

            <div className="flex flex-wrap items-center gap-2">

                <Badge
                    className={cn(
                        "px-3 py-1 text-sm capitalize",
                        statusColors[application.status]
                    )}
                >
                    {formatStatus(application.status)}
                </Badge>

                <Badge
                    className={cn(
                        "px-3 py-1 text-sm",
                        application.issued
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-700"
                    )}
                >
                    {application.issued
                        ? "Issued"
                        : "Not Issued"}
                </Badge>

                {application.is_my_turn && (
                    <Badge className="bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        Awaiting Your Approval
                    </Badge>
                )}
            </div>


            {/* USER AND AMOUNT */}

            <div className="grid gap-4 sm:grid-cols-2">

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="size-4 text-blue-600" />
                            Applicant Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">

                        <DetailRow
                            label="Name"
                            value={application.user_name}
                        />

                        <DetailRow
                            label="Designation"
                            value={
                                application.user_designation ||
                                "Not specified"
                            }
                        />

                        <DetailRow
                            label="Hierarchy"
                            value={
                                application.hierarchy_name ||
                                "Not specified"
                            }
                        />
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Package className="size-4 text-blue-600" />
                            Backup Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">

                        <DetailRow
                            label="Name"
                            value={application.name}
                        />

                        <DetailRow
                            label="Amount"
                            value={
                                application.amount
                                    ? formatCurrency(
                                        application.amount
                                    )
                                    : "Not specified"
                            }
                        />

                        <DetailRow
                            label="Shipment"
                            value={
                                application.shipment_name ||
                                "Not specified"
                            }
                        />
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="size-4 text-blue-600" />
                        Customer Information
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">


                    <DetailRow
                        label="Customer"
                        value={application.customer_name || application.customer_owner}
                        route={`/${base_route}/member/${application.customer_id}`}
                    />

                    <DetailRow
                        label="Machine"
                        value={
                            application.order_no_arr?.length ? application.order_no_arr?.join(", ") : application.serial_no
                        }
                        route={`/${base_route}/member/${application.customer_id}/${application.sale_id}`}
                    />
                </CardContent>
            </Card>


            {/* DATES */}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarDays className="size-4 text-blue-600" />
                        Delivery and Return Timeline
                    </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 sm:grid-cols-2">

                    <DateInfo
                        label="Date of Delivery"
                        value={application.date_of_delivery}
                    />

                    <DateInfo
                        label="Expected Return Date"
                        value={
                            application.expected_return_date
                        }
                    />

                    <DateInfo
                        label="Issue Date"
                        value={application.issue_date}
                    />

                    <DateInfo
                        label="Actual Return Date"
                        value={
                            application.actual_return_date
                        }
                    />
                </CardContent>
            </Card>


            {/* IMAGE */}

            {application.image && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ImagePlus className="size-4 text-blue-600" />
                            Backup Image
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <MyImgZooming
                            img={application.image}
                        />
                    </CardContent>
                </Card>
            )}


            {/* APPROVAL TIMELINE */}

            {application.approval_steps &&
                application.approval_steps.length > 0 && (
                    <ApprovalTimeline
                        application={application}
                        currentUserId={currentUserId}
                    />
                )}
        </div>
    )
}


/* =========================================================
   APPROVAL TIMELINE
========================================================= */

function ApprovalTimeline({
    application,
    currentUserId,
}: {
    application: BackupApplication
    currentUserId: number | string
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4 text-blue-600" />
                    Approval Timeline
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">

                    {application.approval_steps?.map(
                        (step, index) => (
                            <div
                                key={step.id}
                                className="flex items-start gap-4"
                            >
                                <div className="flex flex-col items-center">

                                    <div
                                        className={cn(
                                            "flex size-10 shrink-0 items-center justify-center rounded-full border-2",

                                            step.status ===
                                            "approved" &&
                                            "border-emerald-200 bg-emerald-100 text-emerald-700",

                                            step.status ===
                                            "rejected" &&
                                            "border-red-200 bg-red-100 text-red-700",

                                            step.status ===
                                            "skipped" &&
                                            "border-gray-200 bg-gray-100 text-gray-500",

                                            step.status ===
                                                "pending" &&
                                                step.approval_order ===
                                                application.current_approver_order
                                                ? "border-blue-400 bg-blue-100 text-blue-700 ring-2 ring-blue-200"
                                                : step.status ===
                                                "pending" &&
                                                "border-gray-200 bg-gray-100 text-gray-500"
                                        )}
                                    >
                                        {step.status ===
                                            "approved" ? (
                                            <Check className="size-5" />
                                        ) : step.status ===
                                            "rejected" ? (
                                            <X className="size-5" />
                                        ) : (
                                            <span className="text-sm font-bold">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {index <
                                        application
                                            .approval_steps!
                                            .length -
                                        1 && (
                                            <div
                                                className={cn(
                                                    "mt-2 h-8 w-0.5",

                                                    step.status ===
                                                        "approved"
                                                        ? "bg-emerald-300"
                                                        : "bg-gray-200"
                                                )}
                                            />
                                        )}
                                </div>


                                <div className="min-w-0 flex-1 pb-4">

                                    <div className="flex items-start justify-between gap-3">

                                        <div>
                                            <p className="font-medium">
                                                {
                                                    step.approver_name
                                                }

                                                {String(
                                                    step.approver_id
                                                ) ===
                                                    String(
                                                        currentUserId
                                                    ) && (
                                                        <span className="ml-2 text-xs text-blue-600">
                                                            (You)
                                                        </span>
                                                    )}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    step.approver_designation
                                                }
                                            </p>
                                        </div>


                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize text-xs",

                                                step.status ===
                                                "approved" &&
                                                "border-emerald-200 bg-emerald-50 text-emerald-700",

                                                step.status ===
                                                "rejected" &&
                                                "border-red-200 bg-red-50 text-red-700",

                                                step.status ===
                                                "pending" &&
                                                step.approval_order ===
                                                application.current_approver_order &&
                                                "border-blue-200 bg-blue-50 text-blue-700"
                                            )}
                                        >
                                            {step.status ===
                                                "pending" &&
                                                step.approval_order ===
                                                application.current_approver_order
                                                ? "Current Approver"
                                                : step.status}
                                        </Badge>
                                    </div>


                                    {step.comments && (
                                        <div className="mt-2 rounded-md bg-muted/50 p-2">
                                            <p className="text-sm italic text-muted-foreground">
                                                &quot;
                                                {step.comments}
                                                &quot;
                                            </p>
                                        </div>
                                    )}


                                    {step.acted_at && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {formatDateTime(
                                                step.acted_at
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function DetailRow({
    label,
    value,
    route
}: {
    label: string
    value: string | number
    route?: string
}) {
    return (
        <div className="flex items-start justify-between gap-4">

            <span className="text-muted-foreground">
                {label}
            </span>
            {route ?
                <Link target="_blank" href={route} className="hover:underline">
                    <span className="text-right font-medium">
                        {value}
                    </span>
                </Link>
                :

                <span className="text-right font-medium">
                    {value}
                </span>}
        </div>
    )
}


function DateInfo({
    label,
    value,
}: {
    label: string
    value: string | null
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-1 text-xs text-muted-foreground">
                {label}
            </p>

            <p className="font-medium">
                {formatDate(value)}
            </p>
        </div>
    )
}


function EmptyState({
    title,
    description,
    icon,
}: {
    title: string
    description: string
    icon: React.ReactNode
}) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">

                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    {icon}
                </div>

                <h3 className="mb-1 text-lg font-medium">
                    {title}
                </h3>

                <p className="max-w-sm text-center text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}