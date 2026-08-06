import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Check,
  Clock,
  ImagePlus,
  Package,
  User,
  X,
} from "lucide-react";

import { MyImgZooming } from "@/components/shared/media/img-zooming";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
} from "./backup-helper-functions";
import { statusColors } from "./backup-status-color";
import { BackupApplication } from "./backup-types";

export default function BackupApplicationDetails({
  application,
  currentUserId,
}: {
  application: BackupApplication;
  currentUserId: number | string;
}) {
  const { base_route } = useUserDetail();
  return (
    <div className="space-y-6 px-2 pb-4">
      {/* STATUS */}

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn(
            "px-3 py-1 text-sm capitalize",
            statusColors[application.status],
          )}
        >
          {formatStatus(application.status)}
        </Badge>

        <Badge
          className={cn(
            "px-3 py-1 text-sm",
            application.issued
              ? "bg-violet-100 text-violet-700"
              : "bg-gray-100 text-gray-700",
          )}
        >
          {application.issued ? "Issued" : "Not Issued"}
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
            <DetailRow label="Name" value={application.user_name} />

            <DetailRow
              label="Designation"
              value={application.user_designation || "Not specified"}
            />

            <DetailRow
              label="Hierarchy"
              value={application.hierarchy_name || "Not specified"}
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
            <DetailRow label="Name" value={application.name} />

            <DetailRow
              label="Amount"
              value={
                application.amount
                  ? formatCurrency(application.amount)
                  : "Not specified"
              }
            />

            <DetailRow
              label="Shipment"
              value={application.shipment_name || "Not specified"}
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
              application.order_no_arr?.length
                ? application.order_no_arr?.join(", ")
                : application.serial_no
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
            value={application.expected_return_date}
          />

          <DateInfo label="Issue Date" value={application.issue_date} />

          <DateInfo
            label="Actual Return Date"
            value={application.actual_return_date}
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
            <MyImgZooming img={application.image} />
          </CardContent>
        </Card>
      )}

      {/* APPROVAL TIMELINE */}

      {application.approval_steps && application.approval_steps.length > 0 && (
        <ApprovalTimeline
          application={application}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

function ApprovalTimeline({
  application,
  currentUserId,
}: {
  application: BackupApplication;
  currentUserId: number | string;
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
          {application.approval_steps?.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-2",

                    step.status === "approved" &&
                      "border-emerald-200 bg-emerald-100 text-emerald-700",

                    step.status === "rejected" &&
                      "border-red-200 bg-red-100 text-red-700",

                    step.status === "skipped" &&
                      "border-gray-200 bg-gray-100 text-gray-500",

                    step.status === "pending" &&
                      step.approval_order === application.current_approver_order
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
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {index < application.approval_steps!.length - 1 && (
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {step.approver_name}

                      {String(step.approver_id) === String(currentUserId) && (
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
                          application.current_approver_order &&
                        "border-blue-200 bg-blue-50 text-blue-700",
                    )}
                  >
                    {step.status === "pending" &&
                    step.approval_order === application.current_approver_order
                      ? "Current Approver"
                      : step.status}
                  </Badge>
                </div>

                {step.comments && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2">
                    <p className="text-sm text-muted-foreground italic">
                      &quot;
                      {step.comments}
                      &quot;
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  route,
}: {
  label: string;
  value: string | number;
  route?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {route ? (
        <Link target="_blank" href={route} className="hover:underline">
          <span className="text-right font-medium">{value}</span>
        </Link>
      ) : (
        <span className="text-right font-medium">{value}</span>
      )}
    </div>
  );
}

function DateInfo({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>

      <p className="font-medium">{formatDate(value)}</p>
    </div>
  );
}
