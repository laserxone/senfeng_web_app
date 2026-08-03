import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { TaskProps } from "@/lib/types"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  UserRound,
} from "lucide-react"
import moment from "moment"
import { Badge } from "@/components/ui/badge"
import AddTaskDialog from "@/components/features/tasks/dialogs/add-task-dialog"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"

const RenderTodayTasks = ({
  data,
  onRefresh,
}: {
  data: { total: number; data: TaskProps[] } | null
  onRefresh?: (start: string, end: string) => Promise<void>
}) => {
  const { userID } = useUserDetail()
  const [tasks, setTasks] = useState<TaskProps[]>([])
  const [loadingId, setLoadingId] = useState<TaskProps["id"] | null>(null)

  useEffect(() => {
    setTasks(data?.data || [])
  }, [data])

  const totalTasks = data?.total ?? tasks.length
  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "completed"
  ).length
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  async function handleMarkCompleted(task: TaskProps) {
    setLoadingId(task.id)
    try {
      await axios.put(`/${userID}/task/${task.id}`, {
        id: task.id,
        status: "Completed",
      })
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, status: "Completed" } : item
        )
      )
      toast.success("Task marked completed")
    } catch (error) {
      console.log(error)
      toast.error("Failed to update task")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border p-0 shadow-sm xl:h-[600px]">
      <CardHeader className="shrink-0 border-b bg-slate-50/80 p-4 dark:bg-zinc-900/70">
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
            <Badge
              variant="outline"
              className="w-fit rounded-full bg-background px-2.5 py-1 text-xs"
            >
              {totalTasks} tasks today
            </Badge>

            <AddTaskDialog
              icon
              size="sm"
              btnClassname="h-8 gap-2 rounded-md bg-background"
              variant="outline"
              placeholder="Plan your day"
              onRefresh={async () => {
                const startDate = moment().startOf("day").toISOString()
                const endDate = moment().endOf("day").toISOString()
                await onRefresh?.(startDate, endDate)
              }}
              user_id={userID}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {tasks.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center rounded-lg border border-dashed bg-muted/15 p-5 text-center">
            <div>
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">No tasks for today</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New assigned tasks will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-2">
              {tasks.map((task) => {
                const normalizedStatus = task.status?.toLowerCase()
                const isCompleted = normalizedStatus === "completed"
                const isPending = normalizedStatus === "pending"

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
                            className={`h-6 rounded-full px-2 text-[11px] ${
                              isCompleted
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
                            <Badge
                              variant="outline"
                              className="h-6 rounded-full bg-background px-2 text-[11px]"
                            >
                              {task.type}
                            </Badge>
                          )}
                        </div>

                        <h3 className="mt-2 text-sm font-bold break-words">
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
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed break-words text-muted-foreground">
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
                )
              })}
            </div>
          </div>
        )}

        <div className="shrink-0 rounded-lg border bg-background p-3">
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
    </Card>
  )
}

export default RenderTodayTasks
