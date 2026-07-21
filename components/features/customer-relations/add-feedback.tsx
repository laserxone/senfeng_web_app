import axios from "@/lib/axios";
import { CheckCircle, MessageSquareText, Star } from "lucide-react";
import { useEffect, useState } from "react";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import StarRating from "@/components/shared/common/startRating";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { CustomerSearch } from "@/components/features/customers/components/customer-search";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function AddFeedbackDialog({ open, onClose, user_id, customer_id, onRefresh }: { open: boolean, onClose: () => void, user_id: number | string, customer_id?: number | undefined, onRefresh?: () => Promise<void> }) {

    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [next, setNext] = useState<Date | undefined>(undefined);
    const [top, setTop] = useState(false);
    const [satisfactory, setSatisfactory] = useState(false);
    const [rating, setRating] = useState(0)
    const [customer, setCustomer] = useState<number | string | undefined>()

    async function handleSaveFeedback() {

        setLoading(true);
        axios
            .post(`/${user_id}/feedback`, {
                feedback,
                type: "aftersales",
                customer_id,
                user_id,
                status: satisfactory ? "Satisfactory" : "Unsatisfactory",
                next_followup: undefined,
                top_follow: false,
                rating
            })
            .then(async () => {
                await onRefresh?.();
                handleClose()
                resetForm()
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function handleClose() {
        onClose()
        resetForm()
    }

    function resetForm() {
        setFeedback("")
        setNext(undefined);
        setTop(false);
        setSatisfactory(false);
        setRating(0)
    }

    useEffect(() => {
        if (customer_id) setCustomer(customer_id)
    }, [customer_id])


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

                    {!customer_id &&
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Customer <RequiredStar />
                            </Label>
                            <CustomerSearch value={customer} onReturn={(val) => setCustomer(val)} />
                        </div>
                    }

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Next Follow Up <RequiredStar />
                        </Label>
                        <AppCalendar date={next} onChange={setNext} min={new Date()} max={""} />
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

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Customer Rating
                        </Label>
                        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <StarRating size={18} value={rating} onChange={setRating} />
                        </div>
                    </div>

                    <Button
                        className="h-9 w-full rounded-lg"
                        disabled={loading || !next || !feedback || rating === 0}
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
    )
}
