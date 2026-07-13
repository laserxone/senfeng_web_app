"use client";

import { RequiredStar } from "@/components/RequiredStar";
import { CustomerSearch } from "@/components/customer-components/customer-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";
import axios from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AddTaskMode = "self" | "team";

type AddTaskDialogProps = {

  onRefresh: () => Promise<void>;
  mode?: AddTaskMode;
  user_id?: number | string;
  assigned_by?: number | string;
  title?: string;
  placeholder?: string
  icon ?: boolean
variant ?: "default" | "link" | "outline" | "secondary" | "ghost" | "destructive"
size ?: "default" | "icon" | "xs" | "sm" | "lg" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined
btnClassname ?: string
children?: ReactNode
};

const defaultValues = {
  radio: "office" as const,
  task: "",
  client: null,
  user: undefined,
  problem: "",
  solution: "",
};

const TaskTypeRadio = ({
  onSelection,
  value,
}: {
  onSelection: (val: string) => void;
  value: string;
}) => {
  return (
    <RadioGroup defaultValue={value} onValueChange={onSelection} className="flex">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="office" id="task-office" />
        <Label htmlFor="task-office">Office</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="client" id="task-client" />
        <Label htmlFor="task-client">Client</Label>
      </div>
    </RadioGroup>
  );
};

export default function AddTaskDialog({
icon = false,
variant="default",
size="default",
btnClassname = "",
children,
  onRefresh,
  mode = "self",
  user_id,
  title = "Add new task",
  placeholder = "Add Task"
}: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const isTeamTask = mode === "team";
  const creatorId = user_id;
  const [open, setOpen] = useState(false)

  const formSchema = useMemo(
    () =>
      z
        .object({
          radio: z.enum(["office", "client"]),
          task: z.string().min(5, {
            message: "Task must be at least 5 characters.",
          }),
          client: z.number().nullable().optional(),
          user: z.number().optional(),
          problem: z.string().optional(),
          solution: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (isTeamTask && !data.user) {
            ctx.addIssue({
              path: ["user"],
              code: z.ZodIssueCode.custom,
              message: "User is required",
            });
          }

          if (data.radio === "client" && !data.client) {
            ctx.addIssue({
              path: ["client"],
              code: z.ZodIssueCode.custom,
              message: "Client is required.",
            });

            if (isTeamTask) {
              ctx.addIssue({
                path: ["problem"],
                code: z.ZodIssueCode.custom,
                message: "Problem is required.",
              });

              ctx.addIssue({
                path: ["solution"],
                code: z.ZodIssueCode.custom,
                message: "Solution is required.",
              });
            }
          }
        }),
    [isTeamTask]
  );

  type TaskFormValues = z.infer<typeof formSchema>;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, reset, handleSubmit, control } = form;
  const selectedRadio = watch("radio");

  const onSubmit = (values: TaskFormValues) => {
    if (!creatorId) return;

    setLoading(true);

    const payload = isTeamTask
      ? {
        task_name: values.task,
        type: values.radio == "office" ? "Office Task" : "Client Task",
        client: values.client,
        status: "Assigned",
        assigned_to: values.user,
        assigned_by: creatorId,
        problem: values.problem,
        solution: values.solution,
      }
      : {
        task_name: values.task,
        type: values.radio == "office" ? "Office Task" : "Client Visit",
        client: values.client,
        status: "Pending",
        assigned_to: creatorId,
      };

    axios
      .post(isTeamTask ? `${creatorId}/task` : `/${creatorId}/task`, payload)
      .then(() => {
        onRefresh();
        handleClose(false);
        toast.success("Task created successfully");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function handleClose(val: boolean) {
    setOpen(val);

    if (!val) {
      reset(defaultValues);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className={btnClassname}>
            {icon && <CalendarDays className="h-3.5 w-3.5" />} {placeholder}
          </Button>
        </DialogTrigger>
      )}
        <DialogContent className="w-full sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-160px)]">
            <div className="py-4">
              <form
                onSubmit={handleSubmit(onSubmit, (e) => {
                  console.log(e);
                })}
                className="space-y-4"
              >
                <FieldGroup>
                  <Controller
                    name="radio"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Type <RequiredStar />
                        </FieldLabel>

                        <TaskTypeRadio
                          value={field.value}
                          onSelection={(val) => {
                            field.onChange(val);
                          }}
                        />

                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="task"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Task <RequiredStar />
                        </FieldLabel>

                        <Input placeholder="Enter task" {...field} />

                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {isTeamTask && (
                    <Controller
                      name="user"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Select Employee <RequiredStar />
                          </FieldLabel>

                          <UserSearch value={field.value} onReturn={field.onChange} />

                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  )}

                  {selectedRadio === "client" && (
                    <>
                      <Controller
                        name="client"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>
                              Client <RequiredStar />
                            </FieldLabel>

                            <CustomerSearch value={field.value} onReturn={field.onChange} />

                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      {isTeamTask && (
                        <>
                          <Controller
                            name="problem"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Problem <RequiredStar />
                                </FieldLabel>

                                <Input placeholder="Describe the problem" {...field} />

                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />

                          <Controller
                            name="solution"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Solution <RequiredStar />
                                </FieldLabel>

                                <Input placeholder="Proposed solution" {...field} />

                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </>
                      )}
                    </>
                  )}

                  <Button disabled={loading || !creatorId} className="w-full" type="submit">
                    {loading && <Spinner />} Submit
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
  );
}

export { AddTaskDialog };
