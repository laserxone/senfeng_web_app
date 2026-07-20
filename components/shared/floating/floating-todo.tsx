"use client";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/hooks/use-todos";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ListCheck, X } from "lucide-react";
import moment from "moment";
import { MouseEventHandler, useEffect, useState } from "react";
import { BellNotification } from "@/components/shared/notifications/NotificationBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";

function FloatingTodoButton({ onClick, pending }: { onClick: MouseEventHandler<HTMLButtonElement>, pending: number }) {
  return (
    <Button size="icon" variant="outline" onClick={onClick}>
      <BellNotification Icon={ListCheck} count={pending} />
    </Button>
  )
}


export default function FloatingTodo() {
  const [isOpen, setIsOpen] = useState(false);
  const { tasks, setTasks, fetchTasks } = useTodos();
  const [newTask, setNewTask] = useState("");
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (userID) fetchTasks();
  }, [userID]);

  const addTask = async () => {
    if (!newTask.trim()) return;

    const tempId = Date.now();
    const optimisticTask = { id: tempId, title: newTask, is_done: false };
    setTasks((prev) => [...prev, optimisticTask]);
    setNewTask("");

    try {
      const response = await axios.post(`/${userID}/todo`, {
        title: newTask,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? response.data : t)),
      );
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      console.error("Failed to add task:", err);
    }
  };

  const toggleTask = async (id: number, done: boolean) => {

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_done: done } : t)),
    );

    try {
      await axios.put(`/${userID}/todo/${id}`, {
        is_done: done,
      });
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_done: !done } : t)),
      );
      console.error("Failed to update task:", err);
    }
  };

  async function handleClear() {
    setLoading(true);
    try {
      await axios.get(`/${userID}/todo/clear`);
      await fetchTasks();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <FloatingTodoButton
        onClick={() => setIsOpen(!isOpen)}
        pending={tasks.filter((t) => !t.is_done).length}
      />

      <div
        className={`absolute bottom-0 right-0  w-[calc(100vw-30px)] sm:w-96 h-[600px]
    bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col
    overflow-hidden border transition-all z-99 duration-200 z-10 sm:mx-0 ${isOpen ? "block" : "hidden"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">My Todo List</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="cursor-pointer hover:text-red-500"
              onClick={() => {
                setIsOpen(!isOpen);
              }}
            >
              <X size={18} />
            </div>
          </div>
        </div>

        <div className="flex-1 p-2">
          <ScrollArea className="flex-1 h-[480px] my-2 pr-4">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Pending
                </Label>
                <ul className="mt-2 space-y-2">
                  {tasks
                    .filter((item) => !item.is_done)
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-col rounded-lg border p-2 hover:bg-accent transition"
                      >
                        <div className="flex gap-2 items-start">
                          <Checkbox
                            className="mt-1"
                            checked={t.is_done}
                            onCheckedChange={(checked: boolean) =>
                              toggleTask(t.id, checked)
                            }
                          />
                          <span className="word-break break-all">
                            {t.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 text-right">
                          {t.created_at &&
                            moment(t.created_at).format("YYYY-MM-DD")}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <div className="flex w-full justify-between items-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Completed
                  </Label>

                  {tasks.filter((item) => item.is_done).length > 0 && (
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
                  {tasks
                    .filter((item) => item.is_done)
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-col rounded-lg border p-2 hover:bg-accent transition"
                      >
                        <div className="flex gap-2 items-start">
                          <Checkbox
                            className="mt-1"
                            checked={t.is_done}
                            onCheckedChange={(checked: boolean) =>
                              toggleTask(t.id, checked)
                            }
                          />
                          <span className="word-break break-all">
                            {t.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 text-right">
                          {t.created_at &&
                            moment(t.created_at).format("YYYY-MM-DD")}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New Task..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask();
                }
              }}
            />
            <Button onClick={addTask}>Add</Button>
          </div>
        </div>
      </div>
    </>
  );
}
