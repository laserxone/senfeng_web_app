

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Check,
    ChevronRight,
    Eye,
    Trash2,
    User,
    X
} from "lucide-react"

import { formatCurrency, formatDate, formatStatus } from "./backup-helper-functions"
import { statusColors } from "./backup-status-color"
import { BackupApplication } from "./backup-types"



export default function BackupApplicationCard({
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