"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import AddNewBackupApplication from "./add-new-backup-application";
import BackupApplicationCard from "./backup-application-card";
import BackupApplicationDetails from "./backup-application-detail";
import RenderMyApprovals from "./backup-approvals";
import EmptyState from "./backup-empty-state";
import { BackupApplication } from "./backup-types";

export default function BackupApplications() {
  const { userID, base_route } = useUserDetail();

  const [applications, setApplications] = useState<BackupApplication[]>([]);

  const [allApplications, setAllApplications] = useState<BackupApplication[]>(
    [],
  );

  const [detailApplication, setDetailApplication] =
    useState<BackupApplication | null>(null);

  const [selectedForDelete, setSelectedForDelete] =
    useState<BackupApplication | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("applications");

  useEffect(() => {
    if (!userID) return;

    loadInitialData();
  }, [userID]);

  const updateBackupApplicationQuery = useCallback(
    (applicationId?: string | number) => {
      const url = new URL(window.location.href);

      if (applicationId !== undefined) {
        url.searchParams.set("b", String(applicationId));
        window.history.pushState({}, "", url);
      } else {
        url.searchParams.delete("b");
        window.history.replaceState({}, "", url);
      }

      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [],
  );

  useEffect(() => {
    const syncBackupApplicationFromUrl = () => {
      const applicationId = new URLSearchParams(window.location.search).get(
        "b",
      );
      const application = applicationId
        ? allApplications.find((item) => String(item.id) === applicationId)
        : undefined;

      setDetailApplication(application || null);
      setIsDetailOpen(Boolean(application));
    };

    syncBackupApplicationFromUrl();
    window.addEventListener("popstate", syncBackupApplicationFromUrl);

    return () => {
      window.removeEventListener("popstate", syncBackupApplicationFromUrl);
    };
  }, [allApplications]);

  async function loadInitialData() {
    setLoading(true);

    try {
      await Promise.all([fetchData(), fetchDataAll()]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    const res = await axios.get(
      `/${userID}/backup-applications?user_id=${userID}`,
    );

    setApplications(res.data);
  }

  async function fetchDataAll() {
    const res = await axios.get(`/${userID}/backup-applications`);

    setAllApplications(res.data);
  }

  async function handleDelete() {
    if (!selectedForDelete?.id) return;

    setDeleteLoading(true);

    try {
      await axios.delete(
        `/${userID}/backup-applications/${selectedForDelete.id}`,
      );

      await Promise.all([fetchData(), fetchDataAll()]);

      setSelectedForDelete(null);

      toast.success("Backup application deleted");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      {/* HEADER */}

      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Link
          href={`/${base_route}/applications`}
          className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:text-slate-950 hover:shadow-lg"
        >
          <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </Link>

        <Heading panel title="Backup Applications" />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>

            <TabsTrigger value="approvals">My Approvals</TabsTrigger>

            <TabsTrigger value="all">All Applications</TabsTrigger>
          </TabsList>

          {/* =====================================================
                        MY APPLICATIONS
                    ===================================================== */}

          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Backup Applications</h2>

              <AddNewBackupApplication />
            </div>

            {applications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="You haven't submitted any backup applications yet."
                icon={<Package className="size-8 text-muted-foreground" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {applications.map((application) => (
                  <BackupApplicationCard
                    key={application.id}
                    application={application}
                    onViewDetails={() => {
                      setDetailApplication(application);
                      setIsDetailOpen(true);
                    }}
                    currentUserId={userID}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* =====================================================
                        MY APPROVALS
                    ===================================================== */}

          <TabsContent value="approvals" className="space-y-4">
            <RenderMyApprovals />
          </TabsContent>

          {/* =====================================================
                        ALL APPLICATIONS
                    ===================================================== */}

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Backup Applications</h2>
            </div>

            {allApplications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="No backup applications have been submitted."
                icon={<Package className="size-8 text-muted-foreground" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allApplications.map((application) => (
                  <BackupApplicationCard
                    key={application.id}
                    application={application}
                    showUser
                    showDelete
                    currentUserId={userID}
                    onViewDetails={() =>
                      updateBackupApplicationQuery(application.id)
                    }
                    onDelete={() => setSelectedForDelete(application)}
                  />
                ))}
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
        onOpenChange={(nextOpen) => {
          setIsDetailOpen(nextOpen);
          if (!nextOpen) updateBackupApplicationQuery();
        }}
      >
        <DialogContent className="w-full sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Backup Application Details</DialogTitle>

            <DialogDescription>{detailApplication?.name}</DialogDescription>
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
        onPressCancel={() => setSelectedForDelete(null)}
      />
    </div>
  );
}
