import axios from "@/lib/axios";
import { CheckCircle, MessageSquareText, Star } from "lucide-react";
import { useState } from "react";
import AppCalendar from "../appCalendar";
import { RequiredStar } from "../RequiredStar";
import StarRating from "../startRating";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Spinner from "../ui/spinner";


export default function AddFeedbackDialog({ open, onClose, user_id, customer_id, onRefresh }: { open: boolean, onClose: () => void, user_id: number | string, customer_id: number | undefined, onRefresh: () => Promise<void> }) {

    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [next, setNext] = useState<Date | undefined>(undefined);
    const [top, setTop] = useState(false);
    const [satisfactory, setSatisfactory] = useState(false);
    const [rating, setRating] = useState(0)

    async function handleSaveFeedback() {

        setLoading(true);
        axios
            .post(`/${user_id}/feedback`, {
                feedback,
                type: "aftersales",
                customer_id,
                user_id,
                status: "Satisfactory",
                next_followup: undefined,
                top_follow: false,
                rating
            })
            .then(async () => {
                await onRefresh();
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
    if (!customer_id) return null

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

                <div className="max-h-[calc(100dvh-120px)] space-y-3 overflow-y-auto p-3.5">


                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Enter Feedback <RequiredStar />
                        </Label>
                        <Input
                            placeholder="Write call feedback..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="h-9 rounded-lg bg-muted/40"
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
                                    setSatisfactory(checked === true);
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
                        disabled={!next || !feedback}
                        onClick={() => {
                            handleSaveFeedback();
                        }}
                    >
                        {loading && <Spinner />} Save Feedback
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
