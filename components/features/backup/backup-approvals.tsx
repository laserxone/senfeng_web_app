import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  History,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import BackupApplicationCard from "./backup-application-card";
import BackupApplicationDetails from "./backup-application-detail";
import EmptyState from "./backup-empty-state";
import { formatCurrency } from "./backup-helper-functions";
import { BackupApplication } from "./backup-types";

export default function RenderMyApprovals() {
  const { userID } = useUserDetail();

  const [loading, setLoading] = useState(false);

  const [applications, setApplications] = useState<BackupApplication[]>([]);

  const [selectedApplication, setSelectedApplication] =
    useState<BackupApplication | null>(null);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">(
    "approved",
  );

  const [approvalComments, setApprovalComments] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userID) return;

    fetchData();
  }, [userID]);

  async function fetchData() {
    setLoading(true);

    try {
      const res = await axios.get(
        `/${userID}/backup-applications?approver_id=${userID}`,
      );

      setApplications(res.data);
    } finally {
      setLoading(false);
    }
  }

  const pendingApplications = applications.filter(
    (application) => application.is_my_turn,
  );

  const processedApplications = applications.filter(
    (application) => !application.is_my_turn && application.my_approval_status,
  );

  const viewableApplications = applications.filter(
    (application) => !application.is_my_turn && !application.my_approval_status,
  );

  const handleViewDetails = (application: BackupApplication) => {
    setSelectedApplication(application);
    setIsDetailDialogOpen(true);
  };

  const handleApprovalClick = (
    application: BackupApplication,
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
        `/${userID}/backup-applications/${selectedApplication.id}/approve`,
        {
          approver_id: userID,
          action: approvalAction,
          comments: approvalComments,
        },
      );

      await fetchData();

      setIsApprovalDialogOpen(false);
      setSelectedApplication(null);

      toast.success(
        approvalAction === "approved"
          ? "Application approved"
          : "Application rejected",
      );
    } finally {
      setIsProcessing(false);
    }
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
                        (application) =>
                          application.my_approval_status === "approved",
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
                          application.my_approval_status === "rejected",
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

          {/* PENDING */}

          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <EmptyState
                title="All caught up!"
                description="You have no pending backup applications requiring your approval."
                icon={<CheckCircle2 className="size-8 text-muted-foreground" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pendingApplications.map((application) => (
                  <BackupApplicationCard
                    key={application.id}
                    application={application}
                    showUser
                    showActions
                    currentUserId={userID}
                    onViewDetails={() => handleViewDetails(application)}
                    onApprove={() =>
                      handleApprovalClick(application, "approved")
                    }
                    onReject={() =>
                      handleApprovalClick(application, "rejected")
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* PROCESSED */}

          <TabsContent value="processed" className="space-y-4">
            {processedApplications.length === 0 ? (
              <EmptyState
                title="No history yet"
                description="Applications you approve or reject will appear here."
                icon={<History className="size-8 text-muted-foreground" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {processedApplications.map((application) => (
                  <BackupApplicationCard
                    key={application.id}
                    application={application}
                    showUser
                    currentUserId={userID}
                    onViewDetails={() => handleViewDetails(application)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ALL VIEWABLE */}

          <TabsContent value="all" className="space-y-4">
            {viewableApplications.length === 0 ? (
              <EmptyState
                title="No other applications"
                description="Other applications in your approval hierarchy will appear here."
                icon={<FileText className="size-8 text-muted-foreground" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {viewableApplications.map((application) => (
                  <BackupApplicationCard
                    key={application.id}
                    application={application}
                    showUser
                    currentUserId={userID}
                    onViewDetails={() => handleViewDetails(application)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* DETAIL DIALOG */}

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-full sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Backup Application Details</DialogTitle>

            <DialogDescription>{selectedApplication?.name}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70dvh] pr-2">
            {selectedApplication && (
              <BackupApplicationDetails
                application={selectedApplication}
                currentUserId={userID}
              />
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
                ? ` • ${formatCurrency(selectedApplication.amount)}`
                : ""}
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
                    ? "Add comments for the applicant (optional)"
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
                (approvalAction === "rejected" && !approvalComments.trim())
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
}
