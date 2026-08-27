import axios from "@/lib/axios";
import { CheckCircle, MessageSquareText, Star } from "lucide-react";
import { useEffect, useState } from "react";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import StarRating from "@/components/shared/common/startRating";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { CustomerSearch } from "@/components/features/customers/components/customer-search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompetitorPicker, OTHER_COMPETITOR } from "./competitor-picker";

function normalizeCompetitorName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : "";
}

export default function AddFeedbackDialog({
  open,
  onClose,
  user_id,
  customer_id,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  user_id: number | string;
  customer_id?: number | undefined;
  onRefresh?: () => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<Date | undefined>(undefined);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [rating, setRating] = useState(0);
  const [customer, setCustomer] = useState<number | string | undefined>();
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [settingsId, setSettingsId] = useState<number | string>();
  const [competitor, setCompetitor] = useState("");
  const [otherCompetitor, setOtherCompetitor] = useState("");
  const [reason, setReason] = useState("");

  const isOtherCompetitor = competitor === OTHER_COMPETITOR;
  const selectedCompetitor = normalizeCompetitorName(
    isOtherCompetitor ? otherCompetitor : competitor,
  );

  useEffect(() => {
    if (!open) return;

    axios.get(`/${user_id}/settings`).then((response) => {
      const settings = response.data;
      setSettingsId(settings?.id);
      setCompetitors(
        Array.isArray(settings?.competitors) ? settings.competitors : [],
      );
    });
  }, [open, user_id]);

  async function handleSaveFeedback() {
    setLoading(true);
    try {
      if (alreadyPurchased && isOtherCompetitor) {
        const exists = competitors.some(
          (item) =>
            item.toLocaleLowerCase() === selectedCompetitor.toLocaleLowerCase(),
        );

        if (!exists && settingsId) {
          await axios.put(`/${user_id}/settings`, {
            id: settingsId,
            competitors: [...competitors, selectedCompetitor],
          });
          setCompetitors((current) => [...current, selectedCompetitor]);
        }
      }

      await axios.post(`/${user_id}/feedback`, {
        feedback: alreadyPurchased
          ? `Already Purchsed -> ${selectedCompetitor} -> ${reason.trim()}`
          : feedback,
        customer_id: customer_id ?? customer,
        user_id,
        status: alreadyPurchased
          ? "Already Purchased"
          : satisfactory
            ? "Satisfactory"
            : "Unsatisfactory",
        next_followup: alreadyPurchased ? null : next,
        top_follow: alreadyPurchased ? false : top,
        is_already_purchased: alreadyPurchased,
        competitor_name: alreadyPurchased ? selectedCompetitor : null,
        reason: alreadyPurchased ? reason.trim() : null,
        rating,
      });
      await onRefresh?.();
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  function resetForm() {
    setFeedback("");
    setNext(undefined);
    setTop(false);
    setSatisfactory(false);
    setRating(0);
    setAlreadyPurchased(false);
    setCompetitor("");
    setOtherCompetitor("");
    setReason("");
  }

  useEffect(() => {
    if (customer_id) setCustomer(customer_id);
  }, [customer_id]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[480px]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <MessageSquareText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Add Feedback
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Capture a concise update and follow-up date.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5">
            {!customer_id && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Customer <RequiredStar />
                </Label>
                <CustomerSearch
                  value={customer}
                  onReturn={(val) => setCustomer(val)}
                />
              </div>
            )}

            <label className="flex min-h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
              <span>Already Purchased</span>
              <Checkbox
                checked={alreadyPurchased}
                onCheckedChange={(checked) =>
                  setAlreadyPurchased(Boolean(checked))
                }
              />
            </label>

            {alreadyPurchased ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Competitor <RequiredStar />
                  </Label>
                  <CompetitorPicker
                    competitors={competitors}
                    value={competitor}
                    onChange={setCompetitor}
                  />
                </div>

                {isOtherCompetitor && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Competitor Name <RequiredStar />
                    </Label>
                    <Input
                      className="h-9 rounded-lg"
                      placeholder="Enter competitor name"
                      value={otherCompetitor}
                      onChange={(event) =>
                        setOtherCompetitor(event.target.value)
                      }
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Reason <RequiredStar />
                  </Label>
                  <Input
                    className="h-9 rounded-lg"
                    placeholder="Why did they purchase from this competitor?"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Enter Feedback <RequiredStar />
                  </Label>
                  <Input
                    placeholder="Write call feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Next Follow Up <RequiredStar />
                  </Label>
                  <AppCalendar
                    date={next}
                    onChange={setNext}
                    min={new Date()}
                    max={""}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      Top Follow Up
                    </span>
                    <Checkbox
                      checked={top}
                      onCheckedChange={(checked) => {
                        setTop(checked as boolean);
                      }}
                    />
                  </label>

                  <label className="flex min-h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Satisfactory
                    </span>
                    <Checkbox
                      checked={satisfactory}
                      onCheckedChange={(checked) => {
                        setSatisfactory(checked as boolean);
                      }}
                    />
                  </label>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Customer Rating
              </Label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <StarRating size={18} value={rating} onChange={setRating} />
              </div>
            </div>

            <Button
              className="h-9 w-full rounded-lg"
              disabled={
                loading ||
                rating === 0 ||
                (alreadyPurchased
                  ? !selectedCompetitor || !reason.trim()
                  : !next || !feedback)
              }
              onClick={() => {
                handleSaveFeedback();
              }}
            >
              {loading && <Spinner />} Save Feedback
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
