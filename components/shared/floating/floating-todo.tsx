"use client"
import { Button } from "@/components/ui/button"
import { useTodos } from "@/hooks/use-todos"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { ListCheck, X } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { BellNotification } from "@/components/shared/notifications/NotificationBadge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function FloatingTodoButton({ pending }: { pending: number }) {
  return (
    <Button
      size="icon"
      variant="outline"
      className="relative rounded-xl"
      aria-label="Open todo list"
    >
      <BellNotification Icon={ListCheck} count={pending} />
    </Button>
  )
}

export default function FloatingTodo() {
  const [isOpen, setIsOpen] = useState(false)
  const { tasks, setTasks, fetchTasks } = useTodos()
  const [newTask, setNewTask] = useState("")
  const { userID } = useUserDetail()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userID) fetchTasks()
  }, [userID])

  const addTask = async () => {
    if (!newTask.trim()) return

    const tempId = Date.now()
    const optimisticTask = { id: tempId, title: newTask, is_done: false }
    setTasks((prev) => [...prev, optimisticTask])
    setNewTask("")

    try {
      const response = await axios.post(`/${userID}/todo`, {
        title: newTask,
      })

      setTasks((prev) => prev.map((t) => (t.id === tempId ? response.data : t)))
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
      console.error("Failed to add task:", err)
    }
  }

  const toggleTask = async (id: number, done: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_done: done } : t))
    )

    try {
      await axios.put(`/${userID}/todo/${id}`, {
        is_done: done,
      })
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_done: !done } : t))
      )
      console.error("Failed to update task:", err)
    }
  }

  async function handleClear() {
    setLoading(true)
    try {
      await axios.get(`/${userID}/todo/clear`)
      await fetchTasks()
    } finally {
      setLoading(false)
    }
  }

  const pendingTasks = tasks.filter((task) => !task.is_done)
  const completedTasks = tasks.filter((task) => task.is_done)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
       <Button
      size="icon"
      variant="outline"
      className="relative rounded-xl"
      aria-label="Open todo list"
    >
      <BellNotification Icon={ListCheck} count={pendingTasks.length} />
    </Button>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <SheetTitle className="text-lg font-semibold tracking-tight">
                My Todo List
              </SheetTitle>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {pendingTasks.length}
              </span>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close todo list"
              >
                <X />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription className="text-xs">
            Keep track of your pending and completed tasks
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Pending
                </Label>
                <ul className="mt-2 space-y-2">
                  {pendingTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-col rounded-lg border p-2 transition hover:bg-accent"
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          className="mt-1"
                          checked={t.is_done}
                          onCheckedChange={(checked: boolean) =>
                            toggleTask(t.id, checked)
                          }
                        />
                        <span className="word-break break-all">{t.title}</span>
                      </div>
                      <span className="text-right text-xs text-gray-500">
                        {t.created_at &&
                          moment(t.created_at).format("YYYY-MM-DD")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex w-full items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Completed
                  </Label>

                  {completedTasks.length > 0 && (
                    <Button
                      disabled={loading}
                      variant="destructive"
                      size="sm"
                      onClick={handleClear}
                    >
                      {loading && <Spinner />} Clear
                    </Button>
                  )}
                </div>
                <ul className="mt-2 space-y-2">
                  {completedTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-col rounded-lg border p-2 transition hover:bg-accent"
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          className="mt-1"
                          checked={t.is_done}
                          onCheckedChange={(checked: boolean) =>
                            toggleTask(t.id, checked)
                          }
                        />
                        <span className="word-break break-all">{t.title}</span>
                      </div>
                      <span className="text-right text-xs text-gray-500">
                        {t.created_at &&
                          moment(t.created_at).format("YYYY-MM-DD")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New Task..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTask()
                }
              }}
            />
            <Button onClick={addTask}>Add</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
