"use client";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/hooks/use-todos";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { BadgeCount } from "./NotificationBadge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

function FloatingTodoButton({ onClick, pending }) {
  return (
    <div>
      <BadgeCount count={pending} offset={{ top: 0, right: 0 }}>
        <div
          onClick={onClick}
          className="cursor-pointer
    bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500
    text-white h-[50px] w-[50px] shadow-2xl flex items-center justify-center
    hover:scale-90 active:scale-95 transition-transform duration-200 ease-in-out
    rounded-full rounded-bl-2xl relative"
        >
          <span className="relative drop-shadow-lg text-xl">📝</span>
        </div>
      </BadgeCount>
    </div>
  );
}

export default function FloatingTodo() {
  const [isOpen, setIsOpen] = useState(false);
  const { tasks, setTasks, fetchTasks } = useTodos();
  const [newTask, setNewTask] = useState("");
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (UserState.value.data?.id) fetchTasks();
  }, [UserState]);

  const addTask = async () => {
    if (!newTask.trim()) return;

    // 1. Optimistically update frontend
    const tempId = Date.now(); // temporary ID
    const optimisticTask = { id: tempId, title: newTask, is_done: false };
    setTasks((prev) => [...prev, optimisticTask]);
    setNewTask("");

    try {
      // 2. Send to backend
      const response = await axios.post(`/${UserState.value.data?.id}/todo`, {
        title: newTask,
      });

      // 3. Replace temp task with actual saved one
      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? response.data : t))
      );
    } catch (err) {
      // 4. Rollback on error
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      console.error("Failed to add task:", err);
    }
  };

  const toggleTask = async (id, done) => {
    console.log(id, done);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_done: done } : t))
    );

    try {
      await axios.put(`/${UserState.value.data?.id}/todo/${id}`, {
        is_done: done,
      });
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_done: !done } : t))
      );
      console.error("Failed to update task:", err);
    }
  };

  return (
    <>
      <FloatingTodoButton
        onClick={() => setIsOpen(!isOpen)}
        pending={tasks.filter((t) => !t.is_done).length}
      />

      <div
        className={`fixed bottom-20 right-6 w-96 h-[600px] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl flex flex-col overflow-hidden border transition-all duration-200 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">My Todo List</p>
          </div>
          <div
            className="cursor-pointer hover:text-red-500"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            <X size={18} />
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
                        className="flex items-center gap-2 rounded-lg border p-2 hover:bg-accent transition"
                      >
                        <Checkbox
                          checked={t.is_done}
                          onCheckedChange={(checked) =>
                            toggleTask(t.id, checked)
                          }
                        />
                        <span>{t.title}</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Completed
                </Label>
                <ul className="mt-2 space-y-2">
                  {tasks
                    .filter((item) => item.is_done)
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 rounded-lg border p-2 bg-muted/50"
                      >
                        <Checkbox
                          checked={t.is_done}
                          onCheckedChange={(checked) =>
                            toggleTask(t.id, checked)
                          }
                        />
                        <span className="line-through text-muted-foreground">
                          {t.title}
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
            />
            <Button onClick={addTask}>Add</Button>
          </div>
        </div>
      </div>
    </>
  );
}
