"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import useUserDetail from "@/hooks/use-user-detail";
import type { StockProps } from "@/lib/types";
import { ClipboardList } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import OrderStockDialog from "../pos/order-stock-dialog";

type Props = {
  visible: boolean;
  onClose: (visible: boolean) => void;
  data: unknown[] | null;
  type: string;
};

type FeedbackContent = {
  id: string | number;
  user_name?: string;
  feedback_date: string | Date;
  customer_id: string | number;
  name?: string;
  owner?: string;
  location?: string;
  ownership_name?: string;
  number?: string | number;
  status?: string;
  feedback?: string;
};

export function MessageContentViewer({ visible, onClose, data, type }: Props) {
  const { base_route } = useUserDetail();
  const content = data ?? [];
  const feedbacks = content as FeedbackContent[];

  if (type === "feedback") {
    return (
      <Dialog open={visible} onOpenChange={(open) => !open && onClose(false)}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[680px]">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Feedback Report
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {content.length} {content.length === 1 ? "entry" : "entries"}{" "}
                  in this report.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <div className="p-3.5 pt-1">
              {content.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                  No feedback to display.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {feedbacks.map((feedback) => (
                    <Card
                      key={feedback.id}
                      className="overflow-hidden border-border bg-background shadow-sm"
                    >
                      <CardContent className="space-y-2.5 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{feedback.user_name || "Unknown user"}</span>
                          <span>
                            {moment(feedback.feedback_date).format(
                              "MMM D, YYYY",
                            )}
                          </span>
                        </div>
                        <Link
                          target="_blank"
                          href={`/${base_route}/member/${feedback.customer_id}`}
                          className="block text-sm font-semibold text-foreground hover:underline"
                        >
                          {`${feedback.name || "Unknown customer"}${feedback.owner ? ` - ${feedback.owner}` : ""}${feedback.location ? ` - ${feedback.location}` : ""}`}
                        </Link>
                        <div className="grid gap-1.5 text-xs sm:grid-cols-3">
                          <div className="rounded-md bg-muted/50 px-2 py-1.5">
                            <span className="text-muted-foreground">
                              Manager:{" "}
                            </span>
                            <span className="font-medium">
                              {feedback.ownership_name || "NIL"}
                            </span>
                          </div>
                          <div className="rounded-md bg-muted/50 px-2 py-1.5">
                            <span className="text-muted-foreground">
                              Number:{" "}
                            </span>
                            <span className="font-medium">
                              {feedback.number || "NIL"}
                            </span>
                          </div>
                          <div className="rounded-md bg-muted/50 px-2 py-1.5">
                            <span className="text-muted-foreground">
                              Status:{" "}
                            </span>
                            <span className="font-medium">
                              {feedback.status || "NIL"}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-border pt-2 text-sm leading-5 whitespace-pre-line text-foreground">
                          {feedback.feedback || (
                            <em className="text-muted-foreground">
                              No feedback provided.
                            </em>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  if (type === "neworder") {
    return (
      <OrderStockDialog
        dialogVisible={visible}
        onCloseDialog={onClose}
        stock={content as StockProps[]}
        onRefresh={async () => {}}
      />
    );
  }

  return null;
}
