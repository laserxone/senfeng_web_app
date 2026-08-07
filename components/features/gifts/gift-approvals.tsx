"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Check, Gift, History, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import GiftApplicationCard from "./gift-application-card";
import GiftApplicationDetails from "./gift-application-detail";
import EmptyState from "./gift-empty-state";
import { GiftApplication } from "./gift-types";

export default function RenderGiftApprovals() {
  const { userID } = useUserDetail();
  const [applications, setApplications] = useState<GiftApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GiftApplication | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [comments, setComments] = useState("");
  const [pending, setPending] = useState(false);
  async function load() {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/${userID}/gift-applications?approver_id=${userID}`,
      );
      setApplications(response.data);
    } catch {
      toast.error("Failed to load gift approvals.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [userID]);
  async function submit() {
    if (!userID || !selected || !action) return;
    if (action === "rejected" && !comments.trim()) return;
    setPending(true);
    try {
      await axios.post(`/${userID}/gift-applications/${selected.id}/approve`, {
        approver_id: userID,
        action,
        comments: comments.trim() || null,
      });
      await load();
      setAction(null);
      setComments("");
      setSelected(null);
      toast.success(`Gift application ${action}.`);
    } catch {
      toast.error("Failed to process gift application.");
    } finally {
      setPending(false);
    }
  }
  const pendingItems = applications.filter((item) => item.is_my_turn);
  const history = applications.filter((item) => !item.is_my_turn);
  const render = (items: GiftApplication[], text: string) =>
    items.length ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((application) => (
          <GiftApplicationCard
            key={application.id}
            application={application}
            showUser
            onViewDetails={() => setSelected(application)}
          />
        ))}
      </div>
    ) : (
      <EmptyState
        title={text}
        description="Gift applications in your approval hierarchy will appear here."
        icon={<History className="size-8 text-muted-foreground" />}
      />
    );
  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">My Gift Approvals</h2>
        <p className="text-sm text-muted-foreground">
          Review requests assigned through the gift approval hierarchy.
        </p>
      </div>
      <div>
        <h3 className="mb-3 font-medium">Pending ({pendingItems.length})</h3>
        {render(pendingItems, "All caught up!")}
      </div>
      <div>
        <h3 className="mb-3 font-medium">Processed & Viewable</h3>
        {render(history, "No approval history yet")}
      </div>
      <Dialog
        open={!!selected && !action}
        onOpenChange={(open) => !open && setSelected(null)}
      >
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
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <div className="p-3.5">
              {selected ? (
                <GiftApplicationDetails application={selected} />
              ) : null}
              {selected?.is_my_turn ? (
                <div className="flex gap-2 border-t pt-3">
                  <Button
                    className="h-9 flex-1 rounded-lg"
                    onClick={() => setAction("approved")}
                  >
                    <Check className="size-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-9 flex-1 rounded-lg"
                    onClick={() => setAction("rejected")}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-pink-500/15 bg-pink-500/10 text-pink-600">
                <Gift className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  {action === "approved" ? "Approve" : "Reject"} Gift
                  Application
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-muted-foreground">
                  {selected?.reason}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3 p-3.5">
            <Field>
              <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                Comments {action === "rejected" ? "(required)" : "(optional)"}
              </FieldLabel>
              <Textarea
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={4}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-lg"
                onClick={() => setAction(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  pending || (action === "rejected" && !comments.trim())
                }
                className="h-9 rounded-lg"
                variant={action === "rejected" ? "destructive" : "default"}
                onClick={submit}
              >
                {pending ? <Spinner className="size-4" /> : null}Confirm{" "}
                {action === "approved" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
