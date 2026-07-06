

import { Button } from "@/components/ui/button";
import { useState, type ElementType } from "react";

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
import moment from "moment";
import { toast } from "sonner";
import Spinner from "../ui/spinner";
import { ScrollArea } from "../ui/scroll-area";
import { CalendarClock, CheckCircle2, ClipboardList, Lightbulb, MessageSquareText, Sparkles } from "lucide-react";


const TaskDetail = ({
  detail,
  visible,
  onClose,
  onMark,
  user_id,
} : {
  detail : TaskProps | null,
  visible : boolean,
  onClose : (val : boolean)=> void,
  onMark : ()=> Promise<void>
  user_id : number | string
}) => {
  const [loading, setLoading] = useState(false);
  if(!detail?.id) return null
  

  async function handleUpdateStatus(values : {id : number, status :string}) {
    setLoading(true);
    axios
      .put(`/${user_id}/task/${detail?.id}`, {
        id: values.id,
        status: values.status,
      })
      .then(() => {
        toast.success("Status updated" );
        onClose(false);
      })

      .finally(() => {
        setLoading(false);
        onMark();
      });
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">Task Detail</SheetTitle>
              <SheetDescription className="mt-1">
                Review task scope, timeline, and completion status.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-200px)]">
          <div className="space-y-4 p-5">
            <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
              <div className="border-b bg-muted/15 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Assigned task
                    </div>
                    <h3 className="break-words text-lg font-bold leading-snug">
                      {detail?.task_name || "Untitled task"}
                    </h3>
                  </div>

                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${detail?.status === "Completed"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                    }`}>
                    {detail?.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <DetailTile
                  icon={CheckCircle2}
                  label="Status"
                  value={detail?.status || "N/A"}
                  iconClassName="bg-emerald-50 text-emerald-700 ring-emerald-100"
                />
                <DetailTile
                  icon={CalendarClock}
                  label="Assigned Date"
                  value={detail?.created_at ? moment(detail?.created_at).format("YYYY-MM-DD") : "N/A"}
                  iconClassName="bg-blue-50 text-blue-700 ring-blue-100"
                />
              </div>
            </section>

            {detail?.problem && (
              <section className="grid gap-4">
                <InfoCard
                  icon={MessageSquareText}
                  title="Problem"
                  value={detail?.problem}
                  iconClassName="bg-rose-50 text-rose-700 ring-rose-100"
                />
                {detail?.solution && (
                  <InfoCard
                    icon={Lightbulb}
                    title="Solution"
                    value={detail?.solution}
                    iconClassName="bg-amber-50 text-amber-700 ring-amber-100"
                  />
                )}
              </section>
            )}

            {!detail?.problem && (
              <div className="rounded-2xl border border-dashed bg-muted/15 p-8 text-center text-sm text-muted-foreground">
                No problem or solution details were added for this task.
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t bg-background/95 p-4 backdrop-blur">
          {detail?.status !== "Completed" ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                handleUpdateStatus({
                  ...detail,
                  status: "Completed",
                });
              }}
            >
              {loading && <Spinner />}
              Mark as Completed
            </Button>
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:w-auto">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

function DetailTile({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: ElementType;
  label: string;
  value: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/15 p-3">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  iconClassName,
}: {
  icon: ElementType;
  title: string;
  value: string;
  iconClassName: string;
}) {
  return (
    <section className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
        {value}
      </p>
    </section>
  );
}

export default TaskDetail
