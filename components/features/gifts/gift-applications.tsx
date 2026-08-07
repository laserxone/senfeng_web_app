"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddNewGiftApplication from "./add-new-gift-application";
import GiftApplicationCard from "./gift-application-card";
import GiftApplicationDetails from "./gift-application-detail";
import RenderGiftApprovals from "./gift-approvals";
import EmptyState from "./gift-empty-state";
import { GiftApplication } from "./gift-types";

export default function GiftApplications() {
  const { userID, base_route } = useUserDetail();
  const [mine, setMine] = useState<GiftApplication[]>([]);
  const [all, setAll] = useState<GiftApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GiftApplication | null>(null);
  const [deleting, setDeleting] = useState<GiftApplication | null>(null);
  const [processing, setProcessing] = useState(false);
  async function refresh() {
    if (!userID) return;
    setLoading(true);
    try {
      const [myResponse, allResponse] = await Promise.all([
        axios.get(`/${userID}/gift-applications?user_id=${userID}`),
        axios.get(`/${userID}/gift-applications`),
      ]);
      setMine(myResponse.data);
      setAll(allResponse.data);
    } catch {
      toast.error("Failed to load gift applications.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [userID]);
  useEffect(() => {
    const syncFromUrl = () => {
      const id = new URLSearchParams(window.location.search).get("g");
      setSelected(
        id ? all.find((item) => String(item.id) === id) || null : null,
      );
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [all]);
  function openFromUrl(application: GiftApplication) {
    const url = new URL(window.location.href);
    url.searchParams.set("g", String(application.id));
    window.history.pushState({}, "", url);
    setSelected(application);
  }
  function clearUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("g");
    window.history.replaceState({}, "", url);
    setSelected(null);
  }
  async function remove() {
    if (!deleting || !userID) return;
    setProcessing(true);
    try {
      await axios.delete(`/${userID}/gift-applications/${deleting.id}`);
      await refresh();
      setDeleting(null);
      toast.success("Gift application deleted");
    } catch {
      toast.error("Failed to delete gift application.");
    } finally {
      setProcessing(false);
    }
  }
  const cards = (
    items: GiftApplication[],
    options: { user?: boolean; delete?: boolean } = {},
  ) =>
    items.length ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((application) => (
          <GiftApplicationCard
            key={application.id}
            application={application}
            showUser={options.user}
            showDelete={options.delete}
            onDelete={() => setDeleting(application)}
            onViewDetails={() =>
              options.delete
                ? openFromUrl(application)
                : setSelected(application)
            }
          />
        ))}
      </div>
    ) : (
      <EmptyState
        title="No applications yet"
        description="No gift applications found."
        icon={<Gift className="size-8 text-muted-foreground" />}
      />
    );
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Link
          href={`/${base_route}/applications`}
          className="inline-flex size-11 items-center justify-center rounded-full border"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Heading panel title="Gift Applications" />
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="approvals">My Approvals</TabsTrigger>
            <TabsTrigger value="all">All Applications</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Gift Applications</h2>
              <AddNewGiftApplication onCreated={refresh} />
            </div>
            {cards(mine)}
          </TabsContent>
          <TabsContent value="approvals" className="space-y-4">
            <RenderGiftApprovals />
          </TabsContent>
          <TabsContent value="all" className="space-y-4">
            <h2 className="text-xl font-semibold">All Gift Applications</h2>
            {cards(all, { user: true, delete: true })}
          </TabsContent>
        </Tabs>
      )}
      <Dialog open={!!selected} onOpenChange={(open) => !open && clearUrl()}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-3xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-pink-500/15 bg-pink-500/10 text-pink-600">
                <Gift className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Gift Application Details
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-muted-foreground">
                  {selected?.reason}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selected ? (
            <ScrollArea className="max-h-[calc(100dvh-132px)]">
              <div className="p-3.5">
                <GiftApplicationDetails application={selected} />
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        loading={processing}
        open={!!deleting}
        title="Are you sure you want to delete?"
        description="Your action will permanently remove this gift application from the system."
        onPressYes={remove}
        onPressCancel={() => setDeleting(null)}
      />
    </div>
  );
}
