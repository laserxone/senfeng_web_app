import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Tag,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";

type TaskDetailProps = {
  detail: TaskProps | null;
  visible: boolean;
  onClose: (value: boolean) => void;
  onMark: () => Promise<void>;
  user_id: number | string;
};

const TaskDetail = ({
  detail,
  visible,
  onClose,
  onMark,
  user_id,
}: TaskDetailProps) => {
  const [loading, setLoading] = useState(false);

  if (!detail?.id) return null;

  const isCompleted = detail.status?.toLowerCase() === "completed";
  const customerNumber = Array.isArray(detail.customer_number)
    ? detail.customer_number.filter(Boolean).join(", ")
    : String(detail.customer_number || "");

  async function handleUpdateStatus() {
    setLoading(true);
    try {
      await axios.put(`/${user_id}/task/${detail?.id}`, {
        id: detail.id,
        status: "Completed",
      });
      toast.success("Status updated");
      onClose(false);
      await onMark();
    } catch (error) {
      console.error("Failed to update task status", error);
      toast.error("Unable to update task status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-muted/20 px-5 py-5 pr-12 text-left">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg font-semibold tracking-tight">
                  Task Details
                </SheetTitle>
                <StatusBadge completed={isCompleted} status={detail.status} />
              </div>
              <SheetDescription className="mt-1">
                Task #{detail.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-5">
            <section className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {detail.type ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <Tag className="size-3" />
                    {detail.type}
                  </span>
                ) : null}
              </div>
              <h2 className="break-words text-lg font-semibold leading-7 text-foreground">
                {detail.task_name || "Untitled task"}
              </h2>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <DetailItem icon={UserRound} label="Assigned to" value={detail.assigned_to_name} />
              <DetailItem icon={UsersRound} label="Assigned by" value={detail.assigned_by_name} />
              <DetailItem
                icon={CalendarClock}
                label="Assigned date"
                value={detail.created_at ? moment(detail.created_at).format("DD MMM YYYY") : null}
              />
              <DetailItem
                icon={Clock3}
                label="Assigned time"
                value={detail.created_at ? moment(detail.created_at).format("hh:mm A") : null}
              />
            </section>

            {(detail.customer_name || detail.customer_owner || customerNumber || detail.customer_address) ? (
              <section className="rounded-xl border bg-background p-4 shadow-sm">
                <SectionHeading icon={UsersRound} title="Customer" />
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <TextDetail label="Name" value={detail.customer_name || detail.customer_owner} />
                  <TextDetail label="Contact" value={customerNumber} />
                  <TextDetail className="sm:col-span-2" label="Address" value={detail.customer_address} />
                  <TextDetail label="PIN" value={detail.customer_pin} />
                </div>
              </section>
            ) : null}

            {(detail.problem || detail.solution) ? (
              <section className="grid gap-3">
                {detail.problem ? (
                  <NarrativeCard icon={MessageSquareText} title="Problem" value={detail.problem} />
                ) : null}
                {detail.solution ? (
                  <NarrativeCard icon={Lightbulb} title="Solution" value={detail.solution} />
                ) : null}
              </section>
            ) : null}

            {(detail.remarks || detail.location) ? (
              <section className="rounded-xl border bg-background p-4 shadow-sm">
                <SectionHeading icon={MapPin} title="Additional information" />
                <div className="grid gap-3">
                  <TextDetail label="Location" value={detail.location} />
                  <TextDetail label="Remarks" value={detail.remarks} />
                </div>
              </section>
            ) : null}

            {!detail.problem && !detail.solution && !detail.remarks && !detail.location ? (
              <div className="rounded-xl border border-dashed bg-muted/15 px-5 py-7 text-center text-sm text-muted-foreground">
                No additional task notes were added.
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t bg-background/95 p-4 backdrop-blur">
          {isCompleted ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 sm:w-auto">
              <CheckCircle2 className="size-4" />
              Task completed
            </div>
          ) : (
            <Button className="w-full sm:w-auto" disabled={loading} onClick={handleUpdateStatus}>
              {loading ? <Spinner /> : <CheckCircle2 />}
              Mark as completed
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

function StatusBadge({ completed, status }: { completed: boolean; status?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${completed
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700"
      }`}>
      {status || "Pending"}
    </span>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/10 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value || "N/A"}</p>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function TextDetail({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">{value || "N/A"}</p>
    </div>
  );
}

function NarrativeCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <section className="rounded-xl border bg-background p-4 shadow-sm">
      <SectionHeading icon={Icon} title={title} />
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{value}</p>
    </section>
  );
}

export default TaskDetail;
