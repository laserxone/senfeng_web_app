"use client";
import { ArrowUpDown, Building2, CalendarDays, CheckCircle2, ClipboardList, Clock, DownloadIcon, MapPin, Phone, Plus, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";

import { ExtraCustomer, NewlyAssignedCustomer, TaskProps, TodayTask } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequiredStar } from "../RequiredStar";
import AddCustomerDialog from "../addCustomer";
import AppCalendar from "../appCalendar";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { AddTask } from "./task";


type CustomerEmployeeProps = {

  customer_data: ExtraCustomer[];
  onRefresh: () => void | Promise<void>;
  ownership: boolean;
  totalCustomerText?: string;
  height?: string
  task_data?: { total: number, data: TaskProps[] } | null
  newly_assigned?: null | { total: number, data: NewlyAssignedCustomer[] }
  onRefreshTask?: (start: string, end: string) => Promise<void>
};

export default function CustomerEmployee({
  customer_data,
  onRefresh,
  ownership,
  height,
  task_data,
  newly_assigned,
  onRefreshTask
}: CustomerEmployeeProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState<ExtraCustomer[]>([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const { userID, designation, customer_add_access, base_route, route_branch } =
    useUserDetail();
  const [selectedCustomer, setSelectedCustomer] = useState<ExtraCustomer | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [next, setNext] = useState<Date | null>(null);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (customer_data && customer_data.length > 0) {
      setData(customer_data);
    }
  }, [customer_data]);


  const columns = useMemo(() => {
    const baseColumns: ColumnDef<ExtraCustomer>[] = [
      {
        accessorKey: "owner",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
      },
      {
        accessorKey: "name",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "industry",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("industry")}</div>,
      },
      {
        accessorKey: "number",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("number")}</div>,
      },
      {
        accessorKey: "location",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
      },
      {
        accessorKey: "created_at",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
          </div>
        ),
      },
    ];

    if (
      designation === "Customer Relationship Manager" ||
      designation === "Social Media Manager"
    ) {
      baseColumns.push({
        id: "actions",
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomer(currentItem);
                setShowFeedback(true);
              }}
            >
              Take Feedback
            </Button>
          );
        },
      });
    }

    return baseColumns;
  }, [userID]);

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${userID}/feedback`, {
        feedback: feedback,
        type: "feedback",
        customer_id: selectedCustomer?.id,
        user_id: userID,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
        setShowFeedback(false);
      });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">

      <PageTable
        height={height}
        columns={columns}
        data={data}
        onRowClick={(val, event) => {
          if (val?.id) {
            const url = `/${base_route}/${val?.member ? "member" : "customer"
              }/${val.id}`;

            if (event.ctrlKey || event.metaKey) {
              window.open(url, "_blank");
            } else {

              router.push(url);
            }
          }
        }}
      >
        <div className=" flex justify-between">
          <div className="flex gap-4 flex-wrap">
            {customer_add_access && (
              <Button onClick={() => setAddCustomer(true)}>
                <Plus />   Add Customer
              </Button>
            )}
            {newly_assigned && <RenderNewlyAssigned data={newly_assigned} />}
          </div>
        </div>
      </PageTable>


      {task_data && <RenderTodayTasks data={task_data} onRefresh={onRefreshTask} />}

      <AddCustomerDialog
        office={route_branch}
        user_id={userID}
        user_designation={designation}
        ownership={ownership}
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={async () => {
          setData([]);

          await onRefresh();
        }}
      />

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <div className="flex flex-1 flex-col gap-2">
              <h1>
                Enter Feedback <RequiredStar />
              </h1>
              <Input
                placeholder="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <h1>
                Next Follow Up <RequiredStar />
              </h1>
              <AppCalendar date={next} onChange={setNext} min={new Date()} max={""} />

              <div className="flex flex-row items-center gap-2">
                <h1>Top Follow up</h1>
                <Checkbox
                  checked={top}
                  onCheckedChange={(checked) => {
                    setTop(checked === true);
                  }}
                />
              </div>

              <div className="flex flex-row items-center gap-2">
                <h1>Satisfactory?</h1>
                <Checkbox
                  checked={satisfactory}
                  onCheckedChange={(checked) => {
                    setSatisfactory(checked === true);
                  }}
                />
              </div>
              <Button
                disabled={!next || !feedback}
                onClick={() => {
                  handleSaveFeedback();
                }}
              >
                {loading && <Spinner />} Save
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
}

const RenderTodayTasks = ({ data, onRefresh }: {
  data: { total: number, data: TaskProps[] } | null,
  onRefresh?: (start: string, end: string) => Promise<void>
}) => {
  const { userID } = useUserDetail();
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [loadingId, setLoadingId] = useState<TaskProps["id"] | null>(null);
  const [addTaskVisible, setAddTaskVisible] = useState(false)
  useEffect(() => {
    setTasks(data?.data || []);
  }, [data]);

  const totalTasks = data?.total ?? tasks.length;
  const completedTasks = tasks.filter((task) => task.status?.toLowerCase() === "completed").length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  async function handleMarkCompleted(task: TaskProps) {
    setLoadingId(task.id);
    try {
      await axios.put(`/${userID}/task/${task.id}`, {
        id: task.id,
        status: "Completed",
      });
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, status: "Completed" } : item
        )
      );
      toast.success("Task marked completed");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update task");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <CardHeader className="border-b bg-slate-50/80 p-4 dark:bg-zinc-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">
                Today Tasks
              </CardTitle>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {moment().format("dddd, MMMM D, YYYY")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="w-fit rounded-full bg-background px-2.5 py-1 text-xs">
              {totalTasks} tasks today
            </Badge>
            <Button onClick={() => setAddTaskVisible(true)} type="button" variant="outline" size="sm" className="h-8 gap-2 rounded-md bg-background">
              <CalendarDays className="h-3.5 w-3.5" />
              Plan your day
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4">
        {tasks.length === 0 ? (
          <div className="grid min-h-28 place-items-center rounded-lg border border-dashed bg-muted/15 p-5 text-center">
            <div>
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">No tasks for today</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New assigned tasks will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {tasks.map((task) => {
              const normalizedStatus = task.status?.toLowerCase();
              const isCompleted = normalizedStatus === "completed";
              const isPending = normalizedStatus === "pending";

              return (
                <div
                  key={task.id}
                  className="rounded-lg border bg-muted/10 p-3 transition hover:bg-muted/20"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`h-6 rounded-full px-2 text-[11px] ${isCompleted
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : isPending
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {task.status || "Pending"}
                        </Badge>
                        {task.type && (
                          <Badge variant="outline" className="h-6 rounded-full bg-background px-2 text-[11px]">
                            {task.type}
                          </Badge>
                        )}
                      </div>

                      <h3 className="mt-2 break-words text-sm font-bold">
                        {task.task_name || "Untitled task"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                          <UserRound className="h-3 w-3" />
                          {task.customer_name || "No customer"}
                        </span>
                        {task.location && (
                          <span className="rounded-full border bg-background px-2.5 py-1">
                            {task.location}
                          </span>
                        )}
                      </div>

                      {task.problem && (
                        <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                          {task.problem}
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <Button
                        className="h-8 w-full gap-2 rounded-md text-xs lg:w-auto"
                        disabled={loadingId === task.id}
                        onClick={() => handleMarkCompleted(task)}
                      >
                        {loadingId === task.id ? (
                          <Spinner />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border bg-background p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold">
              {completedTasks} of {totalTasks} completed
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {progress}%
            </p>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardContent>

      <AddTask
        onRefresh={async () => {
          const startDate = moment().startOf("day").toISOString();
          const endDate = moment().endOf("day").toISOString();
          await onRefresh?.(startDate, endDate)
        }}
        user_id={userID}
        visible={addTaskVisible}
        onClose={setAddTaskVisible}
      />
    </Card>
  )
}

const RenderNewlyAssigned = ({ data }: { data: { total: number, data: NewlyAssignedCustomer[] } }) => {
  const { base_route } = useUserDetail()
  const customers = data?.data || []

  const formatNumber = (value: NewlyAssignedCustomer["number"]) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ")
    return value || "N/A"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white rounded-md"
        >
          <DownloadIcon />  New Customers Assigned
          <Badge >
            {data?.total || 0}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[94vw] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <DownloadIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold tracking-tight">
                New Customers Assigned
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.total || 0} customers assigned this month.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-150px)]">
          <div className="space-y-3 p-5">
            {customers.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed bg-muted/15 p-6 text-center">
                <div>
                  <Users className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No new assigned customers</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assigned customers will appear here.
                  </p>
                </div>
              </div>
            ) : (
              customers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-background p-4 shadow-sm transition hover:bg-muted/15"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      href={`/${base_route}/${item.member ? "member" : "customer"}/${item.id}`}
                      className="flex min-w-0 items-start gap-3"
                      target="_blank"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-base font-bold hover:underline">
                          {item.name || "Unnamed customer"}
                        </span>
                        <span className="mt-1 block break-words text-sm text-muted-foreground">
                          {item.owner || "No owner"}
                        </span>
                      </span>
                    </Link>

                    <Badge variant="outline" className="w-fit rounded-full bg-muted/20 px-2.5 py-1">
                      {item.member ? "Member" : "Customer"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
                      <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="truncate">{formatNumber(item.number)}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="truncate">{item.location || "N/A"}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
